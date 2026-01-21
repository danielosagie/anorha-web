'use client';

import { OrganizationProfile } from '@clerk/nextjs';

export function OrgProfileClient() {
  return (
    <OrganizationProfile
      routing="hash"
      appearance={{ elements: { rootBox: { boxShadow: 'none' } } }}
    />
  );
}


