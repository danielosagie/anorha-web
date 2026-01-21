import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const clientId = process.env.SQUARE_CLIENT_ID!;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const state = Math.random().toString(36).substring(7);

  const authUrl = new URL('https://connect.squareup.com/oauth2/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('scope', ['payments:read', 'catalog:read', 'inventory:read'].join(' '));
  authUrl.searchParams.set('session', 'false');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('redirect_uri', `${appUrl}/api/square/auth/callback`);

  // Store state for verification (TODO: use session/cache)
  // For now, just validate on callback

  return NextResponse.redirect(authUrl);
}

