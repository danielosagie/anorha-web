import 'server-only';

import { createHmac } from 'node:crypto';
import { env } from '@/env';
import { createRateLimiter, slidingWindow } from '@repo/rate-limit';
import {
  type IntakeServerConfig,
  getIntakeServerConfig,
} from './intake-server-env';

const MAX_JSON_BYTES = 256 * 1024;
const TRAILING_SLASH = /\/$/;
const DIGEST_ROTATION_MS = 24 * 60 * 60 * 1000;

type RateLimitResult =
  | { config: IntakeServerConfig; digest: string; response?: never }
  | { digest?: never; response: Response };

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  headers?: HeadersInit
): Response {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
      'X-Robots-Tag': 'noindex, nofollow',
      ...headers,
    },
  });
}

function unavailable(): Response {
  return jsonResponse(
    {
      code: 'INTAKE_RATE_LIMIT_UNAVAILABLE',
      message: 'Intake is unavailable. Try again later.',
    },
    503
  );
}

async function enforceRateLimit(request: Request): Promise<RateLimitResult> {
  const address = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const config = getIntakeServerConfig();
  if (
    !address ||
    !config ||
    !env.UPSTASH_REDIS_REST_URL ||
    !env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return { response: unavailable() };
  }

  const rotation = Math.floor(Date.now() / DIGEST_ROTATION_MS).toString(36);
  const digest = createHmac('sha256', config.rateLimitSecret)
    .update(rotation, 'utf8')
    .update('\u0000', 'utf8')
    .update(address, 'utf8')
    .digest('hex');

  try {
    const result = await createRateLimiter({
      limiter: slidingWindow(config.requestsPerHour, '1h'),
      prefix: 'intake_public',
    }).limit(`${digest}:${request.method}`);

    if (!result.success) {
      const retryAt = new Date(result.reset).toISOString();
      return {
        response: jsonResponse(
          {
            code: 'INTAKE_IP_LIMIT',
            budget: 'public_requests_per_hour',
            limit: config.requestsPerHour,
            unit: 'requests/hour',
            ask: 'Try again after the limit resets.',
            retryAt,
            message: `Request limit: ${config.requestsPerHour} per hour. Try again after the limit resets.`,
          },
          429
        ),
      };
    }
  } catch {
    return { response: unavailable() };
  }

  return { config, digest };
}

function backendBaseUrl(config: IntakeServerConfig): string {
  const base = config.apiUrl.replace(TRAILING_SLASH, '');
  return base.endsWith('/api') ? base : `${base}/api`;
}

type MetadataBody =
  | { body: string | undefined; response?: never }
  | { body?: never; response: Response };

async function readMetadataBody(request: Request): Promise<MetadataBody> {
  if (request.method === 'GET') {
    return { body: undefined };
  }

  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_JSON_BYTES) {
    return {
      response: jsonResponse(
        {
          code: 'INTAKE_METADATA_TOO_LARGE',
          message: 'Submission details are too large.',
        },
        413
      ),
    };
  }

  let body: string;
  try {
    body = await request.text();
  } catch {
    return {
      response: jsonResponse(
        { code: 'INTAKE_REQUEST_INVALID', message: 'Request is invalid.' },
        400
      ),
    };
  }

  if (new TextEncoder().encode(body).byteLength > MAX_JSON_BYTES) {
    return {
      response: jsonResponse(
        {
          code: 'INTAKE_METADATA_TOO_LARGE',
          message: 'Submission details are too large.',
        },
        413
      ),
    };
  }
  return { body };
}

/**
 * `segment` is whatever the customer has in their URL bar. It is a store-link
 * slug or a share token, and this proxy deliberately does not care which: the
 * backend owns the one resolver that tells them apart. Adding a shape guard
 * here would silently break one of the two the next time either shape changes.
 */
export async function proxyIntakeRequest(input: {
  request: Request;
  segment: string;
  suffix?: string;
}): Promise<Response> {
  const rateLimit = await enforceRateLimit(input.request);
  if (rateLimit.response) {
    return rateLimit.response;
  }

  const baseUrl = backendBaseUrl(rateLimit.config);

  const metadata = await readMetadataBody(input.request);
  if (metadata.response) {
    return metadata.response;
  }
  const { body } = metadata;

  const suffix = input.suffix ? `/${input.suffix}` : '';
  const upstreamUrl = `${baseUrl}/intake/public/links/${encodeURIComponent(input.segment)}${suffix}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      method: input.request.method,
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        'x-intake-client-digest': rateLimit.digest,
        'x-intake-service-secret': rateLimit.config.publicServiceSecret,
      },
      body,
    });
    const responseBody = await upstream.arrayBuffer();
    if (responseBody.byteLength > MAX_JSON_BYTES) {
      return jsonResponse(
        {
          code: 'INTAKE_RESPONSE_TOO_LARGE',
          message: 'Intake returned an invalid response.',
        },
        502
      );
    }

    return new Response(responseBody, {
      status: upstream.status,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type':
          upstream.headers.get('content-type') ?? 'application/json',
        'Referrer-Policy': 'no-referrer',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  } catch {
    return jsonResponse(
      {
        code: 'INTAKE_SERVICE_UNAVAILABLE',
        message: 'Intake is unavailable. Try again later.',
      },
      502
    );
  }
}
