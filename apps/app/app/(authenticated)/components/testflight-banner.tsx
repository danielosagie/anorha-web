'use client';

import { env } from '@/env';
import { Button } from '@repo/design-system/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/design-system/components/ui/dialog';
import { Check, Copy, ExternalLink, Mail, Smartphone } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// Configuration - defaults provided if env vars are missing
const TESTFLIGHT_URL =
  env.NEXT_PUBLIC_TESTFLIGHT_URL ||
  'https://testflight.apple.com/v1/app/6755371742?build=192233562';
const INVITE_CODE = env.NEXT_PUBLIC_TESTFLIGHT_INVITE_CODE || '';

// Brand colors (matching sidebar active state)
const BRAND_GREEN = '#93C822';
const BRAND_GREEN_LIGHT = 'rgba(147, 200, 34, 0.12)';

// Simple QR Code component using Canvas API with qr-code-generator pattern
function QRCode({ url, size = 200 }: { url: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use a reliable external QR code image as fallback
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
      }
    };
    img.onerror = () => setError(true);
    // Using goqr.me API which is more reliable
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&format=png&margin=10`;
  }, [url, size]);

  if (error) {
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-gray-100"
        style={{ width: size, height: size }}
      >
        <span className="px-4 text-center text-gray-500 text-sm">
          QR Code unavailable.
          <br />
          <a href={url} className="text-[#5c9c00] underline">
            Click here
          </a>
        </span>
      </div>
    );
  }

  return (
    <canvas ref={canvasRef} width={size} height={size} className="rounded-lg" />
  );
}

export function TestFlightBanner({
  mode = 'banner',
}: { mode?: 'banner' | 'card' }) {
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsMobile(
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
    );
    setIsIOS(/iPhone|iPad|iPod/i.test(ua));
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(INVITE_CODE || TESTFLIGHT_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (mode === 'card') {
    return (
      <div className="fade-in zoom-in-95 flex animate-in flex-col items-center space-y-6 rounded-2xl border border-gray-100 bg-white p-8 text-center duration-500">
        <div
          className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm"
          style={{ backgroundColor: BRAND_GREEN_LIGHT }}
        >
          <Smartphone className="size-8 text-accent-foreground" />
        </div>

        <div className="space-y-2">
          <h3 className="font-bold text-gray-900 text-xl">
            Get the Mobile App
          </h3>
          <p className="mx-auto max-w-xs text-gray-500">
            {isMobile
              ? isIOS
                ? 'Tap below to install via TestFlight.'
                : 'The app is currently available for iOS. Android coming soon!'
              : 'Scan this code with your iPhone camera to install the app via TestFlight.'}
          </p>
        </div>

        {/* Show QR code on desktop, direct button on mobile */}
        {isMobile ? (
          isIOS ? (
            <Button className="h-14 w-full max-w-xs text-base" asChild>
              <a href={TESTFLIGHT_URL}>
                <span className="text-2xl"></span>
                Open in TestFlight
              </a>
            </Button>
          ) : (
            <div className="w-full max-w-xs rounded-xl border border-gray-100 bg-gray-50 p-6 text-center">
              <p className="flex items-center justify-center gap-2 text-gray-600 text-sm">
                <Mail className="h-4 w-4" /> Want to be notified when Android is
                available?
              </p>
              <p className="mt-2 text-gray-400 text-xs">
                Contact us at admin@anorha.app
              </p>
            </div>
          )
        ) : (
          <div className="inline-block rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <QRCode url={TESTFLIGHT_URL} size={200} />
          </div>
        )}

        <div className="w-full max-w-xs space-y-4">
          {INVITE_CODE && (
            <div className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
              <span className="font-semibold text-gray-500 text-xs uppercase tracking-wider">
                Invite Code
              </span>
              <div className="flex items-center gap-2">
                <code className="rounded border bg-white px-2 py-1 font-mono text-gray-900 text-sm">
                  {INVITE_CODE}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopy}
                  className="h-6 w-6 text-gray-400 hover:text-green-600"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {!isMobile && (
            <Button variant="outline" className="w-full gap-2" asChild>
              <a
                href={TESTFLIGHT_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open TestFlight Link
                <span className="text-xs opacity-50">
                  <ExternalLink className="ml-1 inline h-3 w-3" />
                </span>
              </a>
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Default 'banner' mode
  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-[1.125rem] border border-primary/20 bg-card p-5 sm:flex-row sm:items-center md:p-6">
      <div className="flex items-center gap-4">
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: BRAND_GREEN_LIGHT }}
        >
          <Smartphone className="size-5 text-accent-foreground" />
        </div>
        <div>
          <h3 className="font-bold text-base">Keep Anorha in your pocket</h3>
          <p className="mt-0.5 font-medium text-muted-foreground text-sm">
            Photograph products and plan campaigns from the mobile app.
          </p>
        </div>
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button className="h-11 px-5">Show QR Code</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Download Mobile App</DialogTitle>
            <DialogDescription>
              Scan this QR code with your iPhone to install via TestFlight.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center space-y-6 p-4">
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <QRCode url={TESTFLIGHT_URL} size={250} />
            </div>

            {INVITE_CODE && (
              <div className="flex w-full items-center justify-between gap-2 rounded-lg bg-gray-50 p-3">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">Invite code:</span>
                  <code className="rounded border bg-white px-2 py-1 font-mono text-gray-900 text-sm">
                    {INVITE_CODE}
                  </code>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 text-gray-500"
                  style={{ color: copied ? BRAND_GREEN : undefined }}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            )}

            <div className="text-center">
              <a
                href={TESTFLIGHT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 font-medium text-sm hover:underline"
                style={{ color: BRAND_GREEN }}
              >
                Open TestFlight Link Directly{' '}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
