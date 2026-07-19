'use client';

import { Card, CardContent } from '@repo/design-system/components/ui/card';
import { Spinner } from '@repo/design-system/components/ui/spinner';
import { useEffect, useState } from 'react';

const CONNECTION_CHANNEL = 'anorha:connections';

type ConnectionCallbackProps = {
  platform?: string;
  status?: string;
  connectionId?: string;
  message?: string;
};

type CallbackMessage = {
  type: 'anorha:connection';
  status: 'success' | 'error';
  platform?: string;
  connectionId?: string;
  jobId?: string;
  message?: string;
};

export function ConnectionCallback({
  platform,
  status,
  connectionId,
  message,
}: ConnectionCallbackProps) {
  const [label, setLabel] = useState('Finishing');

  useEffect(() => {
    let isCancelled = false;

    const finish = async () => {
      const didConnect = status === 'success';
      let jobId: string | undefined;
      let scanMessage: string | undefined;

      if (didConnect && connectionId && platform !== 'facebook') {
        try {
          const response = await fetch(
            `/api/connections/${encodeURIComponent(connectionId)}/start-scan`,
            { method: 'POST' }
          );
          if (response.ok) {
            const data = (await response.json()) as { jobId?: string };
            jobId = data.jobId;
          } else {
            scanMessage = 'Scan did not start.';
          }
        } catch {
          scanMessage = 'Scan did not start.';
        }
      }

      if (isCancelled) {
        return;
      }

      const result: CallbackMessage = {
        type: 'anorha:connection',
        status: didConnect ? 'success' : 'error',
        platform,
        connectionId,
        jobId,
        message: didConnect ? scanMessage : message || 'Connection failed.',
      };

      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(result, window.location.origin);
        setLabel(didConnect ? 'Connected' : 'Failed');
        window.setTimeout(() => window.close(), 250);
        return;
      }

      if (
        window.name.startsWith('anorha-connect-') &&
        'BroadcastChannel' in window
      ) {
        const channel = new BroadcastChannel(CONNECTION_CHANNEL);
        channel.postMessage(result);
        channel.close();
        setLabel(didConnect ? 'Connected' : 'Failed');
        window.setTimeout(() => window.close(), 250);
        window.setTimeout(() => {
          if (!window.closed) {
            window.location.replace('/connections');
          }
        }, 750);
        return;
      }

      const query = new URLSearchParams();
      query.set('status', result.status);
      if (platform) query.set('connection', platform);
      if (connectionId) query.set('connectionId', connectionId);
      if (jobId) query.set('jobId', jobId);
      if (result.message) query.set('message', result.message);
      window.location.replace(`/connections?${query.toString()}`);
    };

    void finish();
    return () => {
      isCancelled = true;
    };
  }, [connectionId, message, platform, status]);

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardContent className="flex min-h-40 flex-col items-center justify-center gap-3 py-8 text-center">
          <Spinner className="size-5" />
          <p className="font-semibold">{label}</p>
        </CardContent>
      </Card>
    </main>
  );
}
