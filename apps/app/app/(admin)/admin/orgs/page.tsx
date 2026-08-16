import { Search, X } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  CursorPagination,
  EmptyState,
  ErrorState,
  PageHeader,
  Status,
} from '../_components/ui';
import { adminGet } from '../_lib/api';
import type {
  AdminOrgDetail,
  AdminOrgListItem,
  AdminPageResponse,
  AdminUsageResponse,
} from '../_lib/contracts';
import {
  firstParam,
  formatCost,
  formatDate,
  formatNumber,
} from '../_lib/format';
import { applyGrantAction } from '../actions';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type BaseValues = Record<string, string | undefined>;
type DetailResult = PromiseSettledResult<AdminOrgDetail | null>;
type UsageResult = PromiseSettledResult<AdminUsageResponse | null>;

function queryHref(values: BaseValues, extra: BaseValues = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...values, ...extra })) {
    if (value) {
      params.set(key, value);
    }
  }
  const query = params.toString();
  return query ? `/admin/orgs?${query}` : '/admin/orgs';
}

function reasonOf(result: PromiseSettledResult<unknown>): string {
  if (result.status === 'fulfilled') {
    return '';
  }
  return result.reason instanceof Error
    ? result.reason.message
    : 'Organization request failed';
}

function OrganizationTable({
  items,
  q,
  baseValues,
}: {
  items: AdminOrgListItem[];
  q?: string;
  baseValues: BaseValues;
}) {
  if (items.length === 0) {
    return (
      <EmptyState>
        {q ? 'No organizations match this filter.' : 'No organizations exist.'}
      </EmptyState>
    );
  }

  return (
    <div className="admin-table-wrap">
      <div className="admin-data-table">
        <div className="admin-data-head admin-org-grid">
          <span>Organization</span>
          <span>Owner</span>
          <span>Plan</span>
          <span>Status</span>
          <span />
        </div>
        {items.map((org) => (
          <div className="admin-data-row admin-org-grid" key={org.id}>
            <div className="admin-row-primary">
              <strong>{org.name}</strong>
              <span>{formatDate(org.createdAt)}</span>
            </div>
            <span>{org.ownerEmail ?? 'No owner email'}</span>
            <span>{org.billing?.planKey ?? 'No plan'}</span>
            {org.billing ? (
              <Status value={org.billing.status} />
            ) : (
              <span>None</span>
            )}
            <Link
              className="admin-button admin-button-secondary"
              href={queryHref(baseValues, { org: org.id })}
            >
              Open
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function DrawerSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="admin-detail-group">
      <span className="admin-label">{label}</span>
      {children}
    </section>
  );
}

function BillingDetails({
  detail,
  selectedOrgId,
  baseValues,
}: {
  detail: AdminOrgDetail;
  selectedOrgId: string;
  baseValues: BaseValues;
}) {
  return (
    <DrawerSection label="Billing">
      <dl>
        <div className="admin-detail-row">
          <dt>Source</dt>
          <dd>{detail.billing?.source ?? 'No entitlement'}</dd>
        </div>
        <div className="admin-detail-row">
          <dt>Plan</dt>
          <dd>{detail.billing?.planKey ?? 'No plan'}</dd>
        </div>
        <div className="admin-detail-row">
          <dt>Status</dt>
          <dd>
            {detail.billing ? <Status value={detail.billing.status} /> : 'None'}
          </dd>
        </div>
        <div className="admin-detail-row">
          <dt>Paid through</dt>
          <dd>{formatDate(detail.billing?.paidThrough ?? null)}</dd>
        </div>
        <div className="admin-detail-row">
          <dt>Period end</dt>
          <dd>{formatDate(detail.billing?.currentPeriodEnd ?? null)}</dd>
        </div>
      </dl>
      <div className="admin-drawer-actions">
        <Link
          className="admin-button admin-button-primary"
          href={queryHref(baseValues, {
            org: selectedOrgId,
            action: 'grant',
          })}
        >
          Grant access
        </Link>
        <Link
          className="admin-button admin-button-secondary"
          href={queryHref(baseValues, {
            org: selectedOrgId,
            action: 'revoke',
          })}
        >
          Revoke access
        </Link>
      </div>
    </DrawerSection>
  );
}

function UsageDetails({ result }: { result: UsageResult }) {
  if (result.status === 'rejected') {
    return <ErrorState message={reasonOf(result)} />;
  }
  if (!result.value) {
    return <EmptyState>No usage summary exists.</EmptyState>;
  }
  return (
    <dl>
      <div className="admin-detail-row">
        <dt>Events</dt>
        <dd>{formatNumber(result.value.summary.totalEvents)}</dd>
      </div>
      <div className="admin-detail-row">
        <dt>Cost</dt>
        <dd>{formatCost(result.value.summary.totalCostCents)}</dd>
      </div>
      <div className="admin-detail-row">
        <dt>Source</dt>
        <dd>{result.value.source}</dd>
      </div>
    </dl>
  );
}

function PlatformDetails({ detail }: { detail: AdminOrgDetail }) {
  if (detail.connectedPlatforms.length === 0) {
    return <EmptyState>No connected platforms exist.</EmptyState>;
  }
  return (
    <div className="admin-platform-list">
      {detail.connectedPlatforms.map((platform) => (
        <div className="admin-platform-row" key={platform.id}>
          <div className="admin-row-primary">
            <strong>{platform.name}</strong>
            <span>{platform.platform}</span>
          </div>
          <Status value={platform.enabled ? platform.status : 'disabled'} />
        </div>
      ))}
    </div>
  );
}

function OrganizationDrawer({
  selectedOrgId,
  closeHref,
  baseValues,
  detailResult,
  usageResult,
}: {
  selectedOrgId: string;
  closeHref: string;
  baseValues: BaseValues;
  detailResult: DetailResult;
  usageResult: UsageResult;
}) {
  const detail =
    detailResult.status === 'fulfilled' ? detailResult.value : null;
  return (
    <div className="admin-overlay">
      <Link
        aria-label="Close organization"
        className="admin-overlay-dismiss"
        href={closeHref}
      />
      <aside aria-labelledby="org-drawer-title" className="admin-drawer">
        <div className="admin-drawer-header">
          <div>
            <h2 id="org-drawer-title">{detail?.name ?? 'Organization'}</h2>
            <p>{selectedOrgId}</p>
          </div>
          <Link
            aria-label="Close organization"
            className="admin-button admin-button-secondary"
            href={closeHref}
          >
            <X aria-hidden="true" />
          </Link>
        </div>
        <div className="admin-drawer-body">
          {detailResult.status === 'rejected' ? (
            <ErrorState message={reasonOf(detailResult)} />
          ) : null}
          {detail ? (
            <>
              <BillingDetails
                baseValues={baseValues}
                detail={detail}
                selectedOrgId={selectedOrgId}
              />
              <DrawerSection label="Usage">
                <UsageDetails result={usageResult} />
              </DrawerSection>
              <DrawerSection label="Platforms">
                <PlatformDetails detail={detail} />
              </DrawerSection>
            </>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function GrantDialog({
  confirmation,
  detail,
  drawerReturnTo,
}: {
  confirmation: 'grant' | 'revoke';
  detail: AdminOrgDetail;
  drawerReturnTo: string;
}) {
  const granting = confirmation === 'grant';
  return (
    <div className="admin-confirm-layer">
      <Link
        aria-label="Cancel confirmation"
        className="admin-confirm-dismiss"
        href={drawerReturnTo}
      />
      <dialog
        aria-labelledby="grant-dialog-title"
        className="admin-dialog"
        open
      >
        <div className="admin-dialog-header">
          <h2 id="grant-dialog-title">
            {granting ? 'Grant access' : 'Revoke access'}
          </h2>
          <p>{detail.name}</p>
        </div>
        <form action={applyGrantAction}>
          <input name="orgId" type="hidden" value={detail.id} />
          <input
            name="targetStatus"
            type="hidden"
            value={granting ? 'active' : 'revoked'}
          />
          <input name="returnTo" type="hidden" value={drawerReturnTo} />
          <div className="admin-field-group">
            <div className="admin-field">
              <label htmlFor="planKey">Plan key</label>
              <input
                className="admin-input"
                defaultValue={detail.billing?.planKey ?? ''}
                id="planKey"
                maxLength={200}
                name="planKey"
                required
              />
            </div>
            <div className="admin-field">
              <label htmlFor="reason">Reason</label>
              <textarea
                className="admin-textarea"
                id="reason"
                maxLength={1000}
                minLength={8}
                name="reason"
                placeholder="At least 8 characters"
                required
              />
              <small>Stored in the admin audit trail.</small>
            </div>
          </div>
          <div className="admin-dialog-actions">
            <Link
              className="admin-button admin-button-secondary"
              href={drawerReturnTo}
            >
              Cancel
            </Link>
            <button
              className={`admin-button ${
                granting ? 'admin-button-primary' : 'admin-button-danger'
              }`}
              type="submit"
            >
              {granting ? 'Confirm grant' : 'Confirm revoke'}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}

export default async function AdminOrganizationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = firstParam(params.q)?.trim();
  const cursor = firstParam(params.cursor);
  const trail = firstParam(params.trail);
  const selectedOrgId = firstParam(params.org);
  const requestedAction = firstParam(params.action);
  const notice = firstParam(params.notice);
  const actionError = firstParam(params.error);
  const listQuery = new URLSearchParams({ limit: '25' });
  if (q) {
    listQuery.set('q', q);
  }
  if (cursor) {
    listQuery.set('cursor', cursor);
  }

  const listPromise = adminGet<AdminPageResponse<AdminOrgListItem>>(
    `/orgs?${listQuery.toString()}`,
    'Load organizations'
  );
  const detailPromise = selectedOrgId
    ? adminGet<AdminOrgDetail>(
        `/orgs/${encodeURIComponent(selectedOrgId)}`,
        'Load organization detail'
      )
    : Promise.resolve(null);
  const usagePromise = selectedOrgId
    ? adminGet<AdminUsageResponse>(
        `/usage?orgId=${encodeURIComponent(selectedOrgId)}`,
        'Load organization usage'
      )
    : Promise.resolve(null);
  const [listResult, detailResult, usageResult] = await Promise.allSettled([
    listPromise,
    detailPromise,
    usagePromise,
  ]);

  const baseValues = { q, cursor, trail };
  const drawerReturnTo = queryHref(baseValues, { org: selectedOrgId });
  const detail =
    detailResult.status === 'fulfilled' ? detailResult.value : null;
  const confirmation =
    requestedAction === 'grant' || requestedAction === 'revoke'
      ? requestedAction
      : null;

  return (
    <>
      <PageHeader title="Organizations" />
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
        <form action="/admin/orgs" className="admin-filter-form" method="get">
          <input
            aria-label="Filter organizations"
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
          <Link className="admin-link" href="/admin/orgs">
            Clear
          </Link>
        ) : null}
      </div>

      {listResult.status === 'rejected' ? (
        <ErrorState message={reasonOf(listResult)} />
      ) : (
        <>
          <section className="admin-card">
            <div className="admin-card-header">
              <h2>Organizations</h2>
              <span className="admin-label">
                {listResult.value.items.length} shown
              </span>
            </div>
            <OrganizationTable
              baseValues={baseValues}
              items={listResult.value.items}
              q={q}
            />
          </section>
          <CursorPagination
            cursor={cursor}
            filters={{ q }}
            nextCursor={listResult.value.nextCursor}
            pathname="/admin/orgs"
            trail={trail}
          />
        </>
      )}

      {selectedOrgId ? (
        <OrganizationDrawer
          baseValues={baseValues}
          closeHref={queryHref(baseValues)}
          detailResult={detailResult}
          selectedOrgId={selectedOrgId}
          usageResult={usageResult}
        />
      ) : null}
      {confirmation && detail ? (
        <GrantDialog
          confirmation={confirmation}
          detail={detail}
          drawerReturnTo={drawerReturnTo}
        />
      ) : null}
    </>
  );
}
