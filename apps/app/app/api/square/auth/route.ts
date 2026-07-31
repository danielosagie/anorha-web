import { auth } from '@repo/auth/server';
import { type NextRequest, NextResponse } from 'next/server';
import { issueOAuthState } from '@/lib/oauth-state';

export async function GET(_request: NextRequest) {
  // Starting a connect flow is an authenticated act: the resulting token gets
  // attached to whoever is signed in, so an anonymous caller has no account to
  // attach it to.
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = process.env.SQUARE_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!(clientId && appUrl)) {
    return NextResponse.json({ error: 'Square is not configured' }, { status: 500 });
  }

  const state = await issueOAuthState('square', userId);

  const authUrl = new URL('https://connect.squareup.com/oauth2/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('scope', ['payments:read', 'catalog:read', 'inventory:read'].join(' '));
  authUrl.searchParams.set('session', 'false');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('redirect_uri', `${appUrl}/api/square/auth/callback`);

  return NextResponse.redirect(authUrl);
}
