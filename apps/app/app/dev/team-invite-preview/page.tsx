import { notFound } from 'next/navigation';
import { TeamInvitePreview } from './preview-client';

// DEV-ONLY. Renders the real invite dialog without a Clerk session or a live
// backend, so its states can be screenshotted. 404s in production.
export const dynamic = 'force-dynamic';

export default function TeamInvitePreviewPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <TeamInvitePreview />;
}
