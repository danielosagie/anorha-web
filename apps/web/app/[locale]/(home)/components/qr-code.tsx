"use client";

import { useState } from 'react';

// Renders a scannable QR for an install URL via the goqr.me image API (same source
// as the in-app TestFlight banner). Falls back to a plain link if the image fails.
export function QrCode({ url, size = 220 }: { url: string; size?: number }) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-gray-100 text-center"
        style={{ width: size, height: size }}
      >
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 text-sm underline"
          style={{ color: '#647653' }}
        >
          QR unavailable — open link
        </a>
      </div>
    );
  }

  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    url
  )}&format=png&margin=10`;

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt="Scan to install the app"
      width={size}
      height={size}
      className="rounded-lg"
      onError={() => setError(true)}
    />
  );
}
