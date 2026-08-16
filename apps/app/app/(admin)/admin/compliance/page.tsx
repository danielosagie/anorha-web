import {
  CursorPagination,
  EmptyState,
  ErrorState,
  PageHeader,
  Status,
} from '../_components/ui';
import { adminGet } from '../_lib/api';
import type {
  AdminGdprRequest,
  AdminHealthProjection,
  AdminPageResponse,
  AdminWebhookHealth,
} from '../_lib/contracts';
import { firstParam, formatDate, formatNumber } from '../_lib/format';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function resultError(result: PromiseSettledResult<unknown>): string | null {
  if (result.status === 'fulfilled') {
    return null;
  }
  return result.reason instanceof Error
    ? result.reason.message
    : 'Compliance request failed';
}

function HealthTable({
  title,
  projection,
}: {
  title: string;
  projection: AdminHealthProjection;
}) {
  return (
    <section className="admin-card">
      <div className="admin-card-header">
        <h2>{title}</h2>
        <span className="admin-label">
          {formatNumber(projection.total)} scanned
        </span>
      </div>
      {projection.counts.length === 0 ? (
        <EmptyState>No health rows were returned.</EmptyState>
      ) : (
        <div className="admin-table-wrap">
          <div className="admin-data-table">
            <div className="admin-data-head admin-health-grid">
              <span>Platform</span>
              <span>Status</span>
              <span>Count</span>
            </div>
            {projection.counts.map((row) => (
              <div
                className="admin-data-row admin-health-grid"
                key={`${row.platform}:${row.status}`}
              >
                <strong>{row.platform}</strong>
                <Status value={row.status} />
                <span className="admin-mono">{formatNumber(row.count)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default async function AdminCompliancePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const cursor = firstParam(params.cursor);
  const trail = firstParam(params.trail);
  const gdprQuery = new URLSearchParams({ limit: '25' });
  if (cursor) {
    gdprQuery.set('cursor', cursor);
  }

  const [gdprResult, healthResult] = await Promise.allSettled([
    adminGet<AdminPageResponse<AdminGdprRequest>>(
      `/gdpr-requests?${gdprQuery.toString()}`,
      'Load GDPR requests'
    ),
    adminGet<AdminWebhookHealth>('/webhook-health', 'Load webhook health'),
  ]);
  const failures = [gdprResult, healthResult]
    .map(resultError)
    .filter((message): message is string => Boolean(message));
  const health =
    healthResult.status === 'fulfilled' ? healthResult.value : null;
  const parkedReasons = health
    ? [
        ...health.webhookEvents.failureReasons.map((reason) => ({
          ...reason,
          inbox: 'Webhook',
        })),
        ...health.deadLetters.failureReasons.map((reason) => ({
          ...reason,
          inbox: 'DLQ',
        })),
      ]
    : [];

  return (
    <>
      <PageHeader title="Compliance" />

      {failures.length > 0 ? (
        <ErrorState message={failures.join(' | ')} />
      ) : null}

      {health ? (
        <>
          <div className="admin-two-column">
            <HealthTable
              projection={health.webhookEvents}
              title="Webhook inbox"
            />
            <HealthTable projection={health.deadLetters} title="Dead letters" />
          </div>

          <section className="admin-card">
            <div className="admin-card-header">
              <h2>Parked reasons</h2>
              <span className="admin-label">
                {formatNumber(parkedReasons.length)} groups
              </span>
            </div>
            {parkedReasons.length === 0 ? (
              <EmptyState>
                No parked or failure reasons were returned.
              </EmptyState>
            ) : (
              <div className="admin-table-wrap">
                <div className="admin-data-table">
                  <div className="admin-data-head admin-reason-grid">
                    <span>Inbox</span>
                    <span>Platform</span>
                    <span>Reason</span>
                    <span>Count</span>
                  </div>
                  {parkedReasons.map((row) => (
                    <div
                      className="admin-data-row admin-reason-grid"
                      key={`${row.inbox}:${row.platform}:${row.status}:${row.reason}`}
                    >
                      <span>{row.inbox}</span>
                      <div className="admin-row-primary">
                        <strong>{row.platform}</strong>
                        <span>{row.status}</span>
                      </div>
                      <span title={row.reason}>{row.reason}</span>
                      <span className="admin-mono">
                        {formatNumber(row.count)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {health.webhookEvents.reasonsTruncated ||
            health.deadLetters.reasonsTruncated ? (
              <div className="admin-notice">
                Reason groups exceed the backend display budget.
              </div>
            ) : null}
          </section>
        </>
      ) : null}

      {gdprResult.status === 'fulfilled' ? (
        <>
          <section className="admin-card">
            <div className="admin-card-header">
              <h2>GDPR requests</h2>
              <span className="admin-label">
                {gdprResult.value.items.length} shown
              </span>
            </div>
            {gdprResult.value.items.length === 0 ? (
              <EmptyState>No GDPR requests exist.</EmptyState>
            ) : (
              <div className="admin-table-wrap">
                <div className="admin-data-table">
                  <div className="admin-data-head admin-gdpr-grid">
                    <span>Request</span>
                    <span>Shop</span>
                    <span>Status</span>
                    <span>Received</span>
                    <span>Due</span>
                  </div>
                  {gdprResult.value.items.map((request) => (
                    <div
                      className="admin-data-row admin-gdpr-grid"
                      key={request.id}
                    >
                      <div className="admin-row-primary">
                        <strong>{request.topic}</strong>
                        <span>{request.webhookId}</span>
                      </div>
                      <span>{request.shopDomain}</span>
                      <Status value={request.status} />
                      <span>{formatDate(request.receivedAt)}</span>
                      <span>{formatDate(request.dueBy)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
          <CursorPagination
            cursor={cursor}
            filters={{}}
            nextCursor={gdprResult.value.nextCursor}
            pathname="/admin/compliance"
            trail={trail}
          />
        </>
      ) : null}
    </>
  );
}
