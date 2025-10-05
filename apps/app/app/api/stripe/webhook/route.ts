import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@repo/payments';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 400 });
  }

  const body = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed':
    case 'invoice.paid':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      // TODO: update Supabase with subscription status and entitlements
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
