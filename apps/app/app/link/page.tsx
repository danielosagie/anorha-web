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
 *
 * Claiming NEVER happens on page load. A pairing code grants the holder's
 * computer ongoing access to this account, and the code travels in a URL anyone
 * can send. Auto-claiming meant an attacker could generate a code on their own
 * machine, send app.anorha.app/link?code=... to a signed-in seller, and have one
 * click bind their computer to the seller's account. So we show the code and
 * make the seller confirm it matches what their own computer is displaying. A
 * code the seller cannot see on their screen is not their computer.
 */
type Phase = 'checking' | 'confirm' | 'linking' | 'done' | 'error' | 'nocode';

export default function LinkComputer() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [phase, setPhase] = useState<Phase>('checking');
  const [pairingCode, setPairingCode] = useState<string>('');
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

    setPairingCode(code);
    setPhase('confirm');
  }, [isLoaded, isSignedIn]);

  const claim = async () => {
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
        body: JSON.stringify({ pairingCode }),
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
  };

  const title =
    phase === 'done'
      ? 'Computer linked'
      : phase === 'error'
        ? 'Link failed'
        : phase === 'nocode'
          ? 'Missing code'
          : phase === 'confirm'
            ? 'Link this computer?'
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
          : phase === 'confirm'
            ? 'Check that this code matches the one on your computer. If it does not, close this tab.'
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
        <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--k0-ink)', margin: '0 0 8px' }}>{title}</p>
        <p style={{ color: 'var(--k0-ink-2)', fontSize: 15, lineHeight: '22px', margin: 0 }}>{body}</p>
        {phase === 'confirm' && (
          <>
            <p
              style={{
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: 'var(--k0-ink)',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                margin: '20px 0',
              }}
            >
              {pairingCode}
            </p>
            <button
              type="button"
              onClick={claim}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--k0-surface)',
                background: 'var(--k0-ink)',
                border: 'none',
                borderRadius: 10,
                cursor: 'pointer',
              }}
            >
              Link computer
            </button>
          </>
        )}
      </div>
    </main>
  );
}
