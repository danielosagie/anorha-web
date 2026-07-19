'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export function FooterDownloadLink({ locale }: { locale: string }) {
  const [target, setTarget] = useState<Element | null>(null);

  useEffect(() => {
    setTarget(
      document.querySelector('.landing-footer .footer-links > div:first-child')
    );
  }, []);

  if (!target) {
    return null;
  }

  return createPortal(
    <Link href={`/${locale}/download`}>Download</Link>,
    target
  );
}
