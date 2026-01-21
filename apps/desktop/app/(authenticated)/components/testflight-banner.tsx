'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@repo/design-system/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@repo/design-system/components/ui/dialog';
import { env } from '@/env';
import { Smartphone, Mail, Check, Copy, ExternalLink } from 'lucide-react';

// Configuration - defaults provided if env vars are missing
const TESTFLIGHT_URL = env.NEXT_PUBLIC_TESTFLIGHT_URL || 'https://testflight.apple.com/v1/app/6755371742?build=192233562';
const INVITE_CODE = env.NEXT_PUBLIC_TESTFLIGHT_INVITE_CODE || '';

// Brand colors (matching sidebar active state)
const BRAND_GREEN = '#647653';
const BRAND_GREEN_HOVER = '#647653';
const BRAND_GREEN_LIGHT = 'rgba(100, 118, 83, 0.1)';

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
                className="flex items-center justify-center bg-gray-100 rounded-lg"
                style={{ width: size, height: size }}
            >
                <span className="text-gray-500 text-sm text-center px-4">
                    QR Code unavailable.<br />
                    <a href={url} className="text-[#5c9c00] underline">Click here</a>
                </span>
            </div>
        );
    }

    return (
        <canvas
            ref={canvasRef}
            width={size}
            height={size}
            className="rounded-lg"
        />
    );
}

export function TestFlightBanner({ mode = 'banner' }: { mode?: 'banner' | 'card' }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(INVITE_CODE || TESTFLIGHT_URL);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (mode === 'card') {
        // Detect if user is on iOS or mobile (client-side only)
        const [isMobile, setIsMobile] = useState(false);
        const [isIOS, setIsIOS] = useState(false);

        useEffect(() => {
            if (typeof window !== 'undefined') {
                const ua = navigator.userAgent;
                const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
                const ios = /iPhone|iPad|iPod/i.test(ua);
                setIsMobile(mobile);
                setIsIOS(ios);
            }
        }, []);

        return (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm mb-2"
                    style={{ backgroundColor: BRAND_GREEN_LIGHT }}
                >
                    <Smartphone className="h-8 w-8 text-[#647653]" />
                </div>

                <div className="space-y-2">
                    <h3 className="font-bold text-gray-900 text-xl">Get the Mobile App</h3>
                    <p className="text-gray-500 max-w-xs mx-auto">
                        {isMobile
                            ? (isIOS
                                ? "Tap below to install via TestFlight."
                                : "The app is currently available for iOS. Android coming soon!")
                            : "Scan this code with your iPhone camera to install the app via TestFlight."
                        }
                    </p>
                </div>

                {/* Show QR code on desktop, direct button on mobile */}
                {!isMobile ? (
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 inline-block">
                        <QRCode url={TESTFLIGHT_URL} size={200} />
                    </div>
                ) : isIOS ? (
                    <Button
                        className="w-full max-w-xs h-14 text-lg gap-3"
                        style={{ backgroundColor: BRAND_GREEN }}
                        asChild
                    >
                        <a href={TESTFLIGHT_URL}>
                            <span className="text-2xl"></span>
                            Open in TestFlight
                        </a>
                    </Button>
                ) : (
                    <div className="w-full max-w-xs bg-gray-50 rounded-xl p-6 border border-gray-100 text-center">
                        <p className="text-gray-600 text-sm flex items-center justify-center gap-2">
                            <Mail className="h-4 w-4" /> Want to be notified when Android is available?
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                            Contact us at hello@anorha.com
                        </p>
                    </div>
                )}

                <div className="space-y-4 w-full max-w-xs">
                    {INVITE_CODE && (
                        <div className="w-full bg-gray-50 rounded-lg p-3 flex items-center justify-between gap-2 border border-gray-100">
                            <span className="text-gray-500 text-xs uppercase font-semibold tracking-wider">Invite Code</span>
                            <div className="flex items-center gap-2">
                                <code className="bg-white px-2 py-1 rounded border text-sm font-mono text-gray-900">
                                    {INVITE_CODE}
                                </code>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleCopy}
                                    className="h-6 w-6 text-gray-400 hover:text-green-600"
                                >
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    )}

                    {!isMobile && (
                        <Button
                            variant="outline"
                            className="w-full gap-2"
                            asChild
                        >
                            <a href={TESTFLIGHT_URL} target="_blank" rel="noopener noreferrer">
                                Open TestFlight Link
                                <span className="text-xs opacity-50"><ExternalLink className="h-3 w-3 inline ml-1" /></span>
                            </a>
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    // Default 'banner' mode
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: BRAND_GREEN_LIGHT }}
                >
                    <Smartphone className="h-6 w-6 text-[#647653]" />
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900 text-lg">Get the Mobile App</h3>
                    <p className="text-gray-500 text-sm">Download for iOS to scan products and sync inventory</p>
                </div>
            </div>

            <Dialog>
                <DialogTrigger asChild>
                    <Button
                        style={{ backgroundColor: BRAND_GREEN }}
                        className="hover:opacity-90 text-white"
                    >
                        Show QR Code
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Download Mobile App</DialogTitle>
                        <DialogDescription>
                            Scan this QR code with your iPhone to install via TestFlight.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col items-center justify-center p-4 space-y-6">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <QRCode url={TESTFLIGHT_URL} size={250} />
                        </div>

                        {INVITE_CODE && (
                            <div className="w-full bg-gray-50 rounded-lg p-3 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500 text-sm">Invite code:</span>
                                    <code className="bg-white px-2 py-1 rounded border text-sm font-mono text-gray-900">
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
                                className="text-sm font-medium hover:underline flex items-center justify-center gap-1"
                                style={{ color: BRAND_GREEN }}
                            >
                                Open TestFlight Link Directly <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

