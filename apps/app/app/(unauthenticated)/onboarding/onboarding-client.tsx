'use client';

import { useOrganizationList, useUser, CreateOrganization } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TestFlightBanner } from '@/app/(authenticated)/components/testflight-banner';
import { Card, CardContent } from '@repo/design-system/components/ui/card';
import { Button } from '@repo/design-system/components/ui/button';
import Link from 'next/link';
import { Loader2, CheckCircle2 } from 'lucide-react';

type OnboardingStep = 'checking' | 'create_org' | 'success';

export default function OnboardingClient() {
    const { isLoaded: userLoaded, isSignedIn } = useUser();
    const { userMemberships, isLoaded: orgListLoaded } = useOrganizationList({
        userMemberships: {
            infinite: true,
        },
    });
    const router = useRouter();
    const searchParams = useSearchParams();

    const membershipsData = userMemberships?.data;
    const hasOrgs = membershipsData && membershipsData.length > 0;
    const created = searchParams.get('created') === 'true';

    const [step, setStep] = useState<OnboardingStep>('checking');

    useEffect(() => {
        if (!userLoaded || !orgListLoaded) return;

        if (!isSignedIn) {
            router.push('/sign-in');
            return;
        }

        if (created) {
            if (step !== 'success') setStep('success');
            return;
        }

        if (hasOrgs) {
            router.replace('/');
            return;
        }

        if (step === 'checking' && !hasOrgs) {
            setStep('create_org');
        }
    }, [userLoaded, orgListLoaded, isSignedIn, hasOrgs, router, step, created]);

    if (step === 'checking' || !userLoaded || !orgListLoaded) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-500 min-h-[400px]">
                <Loader2 className="h-10 w-10 animate-spin text-[#647653]" />
                <p className="text-muted-foreground font-medium">Preparing your workspace...</p>
            </div>
        );
    }

    if (step === 'create_org') {
        return (
            <div className="flex flex-col space-y-8 animate-in slide-in-from-bottom-8 duration-700 fade-in py-8">
                <div className="flex flex-col space-y-3 text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                        Welcome to Anorha
                    </h1>
                    <p className="text-base text-muted-foreground max-w-sm mx-auto">
                        To get started, we need to create a space for your business team.
                    </p>
                </div>

                <Card className="border-0 shadow-none bg-transparent max-w-md mx-auto w-full">
                    <CardContent className="p-0 flex justify-center">
                        <CreateOrganization
                            afterCreateOrganizationUrl="/onboarding?created=true"
                            appearance={{
                                elements: {
                                    rootBox: "w-full shadow-lg rounded-2xl overflow-hidden",
                                    card: "shadow-none border-0 w-full",
                                    headerTitle: "hidden",
                                    headerSubtitle: "hidden",
                                    formButtonPrimary: "bg-[#647653] hover:bg-[#4a583d] text-sm",
                                }
                            }}
                        />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (step === 'success') {
        return (
            <div className="flex flex-col space-y-8 text-center animate-in zoom-in-95 slide-in-from-bottom-4 duration-700 fade-in py-10 max-w-md mx-auto">
                <div className="flex flex-col items-center space-y-4">
                    <div className="h-20 w-20 bg-green-50 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-12 w-12 text-[#647653]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Organization Created!
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Your professional workspace is now ready.
                        </p>
                    </div>
                </div>

                <div className="text-left w-full">
                    <TestFlightBanner mode="card" />
                </div>

                <div className="space-y-4 w-full">
                    <Link href="/" className="w-full block">
                        <Button
                            className="w-full bg-[#1a1a1a] hover:bg-black text-white h-12 rounded-xl text-md font-semibold"
                        >
                            Open Web App
                        </Button>
                    </Link>
                    <p className="text-xs text-muted-foreground">
                        You're all set. You can now invite team members and sync inventory.
                    </p>
                </div>
            </div>
        );
    }

    return null;
}
