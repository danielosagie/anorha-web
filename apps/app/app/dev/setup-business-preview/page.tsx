import { notFound } from 'next/navigation';
import { SetupBusinessPreview } from './preview-client';

// DEV-ONLY. Renders the real business-address screen inside the app chrome so
// its states can be screenshotted without a Clerk session. 404s in production.
export const dynamic = 'force-dynamic';

export default function SetupBusinessPreviewPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <SetupBusinessPreview />;
}
