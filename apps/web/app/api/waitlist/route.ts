import { env } from '@/env';
import {
  AndroidAccessStorageError,
  sendPendingAndroidAccessNotifications,
  upsertMarketingAndroidAccess,
} from '@/lib/android-access';
import { createRateLimiter, slidingWindow } from '@repo/rate-limit';
import { headers } from 'next/headers';

export const runtime = 'nodejs';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function GET() {
  return Response.json({ ok: true });
}

/**
 * Two limits, because they stop different things. The IP limit stops one caller
 * enumerating or hammering the form. The per-address limit stops the nastier
 * one: the endpoint sends mail to whatever address it is handed, so repeating a
 * stranger's address turned this into an email cannon pointed at them (and at
 * the staff inbox) even though the duplicate insert was already a no-op.
 */
async function rateLimited(email: string): Promise<boolean> {
  if (!(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN)) {
    // Upstash is the whole mechanism here, so without it this endpoint is back
    // to being an open mailer. Say so rather than failing open in silence.
    // biome-ignore lint/suspicious/noConsole: A missing abuse-control dependency must be visible to operators.
    console.warn(
      '[waitlist] UPSTASH_REDIS_REST_URL/TOKEN unset: signup rate limiting is DISABLED'
    );
    return false;
  }

  const ip = (await headers()).get('x-forwarded-for') ?? 'unknown';

  const [byIp, byEmail] = await Promise.all([
    createRateLimiter({
      limiter: slidingWindow(5, '1h'),
      prefix: 'waitlist_ip',
    }).limit(ip),
    createRateLimiter({
      limiter: slidingWindow(1, '1d'),
      prefix: 'waitlist_email',
    }).limit(email.toLowerCase()),
  ]);

  return !(byIp.success && byEmail.success);
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (typeof email !== 'string' || !EMAIL_PATTERN.test(email)) {
      return Response.json({ error: 'Invalid email' }, { status: 400 });
    }

    if (await rateLimited(email)) {
      // Same shape as success: whether an address is already on the list is not
      // something an anonymous caller should be able to probe.
      return Response.json({ ok: true, accessUrl: null, emailed: false });
    }

    // Storage is the source of truth. Mail happens only after this returns.
    const savedRequest = await upsertMarketingAndroidAccess(email);
    if (savedRequest.inviteSentAt) {
      return Response.json({
        ok: true,
        accessUrl: null,
        emailed: false,
        saved: true,
      });
    }

    let emailed = false;
    try {
      const notifications =
        await sendPendingAndroidAccessNotifications(savedRequest);
      emailed = notifications.pendingEmail === 'sent';
    } catch (sendError) {
      // biome-ignore lint/suspicious/noConsole: The signup is saved, so notification failures need an operator receipt.
      console.error(
        '[waitlist] signup saved but notifications failed',
        savedRequest.id,
        sendError
      );
    }

    return Response.json({ ok: true, accessUrl: null, emailed, saved: true });
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: The route follows the existing server-side error logging pattern.
    console.error('[waitlist] request failed', error);

    if (error instanceof AndroidAccessStorageError) {
      return Response.json(
        { error: 'Could not save signup' },
        { status: error.status === 503 ? 503 : 502 }
      );
    }

    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
