import { createHmac, timingSafeEqual } from 'node:crypto';
import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const POLAR_WEBHOOK_TOLERANCE_SECONDS = 5 * 60;
const BACKEND_WEBHOOK_PATH = '/billing/polar-webhook';

type Failure = {
  message: string;
  reasonCode: string;
  status: number;
};

type WebhookHeaders = {
  webhookId: string;
  webhookSignature: string;
  webhookTimestamp: string;
};

type ApiBaseResult = { apiBase: string } | { failure: Failure };

const jsonFailure = ({ message, reasonCode, status }: Failure) =>
  NextResponse.json(
    { received: false, reasonCode, message },
    { status }
  );

const resolveApiBase = (): ApiBaseResult => {
  const raw =
    process.env.BACKEND_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim();

  if (!raw) {
    return {
      failure: {
        reasonCode: 'POLAR_BACKEND_API_URL_MISSING',
        message: 'Polar webhook forwarding is not configured.',
        status: 503,
      },
    };
  }

  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new TypeError('Backend URL must use HTTP or HTTPS.');
    }

    url.search = '';
    url.hash = '';
    const pathname = url.pathname.replace(/\/+$/, '');
    url.pathname = pathname.endsWith('/api') ? pathname : `${pathname}/api`;
    return { apiBase: url.toString().replace(/\/$/, '') };
  } catch {
    return {
      failure: {
        reasonCode: 'POLAR_BACKEND_API_URL_INVALID',
        message: 'Polar webhook backend URL is invalid.',
        status: 503,
      },
    };
  }
};

const getWebhookHeaders = (
  request: NextRequest
): WebhookHeaders | Failure => {
  // Fetch/Next Headers are case-insensitive; lower-case names match the
  // Standard Webhooks wire names and the backend controller lookups.
  const webhookId = request.headers.get('webhook-id');
  if (!webhookId) {
    return {
      reasonCode: 'POLAR_WEBHOOK_ID_MISSING',
      message: 'Polar webhook-id header is required.',
      status: 400,
    };
  }

  const webhookTimestamp = request.headers.get('webhook-timestamp');
  if (!webhookTimestamp) {
    return {
      reasonCode: 'POLAR_WEBHOOK_TIMESTAMP_MISSING',
      message: 'Polar webhook-timestamp header is required.',
      status: 400,
    };
  }

  const webhookSignature = request.headers.get('webhook-signature');
  if (!webhookSignature) {
    return {
      reasonCode: 'POLAR_WEBHOOK_SIGNATURE_MISSING',
      message: 'Polar webhook-signature header is required.',
      status: 400,
    };
  }

  return { webhookId, webhookTimestamp, webhookSignature };
};

const verifyWebhook = (
  rawBody: Buffer,
  headers: WebhookHeaders,
  configuredSecret: string
): Failure | null => {
  if (!/^\d+$/.test(headers.webhookTimestamp)) {
    return {
      reasonCode: 'POLAR_WEBHOOK_TIMESTAMP_INVALID',
      message: 'Polar webhook timestamp is invalid.',
      status: 401,
    };
  }

  const timestampSeconds = Number(headers.webhookTimestamp);
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (nowSeconds - timestampSeconds > POLAR_WEBHOOK_TOLERANCE_SECONDS) {
    return {
      reasonCode: 'POLAR_WEBHOOK_TIMESTAMP_REPLAYED',
      message: 'Polar webhook timestamp is too old.',
      status: 401,
    };
  }
  if (timestampSeconds - nowSeconds > POLAR_WEBHOOK_TOLERANCE_SECONDS) {
    return {
      reasonCode: 'POLAR_WEBHOOK_TIMESTAMP_FUTURE',
      message: 'Polar webhook timestamp is too far in the future.',
      status: 401,
    };
  }

  const secret = configuredSecret.startsWith('whsec_')
    ? Buffer.from(configuredSecret.slice('whsec_'.length), 'base64')
    : Buffer.from(configuredSecret, 'utf8');
  if (secret.length === 0) {
    return {
      reasonCode: 'POLAR_WEBHOOK_SECRET_INVALID',
      message: 'Polar webhook verification secret is invalid.',
      status: 503,
    };
  }

  const signedContent = `${headers.webhookId}.${headers.webhookTimestamp}.${rawBody.toString('utf8')}`;
  const expected = createHmac('sha256', secret)
    .update(signedContent)
    .digest();
  const isValid = headers.webhookSignature.split(/\s+/).some((token) => {
    const [version, signature] = token.split(',', 2);
    if (version !== 'v1' || !signature) {
      return false;
    }

    const provided = Buffer.from(signature, 'base64');
    return (
      provided.length === expected.length && timingSafeEqual(provided, expected)
    );
  });

  return isValid
    ? null
    : {
        reasonCode: 'POLAR_WEBHOOK_SIGNATURE_INVALID',
        message: 'Polar webhook signature is invalid.',
        status: 401,
      };
};

const readBackendReasonCode = async (
  response: Response
): Promise<string | null> => {
  try {
    const body = await response.clone().json();
    const reasonCode =
      body && typeof body === 'object' && 'reasonCode' in body
        ? body.reasonCode
        : null;
    return typeof reasonCode === 'string' && reasonCode.length <= 100
      ? reasonCode
      : null;
  } catch {
    return null;
  }
};

export async function POST(request: NextRequest) {
  const configuredSecret = process.env.POLAR_WEBHOOK_SECRET;
  if (!configuredSecret) {
    console.error('[polar/webhook] POLAR_WEBHOOK_SECRET is not set');
    return jsonFailure({
      reasonCode: 'POLAR_WEBHOOK_SECRET_MISSING',
      message: 'Polar webhook verification is not configured.',
      status: 503,
    });
  }

  const apiBaseResult = resolveApiBase();
  if ('failure' in apiBaseResult) {
    console.error(`[polar/webhook] ${apiBaseResult.failure.reasonCode}`);
    return jsonFailure(apiBaseResult.failure);
  }
  const { apiBase } = apiBaseResult;

  const headers = getWebhookHeaders(request);
  if ('reasonCode' in headers) {
    console.warn(`[polar/webhook] ${headers.reasonCode}`);
    return jsonFailure(headers);
  }

  let rawBody: Buffer;
  let rawBodyBytes: ArrayBuffer;
  try {
    rawBodyBytes = await request.arrayBuffer();
    rawBody = Buffer.from(rawBodyBytes);
  } catch (error) {
    console.warn('[polar/webhook] POLAR_RAW_BODY_READ_FAILED', error);
    return jsonFailure({
      reasonCode: 'POLAR_RAW_BODY_READ_FAILED',
      message: 'Polar webhook body could not be read.',
      status: 400,
    });
  }

  const verificationFailure = verifyWebhook(
    rawBody,
    headers,
    configuredSecret
  );
  if (verificationFailure) {
    console.warn(`[polar/webhook] ${verificationFailure.reasonCode}`);
    return jsonFailure(verificationFailure);
  }

  let response: Response;
  try {
    response = await fetch(`${apiBase}${BACKEND_WEBHOOK_PATH}`, {
      method: 'POST',
      headers: {
        'content-type':
          request.headers.get('content-type') || 'application/json',
        'webhook-id': headers.webhookId,
        'webhook-timestamp': headers.webhookTimestamp,
        'webhook-signature': headers.webhookSignature,
      },
      // ArrayBuffer preserves the exact bytes Polar signed. Do not stringify.
      body: rawBodyBytes,
      cache: 'no-store',
    });
  } catch (error) {
    console.error(
      `[polar/webhook] POLAR_BACKEND_NETWORK_ERROR id=${headers.webhookId}`,
      error
    );
    return jsonFailure({
      reasonCode: 'POLAR_BACKEND_NETWORK_ERROR',
      message: 'Polar webhook backend is unavailable.',
      status: 502,
    });
  }

  if (response.ok) {
    return NextResponse.json({ received: true });
  }

  const backendReasonCode = await readBackendReasonCode(response);
  console.error(
    `[polar/webhook] POLAR_BACKEND_REJECTED id=${headers.webhookId} status=${response.status} backendReasonCode=${backendReasonCode || 'unknown'}`
  );

  if (response.status >= 400 && response.status < 500) {
    return jsonFailure({
      reasonCode: backendReasonCode || 'POLAR_BACKEND_REJECTED',
      message: 'Polar webhook was rejected by the backend.',
      status: response.status,
    });
  }

  return jsonFailure({
    reasonCode: 'POLAR_BACKEND_UNAVAILABLE',
    message: 'Polar webhook backend is unavailable.',
    status: 502,
  });
}
