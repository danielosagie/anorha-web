'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

/**
 * Desktop sign-in callback. The Anorha tray opens this page in the system
 * browser (app.anorha.app/desktop-callback?port=&state=). Here — where Clerk is
 * authenticated — we mint a short-lived session token and hand it to the tray's
 * one-shot 127.0.0.1 loopback, which exchanges it for the tray's long-lived
 * device credential. We POST the token (keeps it out of browser history) and
 * fall back to a top-level navigation if the cross-origin POST is blocked.
 */
export default function DesktopCallback() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [msg, setMsg] = useState('Connecting…');

  useEffect(() => {
    if (!isLoaded) return;
    const params = new URLSearchParams(window.location.search);
    const port = params.get('port');
    const state = params.get('state');

    // Only ever talk to a localhost loopback on a digits-only port.
    if (!port || !/^\d+$/.test(port) || !state) {
      setMsg('Invalid sign-in link. Return to Anorha on your computer and try again.');
      return;
    }

    if (!isSignedIn) {
      // Sign in, then come right back to this URL (params preserved).
      const here = `/desktop-callback?port=${port}&state=${encodeURIComponent(state)}`;
      window.location.href = `/sign-in?redirect_url=${encodeURIComponent(here)}`;
      return;
    }

    (async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error('no token');
        const base = `http://127.0.0.1:${port}/callback`;
        try {
          const res = await fetch(base, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, state }),
          });
          if (!res.ok) throw new Error('post rejected');
          setMsg('Computer linked. You can close this tab and return to Anorha.');
        } catch {
          // Navigation fallback (no CORS / mixed-content limits on a top-level nav).
          window.location.href = `${base}?token=${encodeURIComponent(token)}&state=${encodeURIComponent(state)}`;
        }
      } catch {
        setMsg('Sign-in failed. Return to Anorha and try again.');
      }
    })();
  }, [isLoaded, isSignedIn, getToken]);

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
      <p style={{ color: '#52525b', fontSize: 15 }}>{msg}</p>
    </main>
  );
}
