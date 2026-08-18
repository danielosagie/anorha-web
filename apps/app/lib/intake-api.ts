const TRAILING_SLASH = /\/$/;

export function intakeApiUrl(path: string): string {
  const configured = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';
  const base = configured.replace(TRAILING_SLASH, '');
  const apiBase = base.endsWith('/api') ? base : `${base}/api`;
  return `${apiBase}/intake${path}`;
}

/**
 * The backend answers a rejected store link with a code, the field it belongs
 * to, and alternatives the seller can click. Flattening that to `message` threw
 * away everything the UI needs to be useful, so the payload rides on the error.
 */
export class IntakeRequestError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly field: string | null;
  readonly suggestions: string[];

  constructor(status: number, payload: Record<string, unknown> | null) {
    super(
      typeof payload?.message === 'string'
        ? payload.message
        : 'Intake request failed.'
    );
    this.name = 'IntakeRequestError';
    this.status = status;
    this.code = typeof payload?.code === 'string' ? payload.code : null;
    this.field = typeof payload?.field === 'string' ? payload.field : null;
    this.suggestions = Array.isArray(payload?.suggestions)
      ? payload.suggestions.filter(
          (value): value is string => typeof value === 'string'
        )
      : [];
  }
}

export async function intakeRequest<T>(input: {
  path: string;
  token: string;
  method?: 'GET' | 'POST' | 'PATCH';
  body?: Record<string, unknown>;
  signal?: AbortSignal;
}): Promise<T> {
  const response = await fetch(intakeApiUrl(input.path), {
    method: input.method ?? 'GET',
    cache: 'no-store',
    signal: input.signal,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${input.token}`,
      ...(input.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: input.body ? JSON.stringify(input.body) : undefined,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new IntakeRequestError(response.status, data);
  }
  return data as T;
}
