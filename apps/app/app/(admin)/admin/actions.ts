'use server';

import { env } from '@/env';
import { isAdminClerkUserId } from '@/lib/admin-auth';
import { auth } from '@repo/auth/server';
import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import { AdminApiError, adminRequest } from './_lib/api';

const TRAILING_SLASH = /\/$/;

interface AndroidInviteResult {
  ok: boolean;
  emailSent: boolean;
  idempotent: boolean;
  request: unknown;
}

function formValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function safeReturnTo(value: string, fallback: string): string {
  if (!value.startsWith('/admin/') || value.startsWith('//')) {
    return fallback;
  }
  return value;
}

function withMessage(
  returnTo: string,
  key: 'error' | 'notice',
  message: string
): string {
  const url = new URL(returnTo, 'https://admin.anorha.local');
  url.searchParams.delete('action');
  url.searchParams.set(key, message);
  return `${url.pathname}?${url.searchParams.toString()}`;
}

function actionError(error: unknown): string {
  if (error instanceof AdminApiError) {
    return error.message;
  }
  return 'Admin action failed: unexpected server error';
}

function responseErrorCode(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const candidate = body as { code?: unknown; error?: unknown };
  if (typeof candidate.error === 'string') {
    return candidate.error;
  }
  return typeof candidate.code === 'string' ? candidate.code : null;
}

async function responseBody(response: Response): Promise<unknown> {
  const raw = await response.text();
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

function inviteFailureMessage(status: number, code: string | null): string {
  if (status === 400 && code === 'invalid_request_id') {
    return 'Invalid tester request ID.';
  }
  if (status === 400) {
    return 'The web project rejected the tester request ID.';
  }
  if (status === 401) {
    return 'The web project rejected the Clerk session token. Sign in again.';
  }
  if (status === 403 && code === 'founder_forbidden') {
    return 'Founder access is missing on anorha-web. Set ADMIN_CLERK_USER_IDS on the anorha-web Vercel project. It accepts comma-separated Clerk user IDs or emails, case-insensitive, and fails closed.';
  }
  if (status === 403 && code === 'origin_forbidden') {
    return 'Origin rejected. NEXT_PUBLIC_APP_URL is not the accepted origin.';
  }
  if (status === 403) {
    return 'The web project refused founder access.';
  }
  if (status === 404) {
    return 'Tester request not found on anorha-web. Refresh the queue.';
  }
  if (status === 409 && code === 'invite_in_progress') {
    return 'Send already in progress.';
  }
  if (status === 409) {
    return 'The tester request changed while sending. Refresh the queue.';
  }
  if (status === 502) {
    return 'Delivery failed. The request returned to tester_added with last_error and can be retried.';
  }
  if (status === 503) {
    return 'Delivery is unavailable. The request returned to tester_added with last_error and can be retried.';
  }
  return `Send failed (${status}). The web project returned an unexpected response.`;
}

function isAndroidInviteResult(body: unknown): body is AndroidInviteResult {
  if (!body || typeof body !== 'object') {
    return false;
  }

  const result = body as Partial<AndroidInviteResult>;
  return (
    typeof result.ok === 'boolean' &&
    typeof result.emailSent === 'boolean' &&
    typeof result.idempotent === 'boolean' &&
    'request' in result
  );
}

export async function applyGrantAction(formData: FormData): Promise<never> {
  const orgId = formValue(formData, 'orgId');
  const planKey = formValue(formData, 'planKey');
  const targetStatus = formValue(formData, 'targetStatus');
  const reason = formValue(formData, 'reason');
  const returnTo = safeReturnTo(formValue(formData, 'returnTo'), '/admin/orgs');

  if (!orgId) {
    redirect(withMessage(returnTo, 'error', 'Organization id is required'));
  }
  if (!planKey || planKey.length > 200) {
    redirect(withMessage(returnTo, 'error', 'planKey is invalid'));
  }
  if (targetStatus !== 'active' && targetStatus !== 'revoked') {
    redirect(
      withMessage(returnTo, 'error', 'targetStatus must be active or revoked')
    );
  }
  if (reason.length < 8 || reason.length > 1000) {
    redirect(
      withMessage(returnTo, 'error', 'reason must be 8 to 1000 characters')
    );
  }

  let failure: string | null = null;
  try {
    await adminRequest('/grants', {
      method: 'POST',
      operation: targetStatus === 'active' ? 'Grant access' : 'Revoke access',
      body: JSON.stringify({ orgId, planKey, targetStatus, reason }),
    });
  } catch (error) {
    failure = actionError(error);
  }

  if (failure) {
    redirect(withMessage(returnTo, 'error', failure));
  }
  redirect(
    withMessage(
      returnTo,
      'notice',
      targetStatus === 'active' ? 'Access granted' : 'Access revoked'
    )
  );
}

export async function markTesterAddedAction(
  formData: FormData
): Promise<never> {
  const id = formValue(formData, 'id');
  const returnTo = safeReturnTo(
    formValue(formData, 'returnTo'),
    '/admin/testers'
  );
  let failure: string | null = null;

  try {
    await adminRequest(`/tester-queue/${encodeURIComponent(id)}/tester-added`, {
      method: 'POST',
      operation: 'Mark tester added',
    });
  } catch (error) {
    failure = actionError(error);
  }

  if (failure) {
    redirect(withMessage(returnTo, 'error', failure));
  }
  redirect(withMessage(returnTo, 'notice', 'Tester marked added'));
}

export async function sendTesterInviteAction(
  formData: FormData
): Promise<never> {
  const { getToken, userId } = await auth();

  if (!isAdminClerkUserId(userId, env.ADMIN_CLERK_USER_IDS)) {
    notFound();
  }

  const id = formValue(formData, 'id');
  const returnTo = safeReturnTo(
    formValue(formData, 'returnTo'),
    '/admin/testers'
  );

  if (!id) {
    redirect(withMessage(returnTo, 'error', 'Invalid tester request ID.'));
  }
  if (!env.NEXT_PUBLIC_WEB_URL) {
    redirect(
      withMessage(returnTo, 'error', 'NEXT_PUBLIC_WEB_URL is not configured.')
    );
  }

  const token = await getToken();
  if (!token) {
    redirect(
      withMessage(
        returnTo,
        'error',
        'Could not acquire the founder Clerk session token.'
      )
    );
  }

  let response: Response;
  try {
    response = await fetch(
      `${env.NEXT_PUBLIC_WEB_URL.replace(TRAILING_SLASH, '')}/api/admin/android-access/${encodeURIComponent(id)}/complete`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          Origin: env.NEXT_PUBLIC_APP_URL,
        },
        cache: 'no-store',
      }
    );
  } catch {
    redirect(
      withMessage(
        returnTo,
        'error',
        'The web project is unreachable. No invite was sent.'
      )
    );
  }

  revalidatePath('/admin/testers');

  let body: unknown;
  try {
    body = await responseBody(response);
  } catch {
    redirect(
      withMessage(
        returnTo,
        'error',
        'The web project response could not be read. Delivery could not be confirmed.'
      )
    );
  }

  if (!response.ok) {
    const code = responseErrorCode(body);
    const message = inviteFailureMessage(response.status, code);
    const messageType =
      response.status === 409 && code === 'invite_in_progress'
        ? 'notice'
        : 'error';
    redirect(withMessage(returnTo, messageType, message));
  }

  if (!isAndroidInviteResult(body)) {
    redirect(
      withMessage(
        returnTo,
        'error',
        'The web project returned an invalid success response. Delivery could not be confirmed.'
      )
    );
  }

  if (!body.ok) {
    redirect(
      withMessage(
        returnTo,
        'error',
        'The web project did not confirm the send. No delivery is being claimed.'
      )
    );
  }
  if (body.idempotent) {
    redirect(withMessage(returnTo, 'notice', 'Already sent'));
  }
  if (!body.emailSent) {
    redirect(withMessage(returnTo, 'error', 'No email sent'));
  }

  redirect(withMessage(returnTo, 'notice', 'Invite sent'));
}
