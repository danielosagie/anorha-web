import { env } from '@/env';
import { isAdminClerkUserId } from '@/lib/admin-auth';
import { auth } from '@repo/auth/server';
import { notFound } from 'next/navigation';

const TRAILING_SLASH = /\/$/;

interface AdminRequestOptions extends Omit<RequestInit, 'headers'> {
  operation: string;
  headers?: HeadersInit;
}

export class AdminApiError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
  }
}

async function getAdminBackendToken(): Promise<string> {
  const { getToken, userId } = await auth();

  if (!isAdminClerkUserId(userId, env.ADMIN_CLERK_USER_IDS)) {
    notFound();
  }

  const token = await getToken();
  if (!token) {
    throw new AdminApiError('Could not acquire the founder Clerk token', 401);
  }
  return token;
}

function backendBaseUrl(): string {
  return (env.NEXT_PUBLIC_API_URL || 'http://localhost:3333').replace(
    TRAILING_SLASH,
    ''
  );
}

function messageFromBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return null;
  }
  const message = (body as { message?: unknown }).message;
  if (typeof message === 'string' && message.trim()) {
    return message.trim();
  }
  if (Array.isArray(message)) {
    const parts = message.filter(
      (part): part is string => typeof part === 'string' && Boolean(part.trim())
    );
    return parts.length > 0 ? parts.join('; ') : null;
  }
  return null;
}

async function errorMessage(response: Response): Promise<string> {
  const raw = await response.text();
  if (!raw) {
    return `HTTP ${response.status}`;
  }
  try {
    return messageFromBody(JSON.parse(raw)) ?? raw;
  } catch {
    return raw;
  }
}

export async function adminRequest<T>(
  path: string,
  options: AdminRequestOptions
): Promise<T> {
  const token = await getAdminBackendToken();
  let response: Response;

  try {
    response = await fetch(`${backendBaseUrl()}/api/admin${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
      cache: 'no-store',
    });
  } catch {
    throw new AdminApiError(
      `${options.operation} failed: admin backend unreachable`
    );
  }

  if (!response.ok) {
    const detail = await errorMessage(response);
    throw new AdminApiError(
      `${options.operation} failed (${response.status}): ${detail}`,
      response.status
    );
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new AdminApiError(
      `${options.operation} failed: admin backend returned invalid JSON`,
      response.status
    );
  }
}

export const adminGet = <T>(path: string, operation: string): Promise<T> =>
  adminRequest<T>(path, { method: 'GET', operation });
