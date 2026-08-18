import { notFound } from 'next/navigation';
import { PreviewClient } from './preview-client';
import { PREVIEW_STATES, type PreviewState } from './preview-states';

// DEV-ONLY. This route 404s in any production build, so it never reaches users.
export const dynamic = 'force-dynamic';

function resolveState(value: string | string[] | undefined): PreviewState {
  const candidate = Array.isArray(value) ? value[0] : value;
  return PREVIEW_STATES.find((state) => state === candidate) ?? 'empty';
}

export default async function StoreLinkPreviewPage(props: {
  searchParams: Promise<{ state?: string | string[] }>;
}) {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const searchParams = await props.searchParams;

  return <PreviewClient state={resolveState(searchParams.state)} />;
}
