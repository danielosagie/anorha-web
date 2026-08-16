'use client';

/**
 * DEV-ONLY visual harness. The real screen lives behind Clerk and an active
 * organization, so this mounts the real client component with a placeholder org
 * id inside the same SidebarProvider + PageWrapper chrome the authenticated
 * layout gives it. Nothing here is mocked: filling the form and pressing Save
 * exercises the real request, and the failure it gets back is the real error
 * state.
 */

import { SidebarProvider } from '@repo/design-system/components/ui/sidebar';
import { PageWrapper } from '../../(authenticated)/components/page-wrapper';
import { SetupBusinessClient } from '../../(authenticated)/setup-business/setup-business-client';

const PREVIEW_ORG_ID = 'org_preview';

export function SetupBusinessPreview() {
  return (
    <SidebarProvider>
      <PageWrapper
        description="Used for shipping, returns, and channel locations."
        title="Business address"
      >
        <SetupBusinessClient orgId={PREVIEW_ORG_ID} />
      </PageWrapper>
    </SidebarProvider>
  );
}
