import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseToken } from '../_utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tier = searchParams.get('tier') || 'Growth';
  const shop = searchParams.get('shop'); // For Shopify context
  const platform = searchParams.get('platform'); // Explicit platform override

  try {
    const { token, apiBase } = await getSupabaseToken();

    // Determine provider based on context
    let paymentProvider = 'stripe';
    if (shop || platform === 'shopify') paymentProvider = 'shopify';
    else if (platform === 'square') paymentProvider = 'square';
    else if (platform === 'clover') paymentProvider = 'clover';
    else if (process.env.NEXT_PUBLIC_DEFAULT_BILLING_PROVIDER === 'polar') paymentProvider = 'polar';

    const response = await fetch(`${apiBase}/billing/checkout-session`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tier,
        paymentProvider,
        shop,
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`,
        cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error: ${response.status} ${errorText}`);
    }

    const { url } = await response.json();
    if (url) {
      return NextResponse.redirect(url);
    }

    throw new Error('No checkout URL returned');
  } catch (error: any) {
    console.error('[BillingCheckout] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Checkout initialization failed' },
      { status: 500 }
    );
  }
}
