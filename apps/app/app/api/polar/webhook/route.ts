import { Webhooks } from '@polar-sh/nextjs';
import { keys } from '@repo/payments/keys';
import { NextResponse } from 'next/server';

/**
 * The backend mounts every route under a global `api` prefix, so the real path
 * is /api/billing/polar-webhook. This used to concatenate the base as-is: with
 * BACKEND_API_URL=https://api.sssync.app the forward 404'd, and the only trace
 * was a console line, so a seller could pay and never get entitlements. Same
 * normalization the billing client already does.
 */
const resolveApiBase = (): string => {
  const raw =
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3001';

  const trimmed = raw.endsWith('/') ? raw.slice(0, -1) : raw;

  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const forwardToBackend = async (payload: { type: string }) => {
  console.log('Polar webhook received:', payload.type);

  try {
    // Use backend API base URL (e.g., https://api.sssync.app or http://localhost:3001)
    const apiBase = resolveApiBase();

    const response = await fetch(`${apiBase}/billing/polar-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(
        'Failed to forward Polar webhook to backend:',
        response.status,
        response.statusText
      );
    }
  } catch (error) {
    console.error('Error forwarding Polar webhook:', error);
  }
};

const webhookSecret = keys().POLAR_WEBHOOK_SECRET;

/**
 * The secret was previously asserted non-null with `!`. Unset, that handed
 * `undefined` to the verifier, and a subscription webhook that never lands is
 * invisible: the seller pays, Polar reports success, and entitlements never
 * move. Name the missing var instead.
 */
export const POST = webhookSecret
  ? Webhooks({ webhookSecret, onPayload: forwardToBackend })
  : async () => {
      console.error('[polar/webhook] POLAR_WEBHOOK_SECRET is not set');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    };
