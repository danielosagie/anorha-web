import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET!;
const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function POST(request: NextRequest) {
  try {
    const hmac = request.headers.get('x-shopify-hmac-sha256');
    const topic = request.headers.get('x-shopify-topic');
    const body = await request.text();

    // Verify signature
    const hash = crypto.createHmac('sha256', WEBHOOK_SECRET).update(body, 'utf8').digest('base64');

    if (hash !== hmac) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Forward to backend
    await fetch(`${API_URL}/webhook/shopify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Topic': topic || '',
      },
      body,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

