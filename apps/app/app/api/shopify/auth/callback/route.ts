import { auth } from '@repo/auth/server';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET!;
const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID!;
const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const hmac = request.nextUrl.searchParams.get('hmac');
  const shop = request.nextUrl.searchParams.get('shop');
  const state = request.nextUrl.searchParams.get('state');

  if (!code || !hmac || !shop) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  // The HMAC proves Shopify sent this, but not who is installing. Storing the
  // token without a session left the backend guessing which account owns the
  // shop, so bounce through sign-in first and come straight back. The code has
  // not been redeemed yet, so the retry completes the exchange normally.
  const { userId, getToken } = await auth();
  if (!userId) {
    const returnUrl = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    return NextResponse.redirect(
      new URL(`/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`, request.url)
    );
  }

  try {
    // Verify HMAC
    const params = new URLSearchParams({
      code,
      hmac,
      shop,
      state: state || '',
      timestamp: request.nextUrl.searchParams.get('timestamp') || '',
    });

    const message = Array.from(params.entries())
      .filter(([key]) => key !== 'hmac')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    const hash = crypto.createHmac('sha256', SHOPIFY_CLIENT_SECRET).update(message, 'utf8').digest('base64');

    if (hash !== hmac) {
      return NextResponse.json({ error: 'Invalid HMAC' }, { status: 401 });
    }

    // Exchange code for token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: SHOPIFY_CLIENT_ID,
        client_secret: SHOPIFY_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get shop info
    const shopResponse = await fetch(`https://${shop}/admin/api/2024-10/shop.json`, {
      headers: { 'X-Shopify-Access-Token': accessToken },
    });

    const shopData = await shopResponse.json();
    const shopName = shopData.shop.name;

    // Store in backend as the signed-in seller, so the connection lands on their org.
    const authToken = await getToken();
    if (!authToken) {
      throw new Error('No session token for connection store');
    }

    const storeResponse = await fetch(`${API_URL}/api/platform-connections/shopify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        shop,
        accessToken,
        shopName,
      }),
    });

    if (!storeResponse.ok) {
      throw new Error('Failed to store connection');
    }

    // Redirect to app
    return NextResponse.redirect(new URL('/connections?status=success&connection=shopify', request.url));
  } catch (error) {
    console.error('Shopify auth error:', error);
    return NextResponse.redirect(new URL('/connections?status=error&connection=shopify', request.url));
  }
}

