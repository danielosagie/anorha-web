'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

/**
 * Desktop sign-in callback. The Anorha tray opens this page in the system
 * browser (app.anorha.app/desktop-callback?port=&state=). Here — where Clerk is
 * authenticated — we hand a session token to the tray's one-shot 127.0.0.1
 * loopback, which exchanges it for the tray's long-lived device credential.
 *
 * Two rules hold this together, because the token we hand over is full account
 * access and everything steering the handover comes from the URL:
 *
 * 1. The token is POSTed, never navigated to. The old query-string fallback put
 *    a live bearer token in the URL bar, browser history, and any local logging.
 *    A handover that has to leak the credential to succeed is not a handover
 *    worth keeping, so a blocked POST is now an error the seller retries.
 * 2. The seller confirms before anything is sent. `port` is attacker-supplied,
 *    and any unprivileged process on the machine can bind a loopback port, so
 *    a crafted link would otherwise silently hand the token to whatever is
 *    listening.
 */
export default function DesktopCallback() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [msg, setMsg] = useState('Checking your sign-in link…');
  const [ready, setReady] = useState<{ port: string; state: string } | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    const params = new URLSearchParams(window.location.search);
    const port = params.get('port');
    const state = params.get('state');

    // Only ever talk to a localhost loopback, and only on an unprivileged port.
    const portNum = port && /^\d+$/.test(port) ? Number(port) : Number.NaN;
    if (!state || !Number.isInteger(portNum) || portNum < 1024 || portNum > 65535) {
      setMsg('Invalid sign-in link. Return to Anorha on your computer and try again.');
      return;
    }

    if (!isSignedIn) {
      // Sign in, then come right back to this URL (params preserved).
      const here = `/desktop-callback?port=${portNum}&state=${encodeURIComponent(state)}`;
      window.location.href = `/sign-in?redirect_url=${encodeURIComponent(here)}`;
      return;
    }

    setReady({ port: String(portNum), state });
    setMsg('Only continue if you just asked Anorha on this computer to sign in.');
  }, [isLoaded, isSignedIn]);

  const handover = async () => {
    if (!ready) return;
    setReady(null);
    setMsg('Connecting…');
    try {
      const token = await getToken();
      if (!token) throw new Error('no token');
      const res = await fetch(`http://127.0.0.1:${ready.port}/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, state: ready.state }),
      });
      if (!res.ok) throw new Error('post rejected');
      setMsg('Computer linked. You can close this tab and return to Anorha.');
    } catch {
      setMsg(
        'Could not reach Anorha on this computer. Make sure it is open, then start sign-in again from the app.'
      );
    }
  };

  return (
    <main
      style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textAlign: 'center',
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 340 }}>
        <p style={{ color: '#52525b', fontSize: 15, lineHeight: '22px', margin: 0 }}>{msg}</p>
        {ready && (
          <button
            type="button"
            onClick={handover}
            style={{
              width: '100%',
              marginTop: 20,
              padding: '12px 16px',
              fontSize: 15,
              fontWeight: 600,
              color: '#FFFFFF',
              background: '#18181B',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
            }}
          >
            Sign in to Anorha
          </button>
        )}
      </div>
    </main>
  );
}
