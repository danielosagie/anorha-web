'use client';

import {
  Cable,
  Check,
  CircleAlert,
  LoaderCircle,
  Puzzle,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './connect-extension.module.css';

type PairingState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'extension-not-installed'
  | 'failed';

type ChromeRuntime = {
  lastError?: {
    message?: string;
  };
  sendMessage: (
    extensionId: string,
    message: { grant: string; type: 'ANORHA_PAIR_GRANT' },
    callback: (response?: unknown) => void
  ) => void;
};

type PairingResponse = {
  ok: boolean;
};

type ConnectExtensionClientProps = {
  autoConnect: boolean;
  extensionId?: string;
  storeUrl: string;
};

const stateCopy: Record<
  PairingState,
  { description: string; eyebrow: string; title: string }
> = {
  idle: {
    description: 'Keep Anorha Tray open while the extension connects.',
    eyebrow: 'Browser extension',
    title: 'Connect Anorha',
  },
  connecting: {
    description: 'Keep Anorha Tray open. This usually takes a few seconds.',
    eyebrow: 'Browser extension',
    title: 'Connecting',
  },
  connected: {
    description: 'You can close this tab and return to Anorha.',
    eyebrow: 'Ready',
    title: 'Extension connected',
  },
  'extension-not-installed': {
    description: 'Install the Anorha extension, then return here to connect.',
    eyebrow: 'Not installed',
    title: 'Extension not found',
  },
  failed: {
    description: 'Keep Anorha Tray open, then try again.',
    eyebrow: 'Connection failed',
    title: "Couldn't connect",
  },
};

function getChromeRuntime(): ChromeRuntime | undefined {
  const browserWindow = window as Window & {
    chrome?: {
      runtime?: ChromeRuntime;
    };
  };

  return browserWindow.chrome?.runtime;
}

function isPairingResponse(value: unknown): value is PairingResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'ok' in value &&
    typeof value.ok === 'boolean'
  );
}

function sendGrant(
  runtime: ChromeRuntime,
  extensionId: string,
  grant: string
): Promise<PairingState> {
  return new Promise((resolve) => {
    let settled = false;

    const finish = (state: PairingState) => {
      if (settled) {
        return;
      }

      settled = true;
      window.clearTimeout(timeoutId);
      resolve(state);
    };

    const timeoutId = window.setTimeout(() => finish('failed'), 15_000);

    try {
      runtime.sendMessage(
        extensionId,
        { grant, type: 'ANORHA_PAIR_GRANT' },
        (response) => {
          // Reading lastError inside the callback prevents Chrome from logging
          // an uncaught runtime error when the extension is not installed.
          if (runtime.lastError) {
            finish('extension-not-installed');
            return;
          }

          if (!isPairingResponse(response)) {
            finish('failed');
            return;
          }

          finish(response.ok ? 'connected' : 'failed');
        }
      );
    } catch {
      finish('extension-not-installed');
    }
  });
}

export function ConnectExtensionClient({
  autoConnect,
  extensionId,
  storeUrl,
}: ConnectExtensionClientProps) {
  const [pairingState, setPairingState] = useState<PairingState>(
    autoConnect ? 'connecting' : 'idle'
  );
  const autoStarted = useRef(false);
  const requestId = useRef(0);

  const connect = useCallback(async () => {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;

    if (!extensionId) {
      setPairingState('failed');
      return;
    }

    const runtime = getChromeRuntime();

    if (!runtime) {
      setPairingState('extension-not-installed');
      return;
    }

    setPairingState('connecting');

    try {
      const response = await fetch('/api/browser-pairing/grant', {
        cache: 'no-store',
        method: 'POST',
      });

      if (!response.ok) {
        setPairingState('failed');
        return;
      }

      const data: unknown = await response.json();

      if (
        typeof data !== 'object' ||
        data === null ||
        !('grant' in data) ||
        typeof data.grant !== 'string'
      ) {
        setPairingState('failed');
        return;
      }

      const nextState = await sendGrant(runtime, extensionId, data.grant);

      if (requestId.current === currentRequest) {
        setPairingState(nextState);
      }
    } catch {
      if (requestId.current === currentRequest) {
        setPairingState('failed');
      }
    }
  }, [extensionId]);

  useEffect(() => {
    if (!autoConnect || autoStarted.current) {
      return;
    }

    autoStarted.current = true;
    void connect();
  }, [autoConnect, connect]);

  const copy = stateCopy[pairingState];
  const isConnected = pairingState === 'connected';

  return (
    <div className={`${styles.page} connect-extension-page`}>
      <section
        aria-busy={pairingState === 'connecting'}
        aria-labelledby="connect-extension-title"
        className={styles.panel}
      >
        <div
          aria-hidden="true"
          className={`${styles.icon}${isConnected ? ` ${styles.iconConnected}` : ''}`}
        >
          {pairingState === 'connecting' ? (
            <LoaderCircle className={styles.spinner} size={25} strokeWidth={2} />
          ) : null}
          {pairingState === 'connected' ? (
            <Check size={26} strokeWidth={2.2} />
          ) : null}
          {pairingState === 'extension-not-installed' ? (
            <Puzzle size={25} strokeWidth={2} />
          ) : null}
          {pairingState === 'failed' ? (
            <CircleAlert size={25} strokeWidth={2} />
          ) : null}
          {pairingState === 'idle' ? (
            <Cable size={25} strokeWidth={2} />
          ) : null}
        </div>

        <div aria-live="polite">
          <p className={styles.eyebrow}>{copy.eyebrow}</p>
          <h1 className={styles.title} id="connect-extension-title">
            {copy.title}
          </h1>
          <p className={styles.description}>{copy.description}</p>
        </div>

        {pairingState === 'idle' ? (
          <button className={styles.action} onClick={connect} type="button">
            Connect
          </button>
        ) : null}

        {pairingState === 'connecting' ? (
          <button className={styles.action} disabled type="button">
            <LoaderCircle
              aria-hidden="true"
              className={styles.spinner}
              size={17}
            />
            Connecting
          </button>
        ) : null}

        {pairingState === 'extension-not-installed' ? (
          <a
            className={styles.action}
            href={storeUrl}
            rel="noreferrer"
            target="_blank"
          >
            Install
          </a>
        ) : null}

        {pairingState === 'failed' ? (
          <button className={styles.action} onClick={connect} type="button">
            Retry
          </button>
        ) : null}
      </section>
    </div>
  );
}
