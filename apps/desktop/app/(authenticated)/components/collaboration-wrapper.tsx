'use client';

import dynamic from 'next/dynamic';

const CollaborationProvider = dynamic(() =>
  import('./collaboration-provider').then(
    (mod) => mod.CollaborationProvider
  ),
  { ssr: false }
);

interface CollaborationWrapperProps {
  orgId: string;
  children: React.ReactNode;
}

export function CollaborationWrapper({ orgId, children }: CollaborationWrapperProps) {
  return (
    <CollaborationProvider orgId={orgId}>
      {children}
    </CollaborationProvider>
  );
}
