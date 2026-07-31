import { auth } from '@repo/auth/server';
import { type NextRequest, NextResponse } from 'next/server';
import { consumeOAuthState } from '@/lib/oauth-state';

const SQUARE_CLIENT_ID = process.env.SQUARE_CLIENT_ID!;
const SQUARE_CLIENT_SECRET = process.env.SQUARE_CLIENT_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;
const API_URL = process.env.NEXT_PUBLIC_API_URL!;

function fail(request: NextRequest) {
  return NextResponse.redirect(
    new URL('/connections?status=error&connection=square', request.url)
  );
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');

  // Who is connecting has to come from the session, never from the callback URL.
  const { userId, getToken } = await auth();
  if (!(userId && code)) {
    return fail(request);
  }

  // Burn the state this user was issued when they started the flow. Without it,
  // the route would happily redeem an authorization code supplied by anyone.
  if (!(await consumeOAuthState('square', userId, state))) {
    return fail(request);
  }

  try {
    // Exchange code for token
    const tokenResponse = await fetch('https://connect.squareup.com/v2/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: SQUARE_CLIENT_ID,
        client_secret: SQUARE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${APP_URL}/api/square/auth/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Square token exchange failed');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      throw new Error('Square returned no access token');
    }

    // Store in backend, as the signed-in seller. The backend decides which org
    // the connection lands on from this token, so it must not be omitted.
    const authToken = await getToken();
    if (!authToken) {
      throw new Error('No session token for connection store');
    }

    const storeResponse = await fetch(`${API_URL}/api/platform-connections/square`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        accessToken,
      }),
    });

    if (!storeResponse.ok) {
      throw new Error('Failed to store connection');
    }

    return NextResponse.redirect(new URL('/connections?status=success&connection=square', request.url));
  } catch (error) {
    console.error('Square auth error:', error);
    return fail(request);
  }
}
