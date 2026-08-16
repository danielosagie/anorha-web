import { Filter } from 'lucide-react';
import Link from 'next/link';
import { SendTesterInvite } from '../_components/send-tester-invite';
import {
  CursorPagination,
  EmptyState,
  ErrorState,
  PageHeader,
  Status,
} from '../_components/ui';
import { adminGet } from '../_lib/api';
import type {
  AdminPageResponse,
  AdminTesterQueueItem,
} from '../_lib/contracts';
import { firstParam, formatDate } from '../_lib/format';
import { markTesterAddedAction } from '../actions';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pageHref(values: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value) {
      params.set(key, value);
    }
  }
  const query = params.toString();
  return query ? `/admin/testers?${query}` : '/admin/testers';
}

function testerStatus(status: string): {
  label: string;
  tone: 'good' | 'warn' | 'neutral';
} {
  if (status === 'invite_sent') {
    return { label: 'Invite sent', tone: 'good' };
  }
  if (status === 'invite_sending') {
    return { label: 'Sending invite', tone: 'warn' };
  }
  if (status === 'tester_added') {
    return { label: 'Tester added', tone: 'neutral' };
  }
  if (status === 'pending') {
    return { label: 'Pending', tone: 'neutral' };
  }
  return { label: status, tone: 'neutral' };
}

function TesterStatus({ status }: { status: string }) {
  const display = testerStatus(status);
  return <Status tone={display.tone} value={display.label} />;
}

export default async function AdminTestersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const status = firstParam(params.status)?.trim();
  const cursor = firstParam(params.cursor);
  const trail = firstParam(params.trail);
  const notice = firstParam(params.notice);
  const actionError = firstParam(params.error);
  const query = new URLSearchParams({ limit: '25' });
  if (status) {
    query.set('status', status);
  }
  if (cursor) {
    query.set('cursor', cursor);
  }

  let data: AdminPageResponse<AdminTesterQueueItem> | null = null;
  let error: string | null = null;
  try {
    data = await adminGet<AdminPageResponse<AdminTesterQueueItem>>(
      `/tester-queue?${query.toString()}`,
      'Load tester queue'
    );
  } catch (caught) {
    error =
      caught instanceof Error ? caught.message : 'Load tester queue failed';
  }

  const returnTo = pageHref({ status, cursor, trail });

  return (
    <>
      <PageHeader title="Testers" />

      {notice ? (
        <div className="admin-notice" data-tone="good">
          {notice}
        </div>
      ) : null}
      {actionError ? (
        <div className="admin-notice" data-tone="bad">
          {actionError}
        </div>
      ) : null}

      <div className="admin-filter-bar">
        <form
          action="/admin/testers"
          className="admin-filter-form"
          method="get"
        >
          <input
            aria-label="Filter tester status"
            className="admin-input"
            defaultValue={status}
            name="status"
            placeholder="Exact status"
          />
          <button className="admin-button admin-button-secondary" type="submit">
            <Filter aria-hidden="true" />
            Filter
          </button>
        </form>
        {status ? (
          <Link className="admin-link" href="/admin/testers">
            Clear
          </Link>
        ) : null}
      </div>

      {error ? <ErrorState message={error} /> : null}
      {data ? (
        <>
          <section className="admin-card">
            <div className="admin-card-header">
              <h2>Android queue</h2>
              <span className="admin-label">{data.items.length} shown</span>
            </div>
            {data.items.length === 0 ? (
              <EmptyState>
                {status
                  ? 'No tester requests match this status.'
                  : 'No Android tester requests exist.'}
              </EmptyState>
            ) : (
              <div className="admin-table-wrap">
                <div className="admin-data-table admin-tester-table">
                  <div className="admin-data-head admin-tester-grid">
                    <span>Account email</span>
                    <span>Tester email</span>
                    <span>Source</span>
                    <span>Status</span>
                    <span>Last error</span>
                    <span>Actions</span>
                  </div>
                  {data.items.map((item) => (
                    <div
                      className="admin-data-row admin-tester-grid"
                      key={item.id}
                    >
                      <div className="admin-row-primary">
                        <strong>{item.accountEmail ?? 'Not linked'}</strong>
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                      <strong className="admin-tester-email">
                        {item.email}
                      </strong>
                      <span>{item.source}</span>
                      <TesterStatus status={item.status} />
                      <span
                        className="admin-tester-error"
                        data-has-error={Boolean(item.lastError)}
                      >
                        {item.lastError ?? 'None'}
                      </span>
                      <div className="admin-inline-actions">
                        <form action={markTesterAddedAction}>
                          <input name="id" type="hidden" value={item.id} />
                          <input
                            name="returnTo"
                            type="hidden"
                            value={returnTo}
                          />
                          <button
                            className="admin-button admin-button-secondary"
                            disabled={item.status !== 'pending'}
                            type="submit"
                          >
                            {item.status === 'pending' ? 'Mark added' : 'Added'}
                          </button>
                        </form>
                        <SendTesterInvite
                          email={item.email}
                          requestId={item.id}
                          returnTo={returnTo}
                          status={item.status}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
          <CursorPagination
            cursor={cursor}
            filters={{ status }}
            nextCursor={data.nextCursor}
            pathname="/admin/testers"
            trail={trail}
          />
        </>
      ) : null}
    </>
  );
}
