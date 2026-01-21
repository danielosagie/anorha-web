import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const WEBHOOK_KEY = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY!;
const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-square-hmac-sha256');
    const body = await request.text();
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/square/webhooks`;

    // Verify signature
    const hash = crypto
      .createHmac('sha256', WEBHOOK_KEY)
      .update(body + url, 'utf8')
      .digest('base64');

    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Forward to backend
    await fetch(`${API_URL}/webhook/square`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

