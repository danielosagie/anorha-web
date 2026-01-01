'use client';

import { useOrganizationList, useUser, CreateOrganization } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TestFlightBanner } from '@/app/(authenticated)/components/testflight-banner';
import { Card, CardContent } from '@repo/design-system/components/ui/card';
import { Button } from '@repo/design-system/components/ui/button';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

type OnboardingStep = 'checking' | 'create_org' | 'success';

export default function OnboardingPage() {
    const { isLoaded: userLoaded, isSignedIn } = useUser();
    const { userMemberships, isLoaded: orgListLoaded } = useOrganizationList({
        userMemberships: {
            infinite: true,
        },
    });
    const router = useRouter();
    const [step, setStep] = useState<OnboardingStep>('checking');

    const membershipsData = userMemberships?.data;
    const hasOrgs = membershipsData && membershipsData.length > 0;

    useEffect(() => {
        // console.log('[Onboarding] State:', { userLoaded, orgListLoaded, isSignedIn, hasOrgs, step });

        if (!userLoaded || !orgListLoaded) return;

        if (!isSignedIn) {
            router.push('/sign-in'); // Redirect to sign-in if not authenticated
            return;
        }

        // If user already has orgs, they don't need onboarding, generally.
        // Unless they manually navigated here?
        // If they just created one via the form, we handle that in 'success' state manually.
        // But if they reload and have orgs, typically we redirect to dashboard.
        // HOWEVER, if we are in 'success' state, we want to stay there.
        if (hasOrgs && step !== 'success') {
            router.replace('/');
            return;
        }

        if (step === 'checking' && !hasOrgs) {
            setStep('create_org');
        }
    }, [userLoaded, orgListLoaded, isSignedIn, hasOrgs, router, step]);

    if (step === 'checking' || !userLoaded || !orgListLoaded) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-500">
                <Loader2 className="h-8 w-8 animate-spin text-[#5c9c00]" />
                <p className="text-muted-foreground">Checking account...</p>
            </div>
        );
    }

    if (step === 'create_org') {
        return (
            <div className="flex flex-col space-y-6 animate-in slide-in-from-bottom-8 duration-700 fade-in">
                <div className="flex flex-col space-y-2 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Welcome to Anorha!
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Let's set up your workspace.
                    </p>
                </div>

                <Card className="border-0 shadow-none bg-transparent">
                    <CardContent className="p-0 flex justify-center">
                        <CreateOrganization
                            afterCreateOrganizationUrl="/onboarding?created=true" // We catch this or state change? Clerk redirects.
                            // Actually, after creation, Clerk redirects. If we redirect to /onboarding, we lose 'success' state unless we check query param or org count bump.
                            // Better: Redirect to /onboarding?success=true
                            appearance={{
                                elements: {
                                    rootBox: "w-full shadow-none",
                                    card: "shadow-none border border-gray-200 w-full",
                                    headerTitle: "hidden",
                                    headerSubtitle: "hidden",
                                }
                            }}
                        />
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Capture success query param
    // But better to rely on org detection + knowing we just were in create_org?
    // Actually, Clerk's afterCreateOrganizationUrl causes a full page navigation. 
    // So logging `step` won't persist.
    // We need to check if (?success=true) OR (hasOrgs && referrer was create?)

    // Let's modify the useEffect to check for searchParam 'created=true' to show success.
    // If we rely on param, we need to read it.

    // ... wait, I need to read searchParams.

    return (
        <OnboardingContent
            userLoaded={userLoaded}
            orgListLoaded={orgListLoaded}
            isSignedIn={isSignedIn}
            hasOrgs={hasOrgs}
            membershipsData={membershipsData}
        />
    );
}

function OnboardingContent({ userLoaded, orgListLoaded, isSignedIn, hasOrgs }: any) {
    const router = useRouter();
    // We can't easily get search params in a client component without useSearchParams hook.
    // Let's assume we use the hook.
    // But simplifying: If we have orgs, we usually redirect to dashboard. 
    // BUT if we want to show the "Success" screen with QR code, we need to interrupt that redirect.
    // Strategy: 
    // 1. If we have orgs AND no 'created' param, redirect home.
    // 2. If we have orgs AND 'created=true' param, show Success.

    // Actually simplicity: We can create org then just go to dashboard?
    // The user wanted "Success screen (TestFlight + Web App link)".

    // So yes, we need to detect newly created org.

    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        // Basic check ...
        const params = new URLSearchParams(window.location.search);
        if (params.get('created') === 'true') {
            setShowSuccess(true);
        }
    }, []);

    if (showSuccess) {
        return (
            <div className="flex flex-col space-y-6 text-center animate-in zoom-in-95 slide-in-from-bottom-4 duration-700 fade-in">
                <div className="flex flex-col space-y-2">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Organization Created!
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Your workspace is ready.
                    </p>
                </div>

                <div className="text-left">
                    <TestFlightBanner mode="card" />
                </div>

                <div className="space-y-4 pt-4 border-t">
                    <Link href="/">
                        <Button
                            className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                        >
                            Go to Web App
                        </Button>
                    </Link>
                    <p className="text-xs text-muted-foreground">
                        Setup teams & billing
                    </p>
                </div>
            </div>
        );
    }

    if (!userLoaded || !orgListLoaded) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-500">
                <Loader2 className="h-8 w-8 animate-spin text-[#5c9c00]" />
                <p className="text-muted-foreground">Checking account...</p>
            </div>
        );
    }

    if (hasOrgs) {
        // If has orgs and NOT showSuccess (checked above), redirect.
        router.replace('/');
        return null;
    }

    if (!isSignedIn) {
        router.push('/sign-in');
        return null;
    }

    return (
        <div className="flex flex-col space-y-6 animate-in slide-in-from-bottom-8 duration-700 fade-in">
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Welcome to Anorha!
                </h1>
                <p className="text-sm text-muted-foreground">
                    Let's set up your workspace.
                </p>
            </div>

            <Card className="border-0 shadow-none bg-transparent">
                <CardContent className="p-0 flex justify-center">
                    <CreateOrganization
                        afterCreateOrganizationUrl="/onboarding?created=true"
                        appearance={{
                            elements: {
                                rootBox: "w-full shadow-none",
                                card: "shadow-none border border-gray-200 w-full",
                                headerTitle: "hidden",
                                headerSubtitle: "hidden",
                            }
                        }}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
