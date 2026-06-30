'use client';

import { useCallback, useEffect, useState } from 'react';
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
  recommended?: string | null;
  groupId?: string | null;
  groupTitle?: string | null;
}
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
export function SyncInbox({ connectionId, onChanged }: { connectionId: string; onChanged?: () => void }) {
  const { getToken } = useAuth();
  const [result, setResult] = useState<ResolveResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);

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

  const resolve = async (platformId: string, choice: 'link' | 'create' | 'ignore', canonicalId?: string) => {
    setResolving(platformId);
    // Optimistic removal — the item drops immediately; we refetch on failure.
    setResult((prev) =>
      prev ? { ...prev, needsAttention: prev.needsAttention.filter((i) => i.platformId !== platformId) } : prev,
    );
    try {
      const token = await getToken();
      if (!token) throw new Error('No auth token');
      const res = await fetch(`/api/connections/${connectionId}/resolve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ platformId, choice, canonicalId }),
      });
      // 409 = already resolved → treat as success (item stays removed).
      if (!res.ok && res.status !== 409) throw new Error(`Resolve failed: ${res.status}`);
      onChanged?.();
    } catch (err) {
      await refresh(); // roll back to the true server state
      setError(err instanceof Error ? err.message : 'Failed to resolve');
    } finally {
      setResolving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading inbox…
      </div>
    );
  }
  if (error) {
    return <p className="py-3 text-sm text-red-600">{error}</p>;
  }
  if (!result) return null;

  const { needsAttention, summary } = result;

  return (
    <div className="space-y-3">
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
            const hasCandidates = (item.candidates?.length ?? 0) > 0;
            const linkTarget = item.recommended || item.candidates?.[0]?.id;
            return (
              <Card key={item.platformId} className="border-amber-200 bg-amber-50/40">
                <CardContent className="flex items-center gap-3 py-3">
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
                    {hasCandidates && linkTarget && (
                      <Button
                        size="sm"
                        variant="default"
                        disabled={resolving === item.platformId}
                        onClick={() => resolve(item.platformId, 'link', linkTarget)}
                      >
                        <Check className="w-3.5 h-3.5 mr-1" /> Link
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={resolving === item.platformId}
                      onClick={() => resolve(item.platformId, 'create')}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> New
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={resolving === item.platformId}
                      onClick={() => resolve(item.platformId, 'ignore')}
                      aria-label="Ignore"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
