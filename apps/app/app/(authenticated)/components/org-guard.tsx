'use client';

import { useOrganizationList } from '@clerk/nextjs';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

type OrgGuardProps = {
    readonly children: ReactNode;
};

/**
 * Ensures the user has at least one organization.
 * Redirects to /onboarding if they don't have any orgs.
 * Skips check if already on /onboarding or /partner/accept paths.
 */
export function OrgGuard({ children }: OrgGuardProps) {
    const { userMemberships, isLoaded } = useOrganizationList({
        userMemberships: {
            infinite: true,
        },
    });
    const pathname = usePathname();
    const router = useRouter();

    const membershipsData = userMemberships?.data;
    const hasOrgs = membershipsData && membershipsData.length > 0;

    useEffect(() => {
        if (!isLoaded) return;

        // Skip check for onboarding page and partner accept
        if (pathname?.includes('/onboarding') || pathname?.includes('/partner/accept')) {
            return;
        }

        // If user has no orgs, redirect to onboarding
        if (!hasOrgs) {
            console.log('[OrgGuard] No orgs found, redirecting to onboarding');
            router.replace('/onboarding');
        }
    }, [isLoaded, hasOrgs, pathname, router]);

    // While loading, show nothing (or could show a loader)
    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
            </div>
        );
    }

    // If no orgs and not on onboarding, don't render children (will redirect)
    if (!hasOrgs && !pathname?.includes('/onboarding')) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
            </div>
        );
    }

    return <>{children}</>;
}
