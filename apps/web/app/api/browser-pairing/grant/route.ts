import { env } from '@/env';
import { auth } from '@repo/auth/server';
import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';

type MintGrantResult = {
  grant: string;
};

const mintGrant = makeFunctionReference<
  'action',
  Record<string, never>,
  MintGrantResult
>('browserPairing:mintGrant');

const jsonHeaders = {
  'Cache-Control': 'no-store',
};

export async function POST() {
  try {
    const { getToken, userId } = await auth();

    if (!userId) {
      return Response.json(
        { error: 'unauthorized' },
        { headers: jsonHeaders, status: 401 }
      );
    }

    // Plain session token first: the Convex deployment's customJwt fallback
    // accepts it (see sssync-bknd convex/auth.config.ts), and this Clerk
    // instance has no "convex" template configured. Template kept as a
    // best-effort fallback in case one is added later.
    const token =
      (await getToken().catch(() => null)) ??
      (await getToken({ template: 'convex' }).catch(() => null));

    if (!token) {
      return Response.json(
        { error: 'unauthorized' },
        { headers: jsonHeaders, status: 401 }
      );
    }

    // A fresh client per request prevents one user's Clerk token from being
    // shared with another concurrent request.
    const convex = new ConvexHttpClient(env.CONVEX_URL, {
      auth: token,
      logger: false,
    });
    const result = await convex.action(mintGrant, {});

    if (!result?.grant) {
      throw new Error('Convex returned an invalid pairing grant response.');
    }

    return Response.json(
      { grant: result.grant },
      { headers: jsonHeaders, status: 200 }
    );
  } catch (error) {
    console.error('[browser-pairing/grant] Unable to mint grant.', error);

    return Response.json(
      { error: 'grant_unavailable' },
      { headers: jsonHeaders, status: 502 }
    );
  }
}
