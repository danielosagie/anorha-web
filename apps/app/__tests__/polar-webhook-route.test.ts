// @vitest-environment node

import { createHmac } from 'node:crypto';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../app/api/polar/webhook/route';

const WEBHOOK_SECRET = 'relay-test-secret';
const BACKEND_API_URL = 'https://backend.example.test';

const sign = (
  rawBody: Buffer,
  webhookId: string,
  webhookTimestamp: string
) =>
  `v1,${createHmac('sha256', Buffer.from(WEBHOOK_SECRET, 'utf8'))
    .update(`${webhookId}.${webhookTimestamp}.${rawBody.toString('utf8')}`)
    .digest('base64')}`;

const makeRequest = (
  rawBody: Buffer,
  overrides: Partial<Record<string, string>> = {}
) => {
  const webhookId = overrides['webhook-id'] || 'evt_relay_test';
  const webhookTimestamp =
    overrides['webhook-timestamp'] || String(Math.floor(Date.now() / 1000));
  const webhookSignature =
    overrides['webhook-signature'] ||
    sign(rawBody, webhookId, webhookTimestamp);

  return new NextRequest('https://app.example.test/api/polar/webhook', {
    method: 'POST',
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'webhook-id': webhookId,
      'webhook-timestamp': webhookTimestamp,
      'webhook-signature': webhookSignature,
    },
    body: Uint8Array.from(rawBody).buffer,
  });
};

describe('POST /api/polar/webhook', () => {
  beforeEach(() => {
    vi.stubEnv('POLAR_WEBHOOK_SECRET', WEBHOOK_SECRET);
    vi.stubEnv('BACKEND_API_URL', BACKEND_API_URL);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('rejects an invalid signature before forwarding', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await POST(
      makeRequest(Buffer.from('{"type":"order.paid"}'), {
        'webhook-signature': 'v1,invalid',
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      received: false,
      reasonCode: 'POLAR_WEBHOOK_SIGNATURE_INVALID',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fails closed when POLAR_WEBHOOK_SECRET is missing', async () => {
    vi.stubEnv('POLAR_WEBHOOK_SECRET', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(
      makeRequest(Buffer.from('{"type":"order.paid"}'))
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      received: false,
      reasonCode: 'POLAR_WEBHOOK_SECRET_MISSING',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fails closed when the backend URL is missing', async () => {
    vi.stubEnv('BACKEND_API_URL', '');
    vi.stubEnv('NEXT_PUBLIC_API_URL', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await POST(
      makeRequest(Buffer.from('{"type":"order.paid"}'))
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      received: false,
      reasonCode: 'POLAR_BACKEND_API_URL_MISSING',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('forwards the exact bytes and all Standard Webhooks headers', async () => {
    const rawBody = Buffer.from(
      '{\r\n  "type": "order.paid",\r\n  "data": {"note": "café"}\r\n}\r\n',
      'utf8'
    );
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response('{"ingested":true}', {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
    );
    vi.stubGlobal('fetch', fetchMock);

    const request = makeRequest(rawBody);
    const expectedHeaders = {
      id: request.headers.get('webhook-id'),
      timestamp: request.headers.get('webhook-timestamp'),
      signature: request.headers.get('webhook-signature'),
    };
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toBe(
      'https://backend.example.test/api/billing/polar-webhook'
    );
    expect(Buffer.from(init?.body as ArrayBuffer)).toEqual(rawBody);
    const forwardedHeaders = new Headers(init?.headers);
    expect(forwardedHeaders.get('webhook-id')).toBe(expectedHeaders.id);
    expect(forwardedHeaders.get('webhook-timestamp')).toBe(
      expectedHeaders.timestamp
    );
    expect(forwardedHeaders.get('webhook-signature')).toBe(
      expectedHeaders.signature
    );
    expect(forwardedHeaders.get('content-type')).toBe(
      'application/json; charset=utf-8'
    );
  });

  it('propagates a permanent backend rejection as a 4xx', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json(
          { reasonCode: 'POLAR_PAYLOAD_INVALID_JSON' },
          { status: 400 }
        )
      )
    );

    const response = await POST(
      makeRequest(Buffer.from('{"type":"order.paid"}'))
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      received: false,
      reasonCode: 'POLAR_PAYLOAD_INVALID_JSON',
    });
  });

  it('maps a backend 5xx to a retryable relay 5xx', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('unavailable', { status: 503 }))
    );

    const response = await POST(
      makeRequest(Buffer.from('{"type":"order.paid"}'))
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      received: false,
      reasonCode: 'POLAR_BACKEND_UNAVAILABLE',
    });
  });

  it('maps a backend network error to a retryable relay 5xx', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('connection refused'))
    );

    const response = await POST(
      makeRequest(Buffer.from('{"type":"order.paid"}'))
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      received: false,
      reasonCode: 'POLAR_BACKEND_NETWORK_ERROR',
    });
  });
});
