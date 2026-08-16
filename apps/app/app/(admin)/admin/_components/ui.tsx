import { AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { statusTone } from '../_lib/format';

export function PageHeader({
  title,
  actions,
}: {
  title: string;
  actions?: ReactNode;
}) {
  return (
    <header className="admin-page-header">
      <h1>{title}</h1>
      {actions ? <div className="admin-header-actions">{actions}</div> : null}
    </header>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <section className="admin-error" role="alert">
      <AlertCircle aria-hidden="true" />
      <div>
        <h2>Request failed</h2>
        <p>{message}</p>
      </div>
    </section>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="admin-empty">{children}</div>;
}

export function Status({ value }: { value: string }) {
  return (
    <span className="admin-status">
      <span
        aria-hidden="true"
        className="admin-status-dot"
        data-tone={statusTone(value)}
      />
      <span>{value}</span>
    </span>
  );
}

const START_CURSOR = '~';
const MAX_TRAIL_ITEMS = 24;
const CURSOR_PART = /^[A-Za-z0-9_-]+$/;

function readTrail(value: string | undefined): string[] {
  if (!value || value.length > 8192) {
    return [];
  }
  return value
    .split('.')
    .filter((item) => item === START_CURSOR || CURSOR_PART.test(item))
    .slice(-MAX_TRAIL_ITEMS);
}

function pageHref(
  pathname: string,
  filters: Record<string, string | undefined>,
  cursor: string | null,
  trail: string[]
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params.set(key, value);
    }
  }
  if (cursor) {
    params.set('cursor', cursor);
  }
  if (trail.length > 0) {
    params.set('trail', trail.join('.'));
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function CursorPagination({
  pathname,
  filters,
  cursor,
  nextCursor,
  trail: trailValue,
}: {
  pathname: string;
  filters: Record<string, string | undefined>;
  cursor?: string;
  nextCursor: string | null;
  trail?: string;
}) {
  const trail = readTrail(trailValue);
  const previous = trail.at(-1);
  const previousCursor = previous === START_CURSOR ? null : previous;
  const previousTrail = trail.slice(0, -1);
  const nextTrail = [...trail, cursor ?? START_CURSOR].slice(-MAX_TRAIL_ITEMS);

  if (!previous && !nextCursor) {
    return null;
  }

  return (
    <nav aria-label="Pagination" className="admin-pagination">
      {previous ? (
        <Link
          className="admin-button admin-button-secondary"
          href={pageHref(
            pathname,
            filters,
            previousCursor ?? null,
            previousTrail
          )}
        >
          <ArrowLeft aria-hidden="true" />
          Previous
        </Link>
      ) : (
        <span />
      )}
      {nextCursor ? (
        <Link
          className="admin-button admin-button-secondary"
          href={pageHref(pathname, filters, nextCursor, nextTrail)}
        >
          Next
          <ArrowRight aria-hidden="true" />
        </Link>
      ) : null}
    </nav>
  );
}
