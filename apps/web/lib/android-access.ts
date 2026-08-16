import { createHash } from 'node:crypto';
import { env } from '@/env';
import { auth, currentUser } from '@repo/auth/server';
import { resend } from '@repo/email';
import { AndroidAccessTemplate } from '@repo/email/templates/android-access';
import { createElement } from 'react';

const ANDROID_ACCESS_FROM = 'noreply@anorha.app';

const requestColumns = [
  'id',
  'email',
  'clerk_user_id',
  'account_email',
  'source',
  'status',
  'notified_at',
  'tester_added_at',
  'invite_sent_at',
  'last_error',
  'created_at',
  'updated_at',
].join(',');

type AndroidAccessRow = {
  id: string;
  email: string;
  clerk_user_id: string | null;
  account_email: string | null;
  source: string;
  status: string;
  notified_at: string | null;
  tester_added_at: string | null;
  invite_sent_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  was_created?: boolean;
  claim_outcome?: 'already_sent' | 'in_progress' | 'send';
};

export type AndroidAccessRequest = {
  id: string;
  playEmail: string;
  accountEmail: string | null;
  clerkUserId: string | null;
  source: string;
  status: string;
  notifiedAt: string | null;
  testerAddedAt: string | null;
  inviteSentAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RequestIdentity = {
  userId: string;
  accountEmail: string | null;
};

export type PendingNotificationResult = {
  pendingEmail: 'failed' | 'sent';
  founder: 'failed' | 'not_configured' | 'sent';
};

export class AndroidAccessStorageError extends Error {
  readonly code: string | null;
  readonly status: number;

  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.name = 'AndroidAccessStorageError';
    this.status = status;
    this.code = code;
  }
}

export class AndroidAccessEmailError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'AndroidAccessEmailError';
    this.code = code;
  }
}

function toRequest(row: AndroidAccessRow): AndroidAccessRequest {
  return {
    id: row.id,
    playEmail: row.email,
    accountEmail: row.account_email,
    clerkUserId: row.clerk_user_id,
    source: row.source,
    status: row.status,
    notifiedAt: row.notified_at,
    testerAddedAt: row.tester_added_at,
    inviteSentAt: row.invite_sent_at,
    lastError: row.last_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function storageConfiguration() {
  if (!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY)) {
    throw new AndroidAccessStorageError(
      'Android access storage is not configured.',
      503
    );
  }

  return {
    key: env.SUPABASE_SERVICE_ROLE_KEY,
    url: env.SUPABASE_URL,
  };
}

async function storageRequest<T>(
  resource: string,
  init: RequestInit
): Promise<T> {
  const storage = storageConfiguration();
  const response = await fetch(`${storage.url}/rest/v1/${resource}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      apikey: storage.key,
      Authorization: `Bearer ${storage.key}`,
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    let code: string | null = null;

    try {
      const parsed = JSON.parse(body) as { code?: unknown };
      code = typeof parsed.code === 'string' ? parsed.code : null;
    } catch {
      code = null;
    }

    // biome-ignore lint/suspicious/noConsole: Operators need the PostgREST receipt while callers receive a safe error.
    console.error(
      '[android-access] storage request failed',
      `resource=${resource}`,
      `status=${response.status}`,
      body
    );
    throw new AndroidAccessStorageError(
      'Android access storage request failed.',
      response.status,
      code
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function rpc<T>(name: string, body: Record<string, unknown>) {
  return storageRequest<T>(`rpc/${name}`, {
    body: JSON.stringify(body),
    method: 'POST',
  });
}

function firstRow(rows: AndroidAccessRow[], operation: string) {
  const row = rows[0];
  if (!row) {
    throw new AndroidAccessStorageError(
      `Android access ${operation} returned no row.`,
      404
    );
  }
  return row;
}

export async function getRequestIdentity(): Promise<RequestIdentity | null> {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }

  const user = await currentUser();
  return {
    userId,
    accountEmail:
      user?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? null,
  };
}

export function isFounderAllowed(identity: RequestIdentity): boolean {
  const entries = (env.ADMIN_CLERK_USER_IDS ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (entries.length === 0) {
    return false;
  }

  const allowlist = new Set(entries);
  return (
    allowlist.has(identity.userId.toLowerCase()) ||
    (identity.accountEmail !== null && allowlist.has(identity.accountEmail))
  );
}

export function isAllowedAppOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) {
    return true;
  }

  return origin === new URL(env.NEXT_PUBLIC_APP_URL).origin;
}

export function corsHeaders(request: Request, methods: string): HeadersInit {
  const origin = request.headers.get('origin');
  const headers: Record<string, string> = {
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  };

  if (origin === new URL(env.NEXT_PUBLIC_APP_URL).origin) {
    headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type';
    headers['Access-Control-Allow-Methods'] = methods;
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}

export async function requestAndroidAccess({
  accountEmail,
  playEmail,
  userId,
}: {
  accountEmail: string;
  playEmail: string;
  userId: string;
}) {
  const rows = await rpc<AndroidAccessRow[]>('request_android_access', {
    p_account_email: accountEmail.toLowerCase(),
    p_clerk_user_id: userId,
    p_tester_email: playEmail.toLowerCase(),
  });
  const row = firstRow(rows, 'request');

  return {
    request: toRequest(row),
    wasCreated: row.was_created === true,
  };
}

export async function upsertMarketingAndroidAccess(playEmail: string) {
  const rows = await storageRequest<AndroidAccessRow[]>(
    'waitlist_signups?on_conflict=email',
    {
      body: JSON.stringify({
        email: playEmail.toLowerCase(),
        updated_at: new Date().toISOString(),
      }),
      headers: {
        Prefer: 'return=representation,resolution=merge-duplicates',
      },
      method: 'POST',
    }
  );

  return toRequest(firstRow(rows, 'marketing request'));
}

export async function getAndroidAccessForUser(userId: string) {
  const params = new URLSearchParams({
    clerk_user_id: `eq.${userId}`,
    select: requestColumns,
  });
  const rows = await storageRequest<AndroidAccessRow[]>(
    `waitlist_signups?${params.toString()}`,
    { method: 'GET' }
  );

  return rows[0] ? toRequest(rows[0]) : null;
}

export async function listPendingAndroidAccess() {
  const params = new URLSearchParams({
    invite_sent_at: 'is.null',
    order: 'created_at.asc',
    select: requestColumns,
  });
  const rows = await storageRequest<AndroidAccessRow[]>(
    `waitlist_signups?${params.toString()}`,
    { method: 'GET' }
  );

  return rows.map(toRequest);
}

function emailKey(email: string) {
  return createHash('sha256').update(email.toLowerCase()).digest('hex');
}

async function sendEmail(
  payload: Parameters<typeof resend.emails.send>[0],
  idempotencyKey: string
) {
  const result = await resend.emails.send(payload, { idempotencyKey });
  if (result.error) {
    throw new AndroidAccessEmailError(result.error.name, result.error.message);
  }
  if (!result.data?.id) {
    throw new AndroidAccessEmailError(
      'invalid_response',
      'Email delivery returned no message id.'
    );
  }
}

export async function sendPendingAndroidAccessNotifications(
  request: AndroidAccessRequest
): Promise<PendingNotificationResult> {
  const errors: string[] = [];
  const addressKey = emailKey(request.playEmail);
  let pendingEmail: PendingNotificationResult['pendingEmail'] = 'failed';
  let founder: PendingNotificationResult['founder'] = 'failed';

  try {
    await sendEmail(
      {
        from: ANDROID_ACCESS_FROM,
        react: createElement(AndroidAccessTemplate),
        subject: "You're on the Anorha list",
        to: request.playEmail,
      },
      `android-access-pending-${request.id}-${addressKey}`
    );
    pendingEmail = 'sent';
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`Pending email failed: ${message}`);
    // biome-ignore lint/suspicious/noConsole: A saved request with failed mail needs an operator-visible receipt.
    console.error('[android-access] pending email failed', request.id, error);
  }

  if (env.WAITLIST_NOTIFY_TO) {
    try {
      await sendEmail(
        {
          from: ANDROID_ACCESS_FROM,
          replyTo: request.accountEmail ?? request.playEmail,
          subject: `New Android access request: ${request.playEmail}`,
          text: [
            `Google Play email: ${request.playEmail}`,
            `Account email: ${request.accountEmail ?? 'Not available'}`,
            `Clerk user id: ${request.clerkUserId ?? 'Marketing request'}`,
          ].join('\n'),
          to: env.WAITLIST_NOTIFY_TO,
        },
        `android-access-founder-${request.id}-${addressKey}`
      );
      founder = 'sent';
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`Founder notification failed: ${message}`);
      // biome-ignore lint/suspicious/noConsole: Founder notification failures must not disappear after persistence succeeds.
      console.error(
        '[android-access] founder notification failed',
        request.id,
        error
      );
    }
  } else {
    founder = 'not_configured';
    errors.push('Founder notification failed: WAITLIST_NOTIFY_TO is not set.');
    // biome-ignore lint/suspicious/noConsole: Missing notification configuration is stored and logged for operators.
    console.error(
      '[android-access] founder notification skipped: WAITLIST_NOTIFY_TO is not set'
    );
  }

  const now = new Date().toISOString();
  const body: Record<string, string | null> = {
    last_error: errors.length > 0 ? errors.join(' ') : null,
    updated_at: now,
  };
  if (founder === 'sent') {
    body.notified_at = now;
  }

  const params = new URLSearchParams({ id: `eq.${request.id}` });
  await storageRequest<void>(`waitlist_signups?${params.toString()}`, {
    body: JSON.stringify(body),
    headers: { Prefer: 'return=minimal' },
    method: 'PATCH',
  });

  return { founder, pendingEmail };
}

export async function claimAndroidAccessInvite(requestId: string) {
  const rows = await rpc<AndroidAccessRow[]>('claim_android_access_invite', {
    p_request_id: requestId,
  });
  const row = firstRow(rows, 'invite claim');

  return {
    outcome: row.claim_outcome ?? 'send',
    request: toRequest(row),
  };
}

export async function sendAndroidAccessInvite(request: AndroidAccessRequest) {
  const accessUrl = env.NEXT_PUBLIC_ANDROID_ACCESS_URL;
  if (!accessUrl) {
    throw new AndroidAccessEmailError(
      'access_url_not_configured',
      'NEXT_PUBLIC_ANDROID_ACCESS_URL is not set.'
    );
  }

  await sendEmail(
    {
      from: ANDROID_ACCESS_FROM,
      react: createElement(AndroidAccessTemplate, { accessUrl }),
      subject: 'Your Anorha Android install link',
      text: `Your Anorha Android access is ready. Open this link on your Android phone: ${accessUrl}`,
      to: request.playEmail,
    },
    `android-access-invite-${request.id}`
  );
}

export async function markAndroidAccessInviteSent(requestId: string) {
  const rows = await rpc<AndroidAccessRow[]>(
    'mark_android_access_invite_sent',
    { p_request_id: requestId }
  );
  return toRequest(firstRow(rows, 'invite completion'));
}

export async function recordAndroidAccessInviteError(
  requestId: string,
  error: string
) {
  const rows = await rpc<AndroidAccessRow[]>(
    'record_android_access_invite_error',
    {
      p_error: error,
      p_request_id: requestId,
    }
  );
  return toRequest(firstRow(rows, 'invite error'));
}
