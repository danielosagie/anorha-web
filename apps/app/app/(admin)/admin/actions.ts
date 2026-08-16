'use server';

import { redirect } from 'next/navigation';
import { AdminApiError, adminRequest } from './_lib/api';

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
  const id = formValue(formData, 'id');
  const returnTo = safeReturnTo(
    formValue(formData, 'returnTo'),
    '/admin/testers'
  );
  let failure: string | null = null;

  try {
    await adminRequest(`/tester-queue/${encodeURIComponent(id)}/send-invite`, {
      method: 'POST',
      operation: 'Send tester invite',
    });
  } catch (error) {
    failure = actionError(error);
  }

  if (failure) {
    redirect(withMessage(returnTo, 'error', failure));
  }
  redirect(withMessage(returnTo, 'notice', 'Invite sent'));
}
