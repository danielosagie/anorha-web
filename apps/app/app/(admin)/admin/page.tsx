import { env } from '@/env';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { ErrorState, PageHeader } from './_components/ui';
import { adminGet } from './_lib/api';
import type {
  AdminGdprRequest,
  AdminOrgListItem,
  AdminPageResponse,
  AdminTesterQueueItem,
  AdminWebhookHealth,
} from './_lib/contracts';

function failureOf(result: PromiseSettledResult<unknown>): string | null {
  if (result.status === 'fulfilled') {
    return null;
  }
  return result.reason instanceof Error
    ? result.reason.message
    : 'Admin request failed';
}

export default async function AdminOverviewPage() {
  const [orgs, testers, gdpr, health] = await Promise.allSettled([
    adminGet<AdminPageResponse<AdminOrgListItem>>(
      '/orgs?limit=50',
      'Load organizations'
    ),
    adminGet<AdminPageResponse<AdminTesterQueueItem>>(
      '/tester-queue?limit=50',
      'Load tester queue'
    ),
    adminGet<AdminPageResponse<AdminGdprRequest>>(
      '/gdpr-requests?limit=50',
      'Load GDPR requests'
    ),
    adminGet<AdminWebhookHealth>('/webhook-health', 'Load webhook health'),
  ]);
  const failures = [orgs, testers, gdpr, health]
    .map(failureOf)
    .filter((message): message is string => Boolean(message));

  return (
    <>
      <PageHeader title="Overview" />

      {failures.length > 0 ? (
        <ErrorState message={failures.join(' | ')} />
      ) : null}

      <section aria-label="Admin counts" className="admin-metric-row">
        <div className="admin-metric">
          <span className="admin-metric-label">Organizations</span>
          <strong>
            {orgs.status === 'fulfilled' ? orgs.value.items.length : 'N/A'}
          </strong>
          <small>First page</small>
        </div>
        <div className="admin-metric">
          <span className="admin-metric-label">Tester queue</span>
          <strong>
            {testers.status === 'fulfilled'
              ? testers.value.items.length
              : 'N/A'}
          </strong>
          <small>First page</small>
        </div>
        <div className="admin-metric">
          <span className="admin-metric-label">GDPR requests</span>
          <strong>
            {gdpr.status === 'fulfilled' ? gdpr.value.items.length : 'N/A'}
          </strong>
          <small>First page</small>
        </div>
        <div className="admin-metric">
          <span className="admin-metric-label">Dead letters</span>
          <strong>
            {health.status === 'fulfilled'
              ? health.value.deadLetters.total
              : 'N/A'}
          </strong>
          <small>Health scan</small>
        </div>
      </section>

      <div className="admin-overview-row">
        <section className="admin-card">
          <div className="admin-card-header">
            <h2>Operations</h2>
          </div>
          <div className="admin-link-list">
            <Link className="admin-link-row" href="/admin/orgs">
              <span>Organizations</span>
              <span className="admin-link">Open</span>
            </Link>
            <Link className="admin-link-row" href="/admin/testers">
              <span>Tester queue</span>
              <span className="admin-link">Open</span>
            </Link>
            <Link className="admin-link-row" href="/admin/compliance">
              <span>Compliance</span>
              <span className="admin-link">Open</span>
            </Link>
            <Link className="admin-link-row" href="/admin/usage">
              <span>Usage</span>
              <span className="admin-link">Open</span>
            </Link>
          </div>
        </section>

        <section className="admin-card">
          <div className="admin-card-header">
            <h2>Langfuse</h2>
          </div>
          <div className="admin-card-body">
            {env.LANGFUSE_DASHBOARD_URL ? (
              <a
                className="admin-button admin-button-primary"
                href={env.LANGFUSE_DASHBOARD_URL}
                rel="noopener noreferrer"
                target="_blank"
              >
                <ExternalLink aria-hidden="true" />
                Open dashboard
              </a>
            ) : (
              <p className="admin-notice">LANGFUSE_DASHBOARD_URL is not set.</p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
