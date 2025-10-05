import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@repo/payments';

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const priceVar = searchParams.get('price');

  if (!priceVar) {
    return NextResponse.json({ error: 'Missing price' }, { status: 400 });
  }

  const priceId = process.env[priceVar];
  if (!priceId) {
    return NextResponse.json({ error: `Price not configured: ${priceVar}` }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${process.env.NEXT_PUBLIC_WEB_URL}/billing?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_WEB_URL}/billing?canceled=1`,
  });

  return NextResponse.redirect(session.url!, { status: 303 });
}
