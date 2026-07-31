import { auth } from '@repo/auth/server';
import { stripe } from '@repo/payments';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * `price` used to name an environment variable that the route then read straight
 * out of process.env. That let an unauthenticated caller probe which env vars
 * exist (the 400 said so) and bill against any of them that happened to hold a
 * price id. Tiers are a closed set, so they are spelled out here and the caller
 * only gets to pick one by name.
 */
const PRICE_ENV_BY_TIER = {
  growth: 'STRIPE_GROWTH_PRICE_ID',
  teams: 'STRIPE_TEAMS_PRICE_ID',
} as const;

type Tier = keyof typeof PRICE_ENV_BY_TIER;

function isTier(value: string | null): value is Tier {
  return value !== null && value in PRICE_ENV_BY_TIER;
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tier = new URL(request.url).searchParams.get('tier');
  if (!isTier(tier)) {
    return NextResponse.json({ error: 'Unknown tier' }, { status: 400 });
  }

  const priceId = process.env[PRICE_ENV_BY_TIER[tier]];
  if (!priceId) {
    console.error(`[stripe/checkout] Missing price for tier ${tier}`);
    return NextResponse.json({ error: 'Checkout unavailable' }, { status: 500 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    client_reference_id: userId,
    success_url: `${process.env.NEXT_PUBLIC_WEB_URL}/billing?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_WEB_URL}/billing?canceled=1`,
  });

  return NextResponse.redirect(session.url!, { status: 303 });
}
