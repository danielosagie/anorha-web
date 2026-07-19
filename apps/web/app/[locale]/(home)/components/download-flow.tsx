'use client';

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
import { CheckCircle2, ExternalLink } from 'lucide-react';
import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { QrCode } from './qr-code';

export const IOS_TESTFLIGHT_URL = 'https://testflight.apple.com/join/7QAEgvUj';

// Android switches from invite-only to a direct install without a code change.
export const ANDROID_DIRECT_URL =
  process.env.NEXT_PUBLIC_ANDROID_ACCESS_URL?.trim();

// Evergreen GitHub release links: each release uploads versionless dmg aliases,
// so latest/download always serves the newest desktop build.
export const DESKTOP_ARM64_URL =
  'https://github.com/danielosagie/anorha-tray/releases/latest/download/Anorha-arm64.dmg';
export const DESKTOP_X64_URL =
  'https://github.com/danielosagie/anorha-tray/releases/latest/download/Anorha-x64.dmg';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ANDROID_USER_AGENT_PATTERN = /Android/i;
const IOS_USER_AGENT_PATTERN = /iPhone|iPad|iPod/i;

export type InstallPlatform = 'ios' | 'android';
type Status = 'idle' | 'loading' | 'success' | 'error';

export function AppleIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      height={size}
      viewBox="786.788 483.498 13.026 14.001"
      width={size}
    >
      <path
        d="M794.791 485.722C795.211 485.204 795.511 484.486 795.512 483.767C795.512 483.668 795.504 483.568 795.485 483.484C794.8 483.511 793.984 483.957 793.493 484.55C793.107 485.003 792.747 485.723 792.746 486.45C792.746 486.561 792.763 486.669 792.772 486.702C792.816 486.712 792.886 486.719 792.958 486.721C793.572 486.721 794.345 486.296 794.791 485.722ZM797.96 488.269C797.883 488.335 796.494 489.141 796.494 490.942C796.494 493.024 798.259 493.759 798.311 493.777C798.303 493.823 798.031 494.786 797.382 495.766C796.803 496.631 796.196 497.491 795.277 497.495C794.358 497.499 794.12 496.941 793.055 496.938C792.019 496.938 791.652 497.511 790.81 497.512C789.968 497.513 789.381 496.713 788.701 495.731C787.921 494.575 787.289 492.784 787.289 491.085C787.289 488.358 788.999 486.912 790.683 486.912C791.578 486.912 792.325 487.522 792.888 487.52C793.422 487.52 794.257 486.875 795.274 486.875C795.66 486.875 797.046 486.913 797.96 488.269Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function AndroidIcon({ size = 15 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      height={size * 0.62}
      viewBox="84.502 24.898 14 8.592"
      width={size}
    >
      <path
        d="M95.748 25.011C95.543 25.033 95.36 25.155 95.257 25.341L94.075 27.462C93.279 27.137 92.416 26.959 91.504 26.959C90.597 26.959 89.734 27.135 88.946 27.457L87.767 25.341C87.642 25.116 87.404 24.987 87.155 25.01C86.679 25.054 86.418 25.584 86.653 26.013L87.793 28.058C86.039 29.191 84.789 31.14 84.502 33.49H98.504C98.218 31.137 96.973 29.197 95.227 28.066L96.371 26.012C96.609 25.583 96.338 25.054 95.869 25.01C95.829 25.006 95.788 25.007 95.748 25.011Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function DesktopIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 20 20"
      width={size}
    >
      <rect height="11" rx="2" stroke="currentColor" width="16" x="2" y="2" />
      <path d="M7 17h6M10 13v4" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

export function useDownloadFlow() {
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [mobilePlatform, setMobilePlatform] = useState<InstallPlatform | null>(
    null
  );
  const [qrPlatform, setQrPlatform] = useState<InstallPlatform | null>(null);
  const [showAndroidForm, setShowAndroidForm] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobileViewport(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    const isIpad =
      window.navigator.platform === 'MacIntel' &&
      window.navigator.maxTouchPoints > 1;

    if (ANDROID_USER_AGENT_PATTERN.test(userAgent)) {
      setMobilePlatform('android');
      return;
    }

    if (IOS_USER_AGENT_PATTERN.test(userAgent) || isIpad) {
      setMobilePlatform('ios');
    }
  }, []);

  const openInstall = useCallback(
    (platform: InstallPlatform, url: string) => {
      if (isMobileViewport) {
        window.open(url, '_blank', 'noopener,noreferrer');
        return;
      }
      setQrPlatform(platform);
    },
    [isMobileViewport]
  );

  const openAndroid = useCallback(() => {
    if (ANDROID_DIRECT_URL) {
      openInstall('android', ANDROID_DIRECT_URL);
      return;
    }
    setShowAndroidForm(true);
  }, [openInstall]);

  const submitAndroidInvite = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!EMAIL_PATTERN.test(email) || status === 'loading') {
        return;
      }
      setStatus('loading');
      setMessage('');
      try {
        const response = await fetch('/api/waitlist', {
          body: JSON.stringify({ email }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          setStatus('error');
          setMessage(data?.error || 'Something went wrong. Please try again.');
          return;
        }
        setResultUrl(
          typeof data?.accessUrl === 'string' ? data.accessUrl : null
        );
        setStatus('success');
      } catch {
        setStatus('error');
        setMessage('Network error. Please try again.');
      }
    },
    [email, status]
  );

  return {
    email,
    emailValid: EMAIL_PATTERN.test(email),
    isMobileViewport,
    message,
    mobilePlatform,
    openAndroid,
    openInstall,
    qrPlatform,
    resultUrl,
    setEmail,
    setQrPlatform,
    setShowAndroidForm,
    setStatus,
    showAndroidForm,
    status,
    submitAndroidInvite,
  };
}

export type DownloadFlow = ReturnType<typeof useDownloadFlow>;

export function AndroidInvite({
  className,
  flow,
}: {
  className?: string;
  flow: DownloadFlow;
}) {
  if (!flow.showAndroidForm) {
    return null;
  }

  if (flow.status === 'success') {
    return (
      <div className={cn('download-invite-success', className)}>
        <div>
          <CheckCircle2 aria-hidden="true" size={18} />
          <strong>You&apos;re in.</strong>
        </div>
        {flow.resultUrl ? (
          <>
            <p>Open the install link on your Android phone.</p>
            <Button
              className="download-invite-submit"
              onClick={() =>
                window.open(
                  flow.resultUrl ?? '',
                  '_blank',
                  'noopener,noreferrer'
                )
              }
              type="button"
            >
              Open Google Play
            </Button>
          </>
        ) : (
          <p>Check your inbox for the install link.</p>
        )}
      </div>
    );
  }

  return (
    <form
      className={cn('download-invite-form', className)}
      onSubmit={flow.submitAndroidInvite}
    >
      <p>Android is invite-only. Enter your email for access.</p>
      <div>
        <Input
          aria-label="Email address"
          autoComplete="email"
          className="download-invite-input"
          inputMode="email"
          onChange={(event) => {
            flow.setEmail(event.target.value);
            if (flow.status === 'error') {
              flow.setStatus('idle');
            }
          }}
          placeholder="you@email.com"
          required
          type="email"
          value={flow.email}
        />
        <Button
          className="download-invite-submit"
          disabled={!flow.emailValid || flow.status === 'loading'}
          type="submit"
        >
          {flow.status === 'loading' ? 'Sending...' : 'Get link'}
        </Button>
      </div>
      {flow.status === 'error' ? (
        <p className="download-invite-error" role="alert">
          {flow.message}
        </p>
      ) : null}
    </form>
  );
}

export function DownloadQrDialog({ flow }: { flow: DownloadFlow }) {
  const qrUrl =
    flow.qrPlatform === 'ios' ? IOS_TESTFLIGHT_URL : ANDROID_DIRECT_URL;
  const qrLabel = flow.qrPlatform === 'ios' ? 'iPhone' : 'Android';

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          flow.setQrPlatform(null);
        }
      }}
      open={flow.qrPlatform !== null}
    >
      <DialogContent className="download-qr-dialog sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Install on {qrLabel}</DialogTitle>
          <DialogDescription>
            Scan with your phone camera to install.
          </DialogDescription>
        </DialogHeader>
        {qrUrl ? (
          <div className="download-qr-content">
            <div className="download-qr-code">
              <QrCode size={220} url={qrUrl} />
            </div>
            <a href={qrUrl} rel="noopener noreferrer" target="_blank">
              Open link
              <ExternalLink aria-hidden="true" size={13} />
            </a>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
