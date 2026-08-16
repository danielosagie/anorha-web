import { Search } from 'lucide-react';
import Link from 'next/link';
import {
  CursorPagination,
  EmptyState,
  ErrorState,
  PageHeader,
} from '../_components/ui';
import { adminGet } from '../_lib/api';
import type {
  AdminOrgListItem,
  AdminPageResponse,
  AdminUsageResponse,
} from '../_lib/contracts';
import { firstParam, formatCost, formatNumber } from '../_lib/format';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function UsageRow({
  org,
  result,
}: {
  org: AdminOrgListItem;
  result: PromiseSettledResult<AdminUsageResponse> | undefined;
}) {
  const usage = result?.status === 'fulfilled' ? result.value : null;
  const events = usage ? formatNumber(usage.summary.totalEvents) : 'Error';
  const cost = usage ? formatCost(usage.summary.totalCostCents) : 'Error';
  const users = usage
    ? formatNumber(Object.keys(usage.summary.byUser).length)
    : 'Error';

  return (
    <div className="admin-data-row admin-usage-grid">
      <div className="admin-row-primary">
        <strong>{org.name}</strong>
        <span>{org.ownerEmail ?? org.id}</span>
      </div>
      <span className="admin-mono">{events}</span>
      <span className="admin-mono">{cost}</span>
      <span className="admin-mono">{users}</span>
      <Link
        className="admin-button admin-button-secondary"
        href={`/admin/orgs?org=${encodeURIComponent(org.id)}`}
      >
        Open
      </Link>
    </div>
  );
}

export default async function AdminUsagePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = firstParam(params.q)?.trim();
  const cursor = firstParam(params.cursor);
  const trail = firstParam(params.trail);
  const orgQuery = new URLSearchParams({ limit: '20' });
  if (q) {
    orgQuery.set('q', q);
  }
  if (cursor) {
    orgQuery.set('cursor', cursor);
  }

  let orgs: AdminPageResponse<AdminOrgListItem> | null = null;
  let listError: string | null = null;
  try {
    orgs = await adminGet<AdminPageResponse<AdminOrgListItem>>(
      `/orgs?${orgQuery.toString()}`,
      'Load usage organizations'
    );
  } catch (caught) {
    listError =
      caught instanceof Error
        ? caught.message
        : 'Load usage organizations failed';
  }

  const usageResults = orgs
    ? await Promise.allSettled(
        orgs.items.map((org) =>
          adminGet<AdminUsageResponse>(
            `/usage?orgId=${encodeURIComponent(org.id)}`,
            `Load usage for ${org.name}`
          )
        )
      )
    : [];
  const usageErrors = [
    ...new Set(
      usageResults.flatMap((result) =>
        result.status === 'rejected'
          ? [
              result.reason instanceof Error
                ? result.reason.message
                : 'Load organization usage failed',
            ]
          : []
      )
    ),
  ];

  return (
    <>
      <PageHeader title="Usage" />

      <div className="admin-filter-bar">
        <form action="/admin/usage" className="admin-filter-form" method="get">
          <input
            aria-label="Filter usage organizations"
            className="admin-input"
            defaultValue={q}
            name="q"
            placeholder="Name or owner email"
            type="search"
          />
          <button className="admin-button admin-button-secondary" type="submit">
            <Search aria-hidden="true" />
            Filter
          </button>
        </form>
        {q ? (
          <Link className="admin-link" href="/admin/usage">
            Clear
          </Link>
        ) : null}
      </div>

      {listError ? <ErrorState message={listError} /> : null}
      {usageErrors.length > 0 ? (
        <ErrorState message={usageErrors.join(' | ')} />
      ) : null}

      {orgs ? (
        <>
          <section className="admin-card">
            <div className="admin-card-header">
              <h2>Organization usage</h2>
              <span className="admin-label">{orgs.items.length} shown</span>
            </div>
            {orgs.items.length === 0 ? (
              <EmptyState>
                {q
                  ? 'No organizations match this filter.'
                  : 'No organizations exist for usage reporting.'}
              </EmptyState>
            ) : (
              <div className="admin-table-wrap">
                <div className="admin-data-table">
                  <div className="admin-data-head admin-usage-grid">
                    <span>Organization</span>
                    <span>Events</span>
                    <span>Cost</span>
                    <span>Users</span>
                    <span />
                  </div>
                  {orgs.items.map((org, index) => (
                    <UsageRow
                      key={org.id}
                      org={org}
                      result={usageResults[index]}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
          <CursorPagination
            cursor={cursor}
            filters={{ q }}
            nextCursor={orgs.nextCursor}
            pathname="/admin/usage"
            trail={trail}
          />
        </>
      ) : null}
    </>
  );
}
