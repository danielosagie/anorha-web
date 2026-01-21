'use client';

import { useEffect, useState } from 'react';
import { useOrganization, useAuth } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Button } from '@repo/design-system/components/ui/button';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Checkbox } from '@repo/design-system/components/ui/checkbox';
import { Label } from '@repo/design-system/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@repo/design-system/components/ui/dialog';
import { AlertCircle, Loader2, Plus, Trash2, RefreshCw } from 'lucide-react';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333').replace(/\/$/, '');

interface Connection {
  Id: string;
  PlatformType: string;
  DisplayName: string;
  Status?: string;
  IsEnabled?: boolean;
  CreatedAt?: string;
  LastSyncAttemptAt?: string;
  LastSyncSuccessAt?: string;
}

const PLATFORM_ICONS: Record<string, string> = {
  shopify: '🛍️',
  square: '⬜',
  clover: '🍀',
  amazon: '🔶',
  ebay: '🔴',
  facebook: '📘',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  error: 'bg-red-100 text-red-800',
  syncing: 'bg-blue-100 text-blue-800',
  reconciling: 'bg-yellow-100 text-yellow-800',
};

export default function ConnectionsPage() {
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const { isLoaded: authLoaded, getToken } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Disconnect State
  const [disconnectId, setDisconnectId] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [archiveProducts, setArchiveProducts] = useState(false);

  useEffect(() => {
    if (!orgLoaded || !authLoaded || !organization?.id) return;

    loadConnections();
  }, [orgLoaded, authLoaded, organization?.id]);

  const loadConnections = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      if (!token) throw new Error('No auth token');

      const res = await fetch('/api/connections', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error(`Failed to load connections: ${res.status}`);

      const data = await res.json();
      setConnections(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[ConnectionsPage] Error loading connections:', err);
      setError(err instanceof Error ? err.message : 'Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectClick = (connectionId: string) => {
    setDisconnectId(connectionId);
    setArchiveProducts(false); // Default to unchecked? Or checked? User asked for option.
  };

  const confirmDisconnect = async () => {
    if (!disconnectId) return;

    try {
      setDisconnecting(true);
      const token = await getToken();
      if (!token) throw new Error('No auth token');

      // Call new disconnect endpoint with strategy
      const cleanupStrategy = archiveProducts ? 'soft_delete' : 'keep';

      const res = await fetch(`/api/connections/${disconnectId}/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cleanupStrategy }),
      });

      if (!res.ok) {
        throw new Error(`Disconnect failed: ${res.status}`);
      }

      // Refresh connections list
      await loadConnections();
      setDisconnectId(null);
    } catch (err) {
      console.error('[ConnectionsPage] Error disconnecting:', err);
      // Maybe show a toast error? Or set page error?
      setError('Failed to disconnect platform. Please try again.');
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Connected Platforms</h3>
          <p className="text-sm text-muted-foreground">Manage your platform integrations</p>
        </div>
        <Button onClick={loadConnections} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">{error}</p>
              <p className="text-xs text-red-700 mt-1">Check your connection and try again</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connections Grid */}
      {connections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-4xl mb-3">🔗</div>
            <h4 className="font-semibold text-lg mb-1">No integrations connected yet</h4>
            <p className="text-sm text-muted-foreground mb-6">Connect a platform to start syncing products</p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Connection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {connections.map((conn) => {
            const icon = PLATFORM_ICONS[conn.PlatformType?.toLowerCase()] || '📦';
            const statusColor = STATUS_COLORS[conn.Status?.toLowerCase() || 'inactive'];
            const displayName = conn.DisplayName || conn.PlatformType;

            return (
              <Card key={conn.Id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    {/* Left: Icon + Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="text-3xl">{icon}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-base">{displayName}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {conn.PlatformType?.charAt(0).toUpperCase()}{conn.PlatformType?.slice(1)}
                        </p>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={statusColor} variant="secondary">
                            {conn.Status || 'Inactive'}
                          </Badge>
                          {conn.IsEnabled === false && (
                            <Badge variant="outline" className="bg-gray-50">
                              Disabled
                            </Badge>
                          )}
                        </div>

                        {/* Last Sync Info */}
                        {conn.LastSyncSuccessAt && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Last synced: {new Date(conn.LastSyncSuccessAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="ghost" size="sm">
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDisconnectClick(conn.Id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Connection Button */}
      {connections.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Another Connection
          </Button>
        </div>
      )}

      {/* Disconnect Dialog */}
      <Dialog open={!!disconnectId} onOpenChange={(open) => !open && setDisconnectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Platform</DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect this platform? This will stop inventory sync and updates.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-center space-x-2 border p-4 rounded-md bg-gray-50 border-gray-200">
              <Checkbox
                id="archive-products"
                checked={archiveProducts}
                onCheckedChange={(checked) => setArchiveProducts(checked as boolean)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="archive-products" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Archive imported products?
                </Label>
                <p className="text-xs text-muted-foreground">
                  If checked, products that were imported solely from this platform will be archived (hidden) in Anorha.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDisconnectId(null)} disabled={disconnecting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDisconnect} disabled={disconnecting}>
              {disconnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                'Disconnect'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

