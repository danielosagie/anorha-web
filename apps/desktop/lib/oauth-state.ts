import crypto from 'node:crypto';
import { cookies } from 'next/headers';

/**
 * Single-use, user-bound OAuth `state` for the marketplace connect flows.
 *
 * `state` exists to prove the callback belongs to the person who started the
 * flow. A value that is never stored cannot prove anything, so a `state` that
 * only makes the round trip in the URL is decoration: anyone could hand a
 * signed-in seller a callback URL carrying their own authorization code and get
 * the attacker's marketplace account attached to the seller's org.
 *
 * So the nonce is minted with a CSPRNG, bound to the Clerk user id, signed, and
 * parked in an HttpOnly cookie that the callback consumes exactly once.
 *
 * Signed with CLERK_SECRET_KEY rather than a new env var: it is already required
 * for this app to boot, so there is no deploy where signing silently degrades.
 */

const COOKIE_PREFIX = 'oauth_state_';
const MAX_AGE_SECONDS = 600;

function signingKey(): string {
  const key = process.env.CLERK_SECRET_KEY;
  if (!key) {
    throw new Error('CLERK_SECRET_KEY is required to sign OAuth state');
  }
  return key;
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', signingKey()).update(payload).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    return false;
  }
  return crypto.timingSafeEqual(left, right);
}

/** Mint a nonce for `provider`, remember it for this user, and return it for the authorize URL. */
export async function issueOAuthState(
  provider: string,
  userId: string
): Promise<string> {
  const nonce = crypto.randomBytes(32).toString('base64url');
  const payload = `${nonce}.${userId}`;
  const jar = await cookies();

  jar.set(`${COOKIE_PREFIX}${provider}`, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });

  return nonce;
}

/**
 * Verify the callback's `state` against the stored one and burn it. Always
 * clears the cookie, including on failure, so a rejected attempt cannot be
 * retried against the same nonce.
 */
export async function consumeOAuthState(
  provider: string,
  userId: string,
  presented: string | null
): Promise<boolean> {
  const jar = await cookies();
  const name = `${COOKIE_PREFIX}${provider}`;
  const stored = jar.get(name)?.value;

  jar.delete(name);

  if (!stored || !presented) {
    return false;
  }

  const lastDot = stored.lastIndexOf('.');
  if (lastDot < 0) {
    return false;
  }

  const payload = stored.slice(0, lastDot);
  const signature = stored.slice(lastDot + 1);
  if (!safeEqual(signature, sign(payload))) {
    return false;
  }

  const [nonce, boundUserId] = payload.split('.');
  if (!(nonce && boundUserId) || boundUserId !== userId) {
    return false;
  }

  return safeEqual(nonce, presented);
}
