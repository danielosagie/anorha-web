import { auth } from '@clerk/nextjs/server';

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'
).replace(/\/$/, '');

export class SproutProxyError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'SproutProxyError';
    this.status = status;
  }
}

export async function getBackendToken(): Promise<string> {
  const { getToken, userId } = await auth();

  if (!userId) {
    throw new SproutProxyError('Unauthorized', 401);
  }

  const token = await getToken();
  if (!token) {
    throw new SproutProxyError('Unauthorized', 401);
  }

  return token;
}

export function backendUrl(path: string): string {
  const normalizedPath =
    API_BASE.endsWith('/api') && path.startsWith('/api/')
      ? path.slice(4)
      : path;
  return `${API_BASE}${normalizedPath.startsWith('/') ? '' : '/'}${normalizedPath}`;
}

export async function requestBackendJson<T>(
  token: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(backendUrl(path), {
    ...init,
    cache: 'no-store',
    headers,
  });

  if (!response.ok) {
    throw new SproutProxyError('Request failed', response.status);
  }

  return response.json() as Promise<T>;
}

export function proxyErrorResponse(error: unknown): Response {
  if (error instanceof SproutProxyError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  return Response.json({ error: 'Request failed' }, { status: 500 });
}
