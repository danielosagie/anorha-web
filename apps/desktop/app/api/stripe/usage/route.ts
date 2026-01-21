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

  // TODO: fetch active subscription and customer id from your DB
  // For MVP, this creates a one-off invoice item on the default subscription.
  // Replace with metered billing usage reporting if using usage_type='metered'.

  const customerId = undefined as string | undefined;
  if (!customerId) {
    return NextResponse.json({ error: 'Customer not found for usage' }, { status: 400 });
  }

  await stripe.invoiceItems.create({
    customer: customerId,
    pricing: { price: priceId },
    quantity: 1,
  });

  const created = await stripe.invoices.create({
    customer: customerId,
    collection_method: 'charge_automatically',
  });
  const invoiceId = created.id;
  if (!invoiceId) {
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
  await stripe.invoices.finalizeInvoice(invoiceId);

  return NextResponse.json({ ok: true });
}
