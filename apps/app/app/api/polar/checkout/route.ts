import { auth } from '@repo/auth/server';
import { type NextRequest, NextResponse } from 'next/server';
import { getPolarProductIds } from '../../../../lib/polar-config';
import { getSupabaseToken } from '../../billing/_utils';

/**
 * Checkout is authenticated and only ever sells the tiers we actually offer.
 * Open to anyone, with a caller-chosen product id, it was a free checkout-object
 * factory against our Polar account for any product id someone cared to guess.
 *
 * Errors stay generic on purpose: the previous version echoed the vendor
 * exception and server mode straight back to the caller.
 */

function firstHeaderValue(value: string | null): string | undefined {
  return value?.split(',')[0]?.trim() || undefined;
}

/**
 * Polar sends the seller here after paying, so it has to be the origin they are
 * actually on. NEXT_PUBLIC_APP_URL is baked in at build time and ships as
 * http://localhost:3000, which dropped paying customers on a machine that isn't
 * there. The forwarded host is the one value that is right on production, on
 * preview deployments, and in local dev at once; Vercel only routes a request
 * here when its host is a domain attached to this project, so it cannot be
 * pointed somewhere else.
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

type CheckoutTier = 'Growth' | 'Teams';
type CheckoutReceipt = {
  action: 'redirect';
  provider: 'polar' | 'shopify';
  url: string;
};

function configuredCheckoutProducts(): Array<{
  productId: string;
  tier: CheckoutTier;
}> {
  const productIds = getPolarProductIds();
  return [
    { productId: productIds.growth, tier: 'Growth' as const },
    { productId: productIds.teams, tier: 'Teams' as const },
  ].filter(
    (product): product is { productId: string; tier: CheckoutTier } =>
      typeof product.productId === 'string' &&
      product.productId.length > 0 &&
      !product.productId.startsWith('missing-')
  );
}

function parseCheckoutReceipt(value: unknown): CheckoutReceipt | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const receipt = value as Readonly<Record<string, unknown>>;
  if (
    receipt.action !== 'redirect' ||
    (receipt.provider !== 'polar' && receipt.provider !== 'shopify') ||
    typeof receipt.url !== 'string'
  ) {
    return null;
  }

  return {
    action: receipt.action,
    provider: receipt.provider,
    url: receipt.url,
  };
}

function checkoutRedirectUrl(receipt: CheckoutReceipt): URL {
  const redirectUrl = new URL(receipt.url);
  const isLocalHttp =
    redirectUrl.protocol === 'http:' &&
    (redirectUrl.hostname === 'localhost' ||
      redirectUrl.hostname === '127.0.0.1');
  if (redirectUrl.protocol !== 'https:' && !isLocalHttp) {
    throw new Error('Backend returned a non-HTTPS checkout redirect');
  }
  if (receipt.provider === 'polar') {
    redirectUrl.searchParams.set('theme', 'light');
  }
  return redirectUrl;
}

export const GET = async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const requested = new URL(req.url).searchParams.get('products');
  const configuredProducts = configuredCheckoutProducts();

  if (configuredProducts.length === 0) {
    // Otherwise a deploy without the product ids rejects every checkout with a
    // 400 that reads like the caller's fault.
    console.error(
      '[polar/checkout] No product ids configured: set NEXT_PUBLIC_POLAR_GROWTH_PRODUCT_ID and NEXT_PUBLIC_POLAR_TEAMS_PRODUCT_ID'
    );
    return NextResponse.json(
      {
        error: 'Checkout unavailable',
        reasonCode: 'POLAR_CHECKOUT_PRODUCT_CONFIG_MISSING',
      },
      { status: 503 }
    );
  }

  const selectedProduct = configuredProducts.find(
    (product) => product.productId === requested
  );
  if (!requested || !selectedProduct) {
    console.warn(`[polar/checkout] Rejected product id: ${requested}`);
    return NextResponse.json({ error: 'Unknown product' }, { status: 400 });
  }

  try {
    const { token, apiBase } = await getSupabaseToken();
    const response = await fetch(`${apiBase}/billing/checkout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tier: selectedProduct.tier,
        successUrl: `${resolveOrigin(req)}/billing/success?checkout_id={CHECKOUT_ID}`,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error(
        `[polar/checkout] Backend checkout failed: ${response.status} ${detail.slice(0, 500)}`
      );
      return NextResponse.json(
        {
          error: 'Checkout failed',
          reasonCode: 'BILLING_CHECKOUT_BACKEND_REJECTED',
        },
        {
          status:
            response.status >= 400 && response.status <= 599
              ? response.status
              : 502,
        }
      );
    }

    const receipt = parseCheckoutReceipt(
      await response.json().catch(() => null)
    );
    if (!receipt) {
      throw new Error('Backend returned an invalid checkout redirect receipt');
    }

    return NextResponse.redirect(checkoutRedirectUrl(receipt));
  } catch (error) {
    console.error('[polar/checkout] Checkout failed:', error);
    return NextResponse.json(
      {
        error: 'Checkout failed',
        reasonCode: 'BILLING_CHECKOUT_FAILED',
      },
      { status: 502 }
    );
  }
};
