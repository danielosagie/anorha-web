"use client";

import { Button } from '@repo/design-system/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/design-system/components/ui/dialog';
import { Input } from '@repo/design-system/components/ui/input';
import { cn } from '@repo/design-system/lib/utils';
import { CheckCircle2, ExternalLink, Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { QrCode } from './qr-code';

type WaitlistProps = {
  className?: string;
};

const IOS_TESTFLIGHT_URL = 'https://testflight.apple.com/join/7QAEgvUj';

// When Play open testing is live, set NEXT_PUBLIC_ANDROID_ACCESS_URL to the public
// opt-in link. Android then behaves exactly like iOS (tap on mobile / QR on desktop)
// and the email form is skipped — no code change needed to flip over.
const ANDROID_DIRECT_URL = process.env.NEXT_PUBLIC_ANDROID_ACCESS_URL?.trim();

type Platform = 'ios' | 'android';
type Status = 'idle' | 'loading' | 'success' | 'error';

export function Waitlist({ className }: WaitlistProps) {
  // Device detection — on a phone we deep-link straight to install; on desktop we
  // show a QR to scan (you can't tap-install on the machine you're browsing from).
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsMobile(
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
      );
    }
  }, []);

  // QR dialog (desktop)
  const [qrPlatform, setQrPlatform] = useState<Platform | null>(null);

  // Android email-invite flow (used until the public opt-in link exists)
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // On mobile → open the install link directly. On desktop → pop the QR dialog.
  const openInstall = (platform: Platform, url: string) => {
    if (isMobile) {
      window.open(url, '_blank');
      return;
    }
    setQrPlatform(platform);
  };

  const onAndroidClick = () => {
    if (ANDROID_DIRECT_URL) {
      openInstall('android', ANDROID_DIRECT_URL);
      return;
    }
    setShowForm(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid || status === 'loading') return;
    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus('error');
        setMessage(data?.error || 'Something went wrong. Please try again.');
        return;
      }
      setResultUrl(typeof data?.accessUrl === 'string' ? data.accessUrl : null);
      setStatus('success');
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  const qrUrl = qrPlatform === 'ios' ? IOS_TESTFLIGHT_URL : ANDROID_DIRECT_URL;
  const qrLabel = qrPlatform === 'ios' ? 'TestFlight (iOS)' : 'Google Play';

  return (
    <div
      className={cn('w-full rounded-xl border-white bg-background p-4', className)}
      style={{ backgroundColor: '#FFFBF1B2' }}
    >
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-black font-medium">We are in private beta</p>
          <p className="text-gray-700 text-xs mt-1">
            Download the app to get started.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => openInstall('ios', IOS_TESTFLIGHT_URL)}
            className="flex-1 flex items-center justify-center gap-2 h-12"
            style={{
              backgroundColor: '#647653',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.6)',
            }}
          >
            <Smartphone size={18} />
            <span>TestFlight (iOS)</span>
          </Button>
          <Button
            onClick={onAndroidClick}
            aria-expanded={showForm}
            className="flex-1 flex items-center justify-center gap-2 h-12"
            style={{
              backgroundColor: '#A7CE38',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.6)',
            }}
          >
            <Smartphone size={18} />
            <span>Google Play</span>
          </Button>
        </div>

        {!isMobile && (
          <p className="text-gray-600 text-xs -mt-1">
            On your computer? Tap a store to show a QR code for your phone.
          </p>
        )}

        {showForm && status !== 'success' && (
          <form onSubmit={onSubmit} className="flex flex-col gap-2">
            <p className="text-gray-700 text-xs">
              Android is invite-only for now. Drop your email and we&apos;ll send
              your install link.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                aria-label="Email address"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                className="flex-1 h-11 bg-white text-black"
              />
              <Button
                type="submit"
                disabled={!emailValid || status === 'loading'}
                className="h-11 px-5"
                style={{
                  backgroundColor: '#647653',
                  color: 'white',
                  border: '2px solid rgba(255, 255, 255, 0.6)',
                }}
              >
                {status === 'loading' ? 'Sending…' : 'Get the link'}
              </Button>
            </div>
            {status === 'error' && (
              <p className="text-red-600 text-xs" role="alert">
                {message}
              </p>
            )}
          </form>
        )}

        {status === 'success' && (
          <div className="flex flex-col gap-2 rounded-lg bg-white/70 p-3">
            <div className="flex items-center gap-2 text-black">
              <CheckCircle2 size={18} style={{ color: '#647653' }} />
              <p className="text-sm font-medium">You&apos;re in.</p>
            </div>
            {resultUrl ? (
              <>
                <p className="text-gray-700 text-xs">
                  Tap below on your Android phone to install — we also emailed you
                  the link.
                </p>
                <Button
                  onClick={() => window.open(resultUrl, '_blank')}
                  className="h-11 px-5 w-full sm:w-auto"
                  style={{
                    backgroundColor: '#A7CE38',
                    color: 'white',
                    border: '2px solid rgba(255, 255, 255, 0.6)',
                  }}
                >
                  Open Google Play
                </Button>
              </>
            ) : (
              <p className="text-gray-700 text-xs">
                Check your inbox — your Android install link is on the way.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Desktop QR dialog — scan to install on your phone, or click the link. */}
      <Dialog
        open={qrPlatform !== null}
        onOpenChange={(open) => {
          if (!open) setQrPlatform(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Install {qrLabel}</DialogTitle>
            <DialogDescription>
              Scan with your phone&apos;s camera to install the app.
            </DialogDescription>
          </DialogHeader>
          {qrUrl && (
            <div className="flex flex-col items-center gap-4 p-2">
              <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                <QrCode url={qrUrl} size={220} />
              </div>
              <a
                href={qrUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm font-medium hover:underline"
                style={{ color: '#647653' }}
              >
                Or open the link on this device
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
