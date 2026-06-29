'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Button } from '@repo/design-system/components/ui/button';
import { Badge } from '@repo/design-system/components/ui/badge';

type BridgeStatus = {
  port: number;
  deviceId: string;
  pairCode: string;
  paired: boolean;
  connectedExtensions: number;
  lastSeenAt?: number | null;
};

export function ExtensionBridgeCard() {
  const [status, setStatus] = React.useState<BridgeStatus | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refreshStatus = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // @ts-ignore
      if (typeof window === 'undefined' || !window.ipcRenderer) {
        setError('Bridge is only available in the desktop app.');
        return;
      }
      // @ts-ignore
      const result = await window.ipcRenderer.invoke('extension-bridge-status');
      setStatus(result);
    } catch (err) {
      console.error('Failed to load bridge status', err);
      setError('Unable to reach the local bridge.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const rotateCode = async () => {
    try {
      setIsLoading(true);
      // @ts-ignore
      const result = await window.ipcRenderer.invoke('extension-bridge-rotate-code');
      setStatus(result);
    } catch (err) {
      console.error('Failed to rotate code', err);
      setError('Unable to rotate the pairing code.');
    } finally {
      setIsLoading(false);
    }
  };

  const unpair = async () => {
    try {
      setIsLoading(true);
      // @ts-ignore
      const result = await window.ipcRenderer.invoke('extension-bridge-unpair');
      setStatus(result);
    } catch (err) {
      console.error('Failed to unpair', err);
      setError('Unable to unpair extension.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = async () => {
    if (!status?.pairCode) return;
    try {
      await navigator.clipboard.writeText(status.pairCode);
    } catch (err) {
      console.warn('Failed to copy pairing code', err);
    }
  };

  const openInstall = async () => {
    try {
      // @ts-ignore
      const result = await window.ipcRenderer.invoke('open-extension-install');
      if (!result?.success) {
        setError(result?.error || 'Unable to open extension install.');
      }
    } catch (err) {
      console.error('Failed to open install', err);
      setError('Unable to open extension install.');
    }
  };

  React.useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const isConnected = (status?.connectedExtensions || 0) > 0;

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Browser Extension Bridge</CardTitle>
            <CardDescription>Pair the Anorha browser extension with this device.</CardDescription>
          </div>
          <Badge className={isConnected ? 'bg-[#93C822] text-white' : 'bg-gray-100 text-gray-700'}>
            {isConnected ? 'Connected' : 'Waiting'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="grid gap-3">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs uppercase tracking-wide text-gray-500">Pairing Code</div>
              <div className="mt-2 flex items-center justify-between">
                <div className="text-2xl font-mono font-semibold">{status?.pairCode || '—'}</div>
                <Button variant="outline" size="sm" onClick={copyCode} disabled={!status?.pairCode}>
                  Copy
                </Button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Open the extension popup and enter this code to pair.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="text-xs uppercase tracking-wide text-gray-500">Device ID</div>
                <div className="mt-1 font-mono text-xs break-all">{status?.deviceId || '—'}</div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="text-xs uppercase tracking-wide text-gray-500">Bridge Port</div>
                <div className="mt-1 font-mono text-xs">{status?.port ?? '—'}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={refreshStatus} disabled={isLoading}>
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button variant="outline" onClick={openInstall} disabled={isLoading}>
                Install Extension
              </Button>
              <Button variant="outline" onClick={rotateCode} disabled={isLoading}>
                Rotate Code
              </Button>
              <Button variant="outline" onClick={unpair} disabled={isLoading}>
                Unpair
              </Button>
            </div>

            <div className="text-xs text-gray-500">
              {status?.paired
                ? `Paired extensions: ${status.connectedExtensions}`
                : 'Not paired yet. Install the extension and it will auto-pair.'}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
