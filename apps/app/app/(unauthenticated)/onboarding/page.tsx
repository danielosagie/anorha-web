import { auth, clerkClient } from '@repo/auth/server';
import { redirect } from 'next/navigation';
import OnboardingClient from './onboarding-client';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default async function OnboardingPage(props: { searchParams: Promise<{ created?: string }> }) {
    const { userId, orgId } = await auth();
    const searchParams = await props.searchParams;
    const created = searchParams.created === 'true';

    // If they already have an active org, they shouldn't be here (unless they just created it)
    if (orgId && !created) {
        redirect('/');
    }

    // If they have any orgs but none active, they still shouldn't see onboarding
    if (userId && !created) {
        const client = await clerkClient();
        const memberships = await client.users.getOrganizationMembershipList({ userId });
        if (memberships.data.length > 0) {
            redirect('/');
        }
    }

    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-500 min-h-[400px]">
                <Loader2 className="h-10 w-10 animate-spin text-[#647653]" />
                <p className="text-muted-foreground font-medium">Initialising...</p>
            </div>
        }>
            <OnboardingClient />
        </Suspense>
    );
}
