'use client';

import { CreateOrganization as ClerkCreateOrganization } from '@clerk/nextjs';

export const CreateOrganization = () => (
    <ClerkCreateOrganization
        appearance={{
            elements: {
                header: 'hidden',
                rootBox: 'w-full',
                card: 'shadow-none border-0',
            },
        }}
        afterCreateOrganizationUrl="/team"
    />
);
