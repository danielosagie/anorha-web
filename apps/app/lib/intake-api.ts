const TRAILING_SLASH = /\/$/;

export function intakeApiUrl(path: string): string {
  const configured = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';
  const base = configured.replace(TRAILING_SLASH, '');
  const apiBase = base.endsWith('/api') ? base : `${base}/api`;
  return `${apiBase}/intake${path}`;
}

export async function intakeRequest<T>(input: {
  path: string;
  token: string;
  method?: 'GET' | 'POST' | 'PATCH';
  body?: Record<string, unknown>;
}): Promise<T> {
  const response = await fetch(intakeApiUrl(input.path), {
    method: input.method ?? 'GET',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${input.token}`,
      ...(input.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: input.body ? JSON.stringify(input.body) : undefined,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      data && typeof data.message === 'string'
        ? data.message
        : 'Intake request failed.';
    throw new Error(message);
  }
  return data as T;
}
