'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Card, CardContent } from '@repo/design-system/components/ui/card';
import { Button } from '@repo/design-system/components/ui/button';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Loader2, Check, Plus, X, Sparkles } from 'lucide-react';

// Mirror of the backend ResolveResult / SyncItem (sync-resolver/sync-item.ts).
interface CanonicalRef {
  id: string;
  title?: string | null;
  sku?: string | null;
}
interface SyncItem {
  platformId: string;
  sku?: string | null;
  barcode?: string | null;
  title?: string | null;
  price?: number | null;
  imageUrl?: string | null;
  attention?: string;
  reason?: string | null;
  candidates?: CanonicalRef[];
  groupId?: string | null;
  groupTitle?: string | null;
}
// NOTE (rows-backed GET /resolution): autoLink/autoCreate arrive as EMPTY
// arrays — the real counts live only in `summary`. Never read those arrays.
interface ResolveResult {
  autoLink: unknown[];
  autoCreate: unknown[];
  needsAttention: SyncItem[];
  summary: {
    total: number;
    autoLinked: number;
    autoCreated: number;
    needsAttention: number;
    skipped: number;
    pushSide?: number;
    clean: boolean;
    byReason?: Record<string, number>;
  };
}

const REASON_LABEL: Record<string, string> = {
  multiple_candidates: 'Multiple possible matches',
  weak_match: 'Weak match',
  look_alike_group: 'Look-alike group',
  duplicate_target: 'Possible duplicate',
  field_conflict: 'Conflicting details',
  bundle: 'Bundle',
  stale_link: 'Stale link',
};

/**
 * The async inbox (SYNC_REBUILD stage 3). Renders the connection's
 * `needsAttention` items as a dismissible list — Link / New / Ignore per card.
 * It NEVER blocks: sync already started on connect; this only resolves the rare
 * ambiguous item. Auto-linked/auto-created counts are shown for reassurance.
 */
export function SyncInbox({ connectionId }: { connectionId: string }) {
  const { getToken } = useAuth();
  const [result, setResult] = useState<ResolveResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);
  // Resolve-action failures surface as a non-destructive banner — they must NOT
  // reuse `error` (which owns the before-first-result failure screen).
  const [actionError, setActionError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('No auth token');
      const res = await fetch(`/api/connections/${connectionId}/resolution`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`Failed to load inbox: ${res.status}`);
      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inbox');
    } finally {
      setLoading(false);
    }
  }, [connectionId, getToken]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // A freshly-connected scan is still populating when the inbox first mounts
  // (auto-pilot partial-commits mean the connection can already be 'active'
  // with attention items still landing). Poll a bounded number of times
  // (≈60s at 3s cadence) until the scan has produced anything, then stop —
  // matches the expo inbox. Paused while a resolve is in flight; the counter
  // resets only when the connection changes.
  const pollCountRef = useRef(0);
  useEffect(() => {
    pollCountRef.current = 0;
  }, [connectionId]);
  useEffect(() => {
    if ((result?.summary?.total ?? 0) > 0) return; // scan produced data → done
    if (resolving !== null) return; // don't fight an in-flight resolve
    if (pollCountRef.current >= 20) return; // cap reached → manual refresh only
    const id = setTimeout(() => {
      pollCountRef.current += 1;
      refresh();
    }, 3000);
    return () => clearTimeout(id);
  }, [result, resolving, refresh]);

  // Apply one decision. The row is removed only AFTER the server confirms
  // (expo semantics) — a failed resolve can never hide an item the server
  // still considers unresolved. Success also updates the summary counts
  // locally, so nothing above this component needs a full refetch.
  const resolve = async (platformId: string, choice: 'link' | 'create' | 'ignore', canonicalId?: string) => {
    setResolving(platformId);
    setActionError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('No auth token');
      const res = await fetch(`/api/connections/${connectionId}/resolve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ platformId, choice, canonicalId }),
      });
      if (res.status === 409) {
        // Stale Version — another client resolved this row first (CAS loser).
        // Refetch the true state; if their decision stuck, the row is gone.
        await refresh();
        return;
      }
      if (!res.ok) throw new Error(`Resolve failed: ${res.status}`);
      // 200 — includes the idempotent { alreadyResolved: true } re-send; both
      // drop the row quietly and bump the matching summary bucket.
      setResult((prev) => {
        if (!prev) return prev;
        const remaining = prev.needsAttention.filter((i) => i.platformId !== platformId);
        if (remaining.length === prev.needsAttention.length) return prev;
        return {
          ...prev,
          needsAttention: remaining,
          summary: {
            ...prev.summary,
            needsAttention: remaining.length,
            autoLinked: prev.summary.autoLinked + (choice === 'link' ? 1 : 0),
            autoCreated: prev.summary.autoCreated + (choice === 'create' ? 1 : 0),
            skipped: prev.summary.skipped + (choice === 'ignore' ? 1 : 0),
            clean: remaining.length === 0,
          },
        };
      });
    } catch (err) {
      await refresh(); // reconcile with the true server state (keeps the list visible)
      setActionError(err instanceof Error ? err.message : 'Failed to resolve');
    } finally {
      setResolving(null);
    }
  };

  // Full-screen states only before the FIRST result lands — background polls
  // and rollback refreshes must not blank the list (matches expo).
  if (loading && !result) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading inbox…
      </div>
    );
  }
  if (error && !result) {
    return <p className="py-3 text-sm text-red-600">{error}</p>;
  }
  if (!result) return null;

  const { needsAttention, summary } = result;

  return (
    <div className="space-y-3">
      {actionError && (
        <p className="text-sm text-red-600" role="alert">
          {actionError} — try again.
        </p>
      )}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="w-3.5 h-3.5" />
        <span>
          {summary.autoLinked} linked · {summary.autoCreated} created automatically
        </span>
      </div>

      {needsAttention.length === 0 ? (
        <p className="text-sm text-muted-foreground">All set — everything is syncing.</p>
      ) : (
        <div className="space-y-2">
          {needsAttention.map((item) => {
            const candidates = item.candidates ?? [];
            // Only one resolve is in flight at a time and failures roll back
            // with a full refresh — disable EVERY row's actions while any
            // resolve is pending (matches expo) so overlapping clicks can't
            // race the local state.
            const busy = resolving !== null;
            return (
              <Card key={item.platformId} className="border-amber-200 bg-amber-50/40">
                <CardContent className="py-3">
                  <div className="flex items-center gap-3">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title || item.sku || item.platformId}</p>
                      <Badge variant="secondary" className="mt-1 bg-amber-100 text-amber-800">
                        {REASON_LABEL[item.attention || ''] || item.attention || 'Needs a look'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {candidates.length === 1 && (
                        <Button
                          size="sm"
                          variant="default"
                          disabled={busy}
                          onClick={() => resolve(item.platformId, 'link', candidates[0].id)}
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> Link
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => resolve(item.platformId, 'create')}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> New
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => resolve(item.platformId, 'ignore')}
                        aria-label="Ignore"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  {/* Multiple candidates: the user picks WHICH one to link —
                      each gets its own Link action (never auto-pick the first). */}
                  {candidates.length > 1 && (
                    <div className="mt-2 space-y-1 border-t border-amber-100 pt-2">
                      {candidates.map((c) => (
                        <div key={c.id} className="flex items-center gap-2">
                          <p className="flex-1 min-w-0 text-xs truncate">{c.title || c.sku || c.id}</p>
                          {c.title && c.sku && (
                            <span className="text-xs text-muted-foreground flex-shrink-0">{c.sku}</span>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-shrink-0"
                            disabled={busy}
                            onClick={() => resolve(item.platformId, 'link', c.id)}
                          >
                            <Check className="w-3.5 h-3.5 mr-1" /> Link
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
