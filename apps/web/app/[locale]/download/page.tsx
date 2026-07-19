import type { Metadata } from 'next';
import { DownloadPageClient } from './download-page-client';

export const metadata: Metadata = {
  description: 'Install Anorha on iPhone or Android.',
  title: 'Download Anorha',
};

export default function DownloadPage() {
  return <DownloadPageClient />;
}
