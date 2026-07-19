'use client';

import { useAuth, useOrganization } from '@clerk/nextjs';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@repo/design-system/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/design-system/components/ui/alert-dialog';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Button } from '@repo/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/design-system/components/ui/dialog';
import { Input } from '@repo/design-system/components/ui/input';
import { Progress } from '@repo/design-system/components/ui/progress';
import { Skeleton } from '@repo/design-system/components/ui/skeleton';
import { Spinner } from '@repo/design-system/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/design-system/components/ui/table';
import {
  AlertCircleIcon,
  RefreshCwIcon,
  ScanSearchIcon,
  StoreIcon,
  UnplugIcon,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  getPlatform,
  platforms,
  type PlatformDefinition,
  type PlatformKey,
} from '@/lib/platforms';

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'
).replace(/\/$/, '');
const CONNECTION_CHANNEL = 'anorha:connections';

type Connection = {
  Id: string;
  PlatformType: string;
  DisplayName: string;
  Status?: string | null;
  IsEnabled?: boolean | null;
  CreatedAt?: string | null;
  LastSyncAttemptAt?: string | null;
  LastSyncSuccessAt?: string | null;
};

type ScanProgressResponse = {
  isActive: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  progress: number;
  description: string | null;
  total?: number;
  processed?: number;
};

type ScanState = ScanProgressResponse & {
  jobId: string;
};

type ConnectionMessage = {
  type: 'anorha:connection';
  status: 'success' | 'error';
  platform?: string;
  connectionId?: string;
  jobId?: string;
  message?: string;
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function isConnectionMessage(value: unknown): value is ConnectionMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const message = value as Partial<ConnectionMessage>;
  return (
    message.type === 'anorha:connection' &&
    (message.status === 'success' || message.status === 'error')
  );
}

function formatStatus(connection: Connection): string {
  if (connection.IsEnabled === false) {
    return 'Disabled';
  }

  const status = connection.Status?.toLowerCase() || 'inactive';
  const labels: Record<string, string> = {
    active: 'Active',
    error: 'Error',
    inactive: 'Inactive',
    pending: 'Pending',
    ready_to_sync: 'Ready',
    reconciling: 'Review',
    review: 'Review',
    scanning: 'Scanning',
    syncing: 'Syncing',
  };

  return labels[status] || status.replaceAll('_', ' ');
}

function statusVariant(
  connection: Connection
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (connection.IsEnabled === false) {
    return 'outline';
  }

  const status = connection.Status?.toLowerCase();
  if (status === 'active') {
    return 'default';
  }
  if (status === 'error') {
    return 'destructive';
  }
  if (
    status === 'pending' ||
    status === 'ready_to_sync' ||
    status === 'reconciling' ||
    status === 'review' ||
    status === 'scanning' ||
    status === 'syncing'
  ) {
    return 'secondary';
  }
  return 'outline';
}

function formatLastSync(value?: string | null): string {
  if (!value) {
    return 'Never';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Never' : dateFormatter.format(date);
}

function PlatformLogo({ platform }: { platform?: PlatformDefinition }) {
  return (
    <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-background">
      {platform ? (
        <Image
          src={platform.logo}
          alt=""
          fill
          sizes="40px"
          className="object-contain p-1.5"
        />
      ) : (
        <StoreIcon
          className="size-5 text-muted-foreground"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export function ConnectionsClient() {
  const router = useRouter();
  const { isLoaded: isAuthLoaded, userId } = useAuth();
  const { isLoaded: isOrgLoaded, organization } = useOrganization();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disconnectId, setDisconnectId] = useState<string | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isScanning, setIsScanning] = useState<string | null>(null);
  const [scanStates, setScanStates] = useState<Record<string, ScanState>>({});
  const [shopifyPlatform, setShopifyPlatform] =
    useState<PlatformDefinition | null>(null);
  const [shopDomain, setShopDomain] = useState('');

  const loadConnections = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/connections', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Connections unavailable');
      }

      const data: unknown = await response.json();
      setConnections(Array.isArray(data) ? (data as Connection[]) : []);
    } catch (loadError) {
      console.error('[ConnectionsClient] Load failed:', loadError);
      setError('Connections unavailable.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const trackScan = useCallback((connectionId: string, jobId: string) => {
    setScanStates((current) => ({
      ...current,
      [connectionId]: {
        jobId,
        isActive: true,
        isCompleted: false,
        isFailed: false,
        progress: 0,
        description: 'Starting scan',
      },
    }));
  }, []);

  const handleOAuthResult = useCallback(
    (message: ConnectionMessage) => {
      if (message.status === 'error') {
        toast.error(message.message || 'Connection failed.');
        return;
      }

      toast.success('Platform connected.');
      if (message.connectionId && message.jobId) {
        trackScan(message.connectionId, message.jobId);
      }
      void loadConnections();
    },
    [loadConnections, trackScan]
  );

  useEffect(() => {
    void loadConnections();
  }, [loadConnections]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const status = query.get('status');
    if (status !== 'success' && status !== 'error') {
      return;
    }

    handleOAuthResult({
      type: 'anorha:connection',
      status,
      platform: query.get('connection') || undefined,
      connectionId: query.get('connectionId') || undefined,
      jobId: query.get('jobId') || undefined,
      message: query.get('message') || undefined,
    });
    router.replace('/connections');
  }, [handleOAuthResult, router]);

  useEffect(() => {
    const receiveOAuthResult = (event: MessageEvent<unknown>) => {
      if (
        event.origin !== window.location.origin ||
        !isConnectionMessage(event.data)
      ) {
        return;
      }
      handleOAuthResult(event.data);
    };

    window.addEventListener('message', receiveOAuthResult);
    return () => window.removeEventListener('message', receiveOAuthResult);
  }, [handleOAuthResult]);

  useEffect(() => {
    if (!('BroadcastChannel' in window)) {
      return;
    }

    const channel = new BroadcastChannel(CONNECTION_CHANNEL);
    channel.onmessage = (event: MessageEvent<unknown>) => {
      if (isConnectionMessage(event.data)) {
        handleOAuthResult(event.data);
      }
    };
    return () => channel.close();
  }, [handleOAuthResult]);

  const activeJobSignature = Object.entries(scanStates)
    .filter(([, scan]) => scan.isActive)
    .map(([connectionId, scan]) => `${connectionId}:${scan.jobId}`)
    .join('|');

  useEffect(() => {
    if (!activeJobSignature) {
      return;
    }

    let isCancelled = false;
    const jobs = activeJobSignature.split('|').map((entry) => {
      const splitAt = entry.indexOf(':');
      return {
        connectionId: entry.slice(0, splitAt),
        jobId: entry.slice(splitAt + 1),
      };
    });

    const poll = async () => {
      const results = await Promise.all(
        jobs.map(async ({ connectionId, jobId }) => {
          try {
            const response = await fetch(
              `/api/connections/jobs/${encodeURIComponent(jobId)}/progress`,
              { cache: 'no-store' }
            );
            if (!response.ok) {
              return null;
            }
            const progress = (await response.json()) as ScanProgressResponse;
            return { connectionId, jobId, progress };
          } catch {
            return null;
          }
        })
      );

      if (isCancelled) {
        return;
      }

      let reachedTerminalState = false;
      setScanStates((current) => {
        const next = { ...current };
        for (const result of results) {
          if (!result || next[result.connectionId]?.jobId !== result.jobId) {
            continue;
          }
          next[result.connectionId] = {
            jobId: result.jobId,
            ...result.progress,
          };
          if (result.progress.isCompleted || result.progress.isFailed) {
            reachedTerminalState = true;
          }
        }
        return next;
      });

      if (reachedTerminalState) {
        void loadConnections();
      }
    };

    void poll();
    const intervalId = window.setInterval(poll, 2500);
    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [activeJobSignature, loadConnections]);

  const openOAuth = (platform: PlatformDefinition, shop?: string) => {
    if (
      !platform.loginPath ||
      !userId ||
      !organization?.id ||
      !isAuthLoaded ||
      !isOrgLoaded
    ) {
      return;
    }

    const finalRedirectUri = `${window.location.origin}/connections/callback`;
    const url = new URL(platform.loginPath, API_BASE);
    url.searchParams.set('userId', userId);
    url.searchParams.set('orgId', organization.id);
    url.searchParams.set('finalRedirectUri', finalRedirectUri);
    for (const [key, value] of Object.entries(platform.extraParams || {})) {
      url.searchParams.set(key, value);
    }
    if (shop) {
      url.searchParams.set('shop', shop);
    }

    const popup = window.open(
      url.toString(),
      `anorha-connect-${platform.key}`,
      'popup=yes,width=640,height=760,menubar=no,toolbar=no,location=yes,resizable=yes,scrollbars=yes'
    );
    if (!popup) {
      window.location.assign(url.toString());
      return;
    }
    popup.focus();
  };

  const connectPlatform = (platform: PlatformDefinition) => {
    if (platform.connectMode === 'shopify-domain') {
      setShopifyPlatform(platform);
      return;
    }
    openOAuth(platform);
  };

  const connectShopify = () => {
    if (!shopifyPlatform || !shopDomain.trim()) {
      return;
    }
    openOAuth(shopifyPlatform, shopDomain.trim());
    setShopifyPlatform(null);
    setShopDomain('');
  };

  const startScan = async (connectionId: string) => {
    try {
      setIsScanning(connectionId);
      const response = await fetch(
        `/api/connections/${encodeURIComponent(connectionId)}/start-scan`,
        { method: 'POST' }
      );
      if (!response.ok) {
        throw new Error('Scan failed');
      }

      const data = (await response.json()) as { jobId?: string };
      if (!data.jobId) {
        throw new Error('Missing job');
      }
      trackScan(connectionId, data.jobId);
      toast.success('Scan started.');
      await loadConnections();
    } catch (scanError) {
      console.error('[ConnectionsClient] Scan failed:', scanError);
      toast.error('Scan failed.');
    } finally {
      setIsScanning(null);
    }
  };

  const disconnect = async () => {
    if (!disconnectId) {
      return;
    }

    try {
      setIsDisconnecting(true);
      const response = await fetch(
        `/api/connections/${encodeURIComponent(disconnectId)}/disconnect`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cleanupStrategy: 'keep' }),
        }
      );
      if (!response.ok) {
        throw new Error('Disconnect failed');
      }

      setDisconnectId(null);
      setScanStates((current) => {
        const next = { ...current };
        delete next[disconnectId];
        return next;
      });
      toast.success('Platform disconnected.');
      await loadConnections();
    } catch (disconnectError) {
      console.error('[ConnectionsClient] Disconnect failed:', disconnectError);
      toast.error('Disconnect failed.');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const connectedKeys = new Set(
    connections
      .map((connection) => getPlatform(connection.PlatformType)?.key)
      .filter((key): key is PlatformKey => Boolean(key))
  );
  const canConnect = Boolean(
    isAuthLoaded && isOrgLoaded && userId && organization?.id
  );

  return (
    <div className="flex max-w-6xl flex-col gap-6">
      {error ? (
        <Alert variant="destructive">
          <AlertCircleIcon aria-hidden="true" />
          <AlertTitle>Load failed</AlertTitle>
          <AlertDescription>
            <Button variant="outline" size="sm" onClick={loadConnections}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <CardTitle>Connected</CardTitle>
            <CardDescription>{connections.length} total</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadConnections}>
            <RefreshCwIcon data-icon="inline-start" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div
              className="flex flex-col gap-3"
              aria-label="Loading connections"
            >
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : connections.length === 0 ? (
            <div className="flex min-h-36 flex-col items-center justify-center gap-2 text-center">
              <StoreIcon
                className="size-7 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="font-semibold">No connections</p>
              <p className="text-muted-foreground text-sm">
                Choose a platform below.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Last sync
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {connections.map((connection) => {
                  const platform = getPlatform(connection.PlatformType);
                  const scan = scanStates[connection.Id];
                  const scanPercent = Math.round((scan?.progress || 0) * 100);
                  const supportsScan = platform?.key !== 'facebook';

                  return (
                    <TableRow key={connection.Id}>
                      <TableCell>
                        <div className="flex min-w-44 items-center gap-3">
                          <PlatformLogo platform={platform} />
                          <div className="min-w-0">
                            <div className="truncate font-semibold">
                              {connection.DisplayName ||
                                platform?.name ||
                                connection.PlatformType}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {platform?.name || connection.PlatformType}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-32 flex-col gap-2">
                          <Badge variant={statusVariant(connection)}>
                            {formatStatus(connection)}
                          </Badge>
                          {scan ? (
                            <div className="flex w-32 flex-col gap-1">
                              <Progress
                                value={scanPercent}
                                aria-label={`Scan progress ${scanPercent}%`}
                              />
                              <span className="truncate text-muted-foreground text-xs">
                                {scan.isFailed
                                  ? 'Scan failed'
                                  : scan.isCompleted
                                    ? 'Scan complete'
                                    : `${scanPercent}%`}
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {formatLastSync(connection.LastSyncSuccessAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {supportsScan ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={
                                isScanning === connection.Id || scan?.isActive
                              }
                              onClick={() => startScan(connection.Id)}
                            >
                              {isScanning === connection.Id ? (
                                <Spinner data-icon="inline-start" />
                              ) : (
                                <ScanSearchIcon data-icon="inline-start" />
                              )}
                              Scan
                            </Button>
                          ) : null}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDisconnectId(connection.Id)}
                          >
                            <UnplugIcon data-icon="inline-start" />
                            Disconnect
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Platforms</CardTitle>
          <CardDescription>Open a secure sign in.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {platforms.map((platform) => (
                <TableRow key={platform.key}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <PlatformLogo platform={platform} />
                      <span className="font-semibold">{platform.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        platform.status === 'ga' ? 'secondary' : 'outline'
                      }
                    >
                      {platform.status === 'ga'
                        ? connectedKeys.has(platform.key)
                          ? 'Connected'
                          : 'Available'
                        : 'Soon'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={platform.status !== 'ga' || !canConnect}
                      onClick={() => connectPlatform(platform)}
                    >
                      Connect
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog
        open={Boolean(disconnectId)}
        onOpenChange={(open) => {
          if (!open && !isDisconnecting) {
            setDisconnectId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect platform?</AlertDialogTitle>
            <AlertDialogDescription>
              Sync stops. Imported products stay.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDisconnecting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDisconnecting}
              onClick={(event) => {
                event.preventDefault();
                void disconnect();
              }}
            >
              {isDisconnecting ? <Spinner data-icon="inline-start" /> : null}
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={Boolean(shopifyPlatform)}
        onOpenChange={(open) => {
          if (!open) {
            setShopifyPlatform(null);
            setShopDomain('');
          }
        }}
      >
        <DialogContent>
          <form
            className="flex flex-col gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              connectShopify();
            }}
          >
            <DialogHeader>
              <DialogTitle>Connect Shopify</DialogTitle>
              <DialogDescription>Enter your store domain.</DialogDescription>
            </DialogHeader>
            <Input
              value={shopDomain}
              onChange={(event) => setShopDomain(event.target.value)}
              placeholder="store.myshopify.com"
              aria-label="Store domain"
              autoComplete="url"
              autoFocus
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShopifyPlatform(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!shopDomain.trim()}>
                Connect
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
