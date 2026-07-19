'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

/**
 * Phone QR pairing target. The Anorha tray shows a QR encoding
 * app.anorha.app/link?code=<pairingCode>. Scanning it with a phone's native
 * camera opens THIS page (the in-app scanner reads the code directly and never
 * loads a URL, so this is the fallback path for camera scans). Here — where
 * Clerk is authenticated — we POST the pairing code to the backend, which
 * links the pending device to this signed-in account.
 *
 * The claim endpoint (POST /api/devices/claim-pairing) is behind the backend's
 * auth guard; a raw Clerk session token is accepted (guard PATH 3), so we send
 * `Authorization: Bearer <clerk token>` exactly like every other authed call in
 * this app. No device secret is ever exposed to the web — it stays on the
 * desktop; only the short-lived pairing code travels through here.
 */
type Phase = 'checking' | 'linking' | 'done' | 'error' | 'nocode';

export default function LinkComputer() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [phase, setPhase] = useState<Phase>('checking');
  const [computerName, setComputerName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!isLoaded) return;
    const code = new URLSearchParams(window.location.search).get('code')?.trim();

    if (!code) {
      setPhase('nocode');
      return;
    }
    if (!isSignedIn) {
      // Sign in, then return here with the code preserved.
      const here = `/link?code=${encodeURIComponent(code)}`;
      window.location.href = `/sign-in?redirect_url=${encodeURIComponent(here)}`;
      return;
    }

    (async () => {
      setPhase('linking');
      try {
        const authToken = await getToken();
        if (!authToken) throw new Error('Not signed in.');
        let apiBase = (process.env.NEXT_PUBLIC_API_URL || 'https://api.sssync.app/api').replace(/\/$/, '');
        if (!apiBase.endsWith('/api')) apiBase = `${apiBase}/api`;

        const res = await fetch(`${apiBase}/devices/claim-pairing`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ pairingCode: code }),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(text || 'That code didn’t work. Generate a fresh one on your computer.');
        }
        const data = (await res.json().catch(() => ({}))) as { name?: string };
        setComputerName(data?.name || '');
        setPhase('done');
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : String(e));
        setPhase('error');
      }
    })();
  }, [isLoaded, isSignedIn, getToken]);

  const title =
    phase === 'done'
      ? 'Computer linked'
      : phase === 'error'
        ? 'Link failed'
        : phase === 'nocode'
          ? 'Missing code'
          : 'Linking your computer…';

  const body =
    phase === 'done'
      ? computerName
        ? `${computerName} is now linked. It’ll handle your posting in the background — you can close this tab.`
        : 'Your computer is now linked. It’ll handle your posting in the background — you can close this tab.'
      : phase === 'error'
        ? errorMsg
        : phase === 'nocode'
          ? 'This link is missing its pairing code. Open Anorha on your computer and scan the QR again.'
          : 'Hang tight — connecting this computer to your account.';

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
        <p style={{ fontSize: 18, fontWeight: 700, color: '#18181B', margin: '0 0 8px' }}>{title}</p>
        <p style={{ color: '#52525b', fontSize: 15, lineHeight: '22px', margin: 0 }}>{body}</p>
      </div>
    </main>
  );
}
