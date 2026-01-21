import { NextRequest, NextResponse } from 'next/server';

const SQUARE_CLIENT_ID = process.env.SQUARE_CLIENT_ID!;
const SQUARE_CLIENT_SECRET = process.env.SQUARE_CLIENT_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;
const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/team/connections?error=square', request.url));
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

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Store in backend
    const storeResponse = await fetch(`${API_URL}/api/platform-connections/square`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessToken,
      }),
    });

    if (!storeResponse.ok) {
      throw new Error('Failed to store connection');
    }

    return NextResponse.redirect(new URL('/team/connections?connected=square', request.url));
  } catch (error) {
    console.error('Square auth error:', error);
    return NextResponse.redirect(new URL('/team/connections?error=square', request.url));
  }
}

