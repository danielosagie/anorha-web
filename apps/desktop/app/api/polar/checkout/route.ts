import { Checkout } from '@polar-sh/nextjs';
import { auth } from '@repo/auth/server';
import { PolarConfigError, keys, polarServer } from '@repo/payments/keys';
import { type NextRequest, NextResponse } from 'next/server';
import { getPolarProductIds } from '@/lib/polar-config';

/**
 * Mirrors apps/app. This route used to be open to anyone with a caller-chosen
 * product id, which made it a free checkout-object factory against our Polar
 * account, and it echoed the vendor exception and server mode back to the
 * caller. Tiers are a closed set, so the caller only gets to pick one we sell.
 */

function firstHeaderValue(value: string | null): string | undefined {
  return value?.split(',')[0]?.trim() || undefined;
}

/**
 * Polar sends the seller here after paying, so it has to be the origin they are
 * actually on. NEXT_PUBLIC_APP_URL is baked in at build time and ships as
 * http://localhost:3000, which dropped paying customers on a machine that isn't
 * there.
 */
function resolveOrigin(req: NextRequest): string {
  const host = firstHeaderValue(
    req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  );

  if (host) {
    const protocol =
      firstHeaderValue(req.headers.get('x-forwarded-proto')) ??
      (host.startsWith('localhost') || host.startsWith('127.0.0.1')
        ? 'http'
        : 'https');

    return `${protocol}://${host}`;
  }

  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

export const GET = async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const requested = new URL(req.url).searchParams.get('products');
  const allowed = Object.values(getPolarProductIds()).filter(
    (id): id is string => typeof id === 'string' && !id.startsWith('missing-')
  );

  if (allowed.length === 0) {
    console.error(
      '[polar/checkout] No product ids configured: set NEXT_PUBLIC_POLAR_GROWTH_PRODUCT_ID and NEXT_PUBLIC_POLAR_TEAMS_PRODUCT_ID'
    );
    return NextResponse.json({ error: 'Checkout unavailable' }, { status: 500 });
  }

  if (!requested || !allowed.includes(requested)) {
    console.warn(`[polar/checkout] Rejected product id: ${requested}`);
    return NextResponse.json({ error: 'Unknown product' }, { status: 400 });
  }

  let server: 'production' | 'sandbox';
  try {
    server = polarServer();
  } catch (error) {
    if (error instanceof PolarConfigError) {
      console.error(`[polar/checkout] ${error.message}`);
      return NextResponse.json(
        { error: 'Checkout unavailable' },
        { status: 500 }
      );
    }
    throw error;
  }

  try {
    const checkout = Checkout({
      accessToken: keys().POLAR_ACCESS_TOKEN,
      successUrl: `${resolveOrigin(req)}/billing/success`,
      server,
      theme: 'light',
    });

    return await checkout(req);
  } catch (error) {
    console.error('[polar/checkout] Checkout failed:', error);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
};
