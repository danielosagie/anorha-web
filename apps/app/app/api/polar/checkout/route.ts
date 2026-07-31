import { Checkout } from '@polar-sh/nextjs';
import { auth } from '@repo/auth/server';
import { keys } from '@repo/payments/keys';
import { type NextRequest, NextResponse } from 'next/server';
import { getPolarProductIds } from '@/lib/polar-config';

/**
 * Checkout is authenticated and only ever sells the tiers we actually offer.
 * Open to anyone, with a caller-chosen product id, it was a free checkout-object
 * factory against our Polar account for any product id someone cared to guess.
 *
 * Errors stay generic on purpose: the previous version echoed the vendor
 * exception and server mode straight back to the caller.
 */
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
    // Otherwise a deploy without the product ids rejects every checkout with a
    // 400 that reads like the caller's fault.
    console.error(
      '[polar/checkout] No product ids configured: set NEXT_PUBLIC_POLAR_GROWTH_PRODUCT_ID and NEXT_PUBLIC_POLAR_TEAMS_PRODUCT_ID'
    );
    return NextResponse.json({ error: 'Checkout unavailable' }, { status: 500 });
  }

  if (!requested || !allowed.includes(requested)) {
    console.warn(`[polar/checkout] Rejected product id: ${requested}`);
    return NextResponse.json({ error: 'Unknown product' }, { status: 400 });
  }

  try {
    const checkout = Checkout({
      accessToken: keys().POLAR_ACCESS_TOKEN,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing/success`,
      server: (process.env.POLAR_API_SERVER as 'production' | 'sandbox') || 'sandbox',
      theme: 'light',
    });

    return await checkout(req);
  } catch (error) {
    console.error('[polar/checkout] Checkout failed:', error);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
};
