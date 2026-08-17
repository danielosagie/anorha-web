import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { InvitePreview } from './preview';

/**
 * Dev-only screenshot harness for /invite/[token].
 *
 * The real route needs a live Clerk ticket, so every state cannot be reached by
 * navigation. This renders them inside the shipped unauthenticated layout, at
 * the real column width, and is absent from a production build.
 */
export const dynamic = 'force-dynamic';

export default function InvitePreviewPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }
  return (
    <Suspense fallback={null}>
      <InvitePreview />
    </Suspense>
  );
}
