'use client';

import { useOrganizationList } from '@clerk/nextjs';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, ReactNode } from 'react';

type OrgGuardProps = {
    readonly children: ReactNode;
};

/**
 * Ensures the user has at least one organization.
 * Redirects to /onboarding if they don't have any orgs.
 * Skips check if already on /onboarding or /partner/accept paths.
 * 
 * IMPORTANT: Uses hasCheckedRef to prevent redirect loops during Clerk's
 * background refetches when using infinite: true pagination.
 */
export function OrgGuard({ children }: OrgGuardProps) {
    const { userMemberships, isLoaded } = useOrganizationList({
        userMemberships: {
            infinite: true,
        },
    });
    const pathname = usePathname();
    const router = useRouter();

    // Track if we've done the initial check to prevent redirect loops
    // during Clerk's background refetches
    const hasCheckedRef = useRef(false);
    const hasOrgsRef = useRef(false);

    const membershipsData = userMemberships?.data;
    const hasOrgs = membershipsData && membershipsData.length > 0;

    // Update hasOrgsRef when we definitively know user has orgs
    if (hasOrgs) {
        hasOrgsRef.current = true;
    }

    useEffect(() => {
        if (!isLoaded) return;

        // Skip check for onboarding page and partner accept
        if (pathname?.includes('/onboarding') || pathname?.includes('/partner/accept')) {
            return;
        }

        // Only redirect on the FIRST check when we definitively know user has no orgs
        // Once we've seen orgs, never redirect (prevents flicker during refetches)
        if (!hasCheckedRef.current && !hasOrgs && !hasOrgsRef.current) {
            hasCheckedRef.current = true;
            console.log('[OrgGuard] No orgs found on initial check, redirecting to onboarding');
            router.replace('/onboarding');
        } else if (hasOrgs) {
            hasCheckedRef.current = true;
        }
    }, [isLoaded, hasOrgs, pathname, router]);

    // While loading on first render, show loader
    if (!isLoaded && !hasCheckedRef.current) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#FEF4DD]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#647653]" />
            </div>
        );
    }

    // If no orgs on first check and not on public paths, show loader while redirecting
    const isPublicPath = pathname?.includes('/onboarding') || pathname?.includes('/partner/accept');
    if (!hasOrgs && !hasOrgsRef.current && !isPublicPath && !hasCheckedRef.current) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#FEF4DD]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#647653]" />
            </div>
        );
    }

    return <>{children}</>;
}
