'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useOrganizationList, CreateOrganization } from '@clerk/nextjs';
import Link from 'next/link';
import { TestFlightBanner } from '@/app/(authenticated)/components/testflight-banner';
import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface InviteDetails {
    Id: string;
    InviteeEmail: string;
    Status: string;
    ShareType: string;
    SyncDirection: string;
    CanRevoke: boolean;
    ExpiresAt: string;
    sourceOrg?: {
        Name: string;
    };
    pool?: {
        name: string;
    };
    variantCount?: number;
}

type FlowStep = 'loading' | 'error' | 'invite_details' | 'create_org' | 'accepting' | 'success';

export default function PartnerAcceptPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isLoaded, isSignedIn, getToken } = useAuth();
    const { userMemberships, isLoaded: orgListLoaded } = useOrganizationList({
        userMemberships: { infinite: true },
    });

    const token = params.token as string;
    // Check if we just came back from auth flow
    const justAuth = searchParams.get('auth') === 'success';

    const [step, setStep] = useState<FlowStep>('loading');
    const [error, setError] = useState<string | null>(null);
    const [invite, setInvite] = useState<InviteDetails | null>(null);
    const [linkedCount, setLinkedCount] = useState<number>(0);

    const hasOrgs = userMemberships?.data && userMemberships.data.length > 0;

    // Fetch invite details
    useEffect(() => {
        if (!token) return;

        const fetchInvite = async () => {
            try {
                let apiBase = (process.env.NEXT_PUBLIC_API_URL || 'https://api.sssync.app/api').replace(/\/$/, '');
                if (!apiBase.endsWith('/api')) {
                    apiBase = `${apiBase}/api`;
                }
                const res = await fetch(`${apiBase}/cross-org/invites/token/${token}`);

                if (!res.ok) {
                    const text = await res.text();
                    // If 404/400, handle nicely
                    throw new Error(text || 'Invite not found');
                }

                const data = await res.json();
                setInvite(data);

                // If already accepted, go to success
                if (data.Status?.toLowerCase() === 'accepted') {
                    setStep('success');
                } else {
                    setStep('invite_details');
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load invite');
                setStep('error');
            }
        };

        fetchInvite();
    }, [token]);

    // Handle flow logic when dependencies load
    useEffect(() => {
        if (justAuth && isLoaded && isSignedIn && step === 'invite_details') {
            if (orgListLoaded) {
                if (!hasOrgs) {
                    setStep('create_org');
                } else {
                    acceptInvite();
                }
            }
        }
    }, [justAuth, isLoaded, isSignedIn, orgListLoaded, hasOrgs, step]);

    const handleAcceptClick = () => {
        if (!isSignedIn) {
            // 1. Redirect to sign-up/in with return URL
            const returnUrl = `/partner/accept/${token}?auth=success`;
            router.push(`/sign-up?redirect_url=${encodeURIComponent(returnUrl)}`);
            return;
        }

        // 2. Signed in - check orgs
        if (orgListLoaded && !hasOrgs) {
            setStep('create_org');
            return;
        }

        // 3. Signed in & Has Orgs - Accept
        acceptInvite();
    };

    const handleDeclineClick = () => {
        router.push('/');
    };

    const acceptInvite = async () => {
        setStep('accepting');
        setError(null);

        try {
            const authToken = await getToken();
            let apiBase = (process.env.NEXT_PUBLIC_API_URL || 'https://api.sssync.app/api').replace(/\/$/, '');
            if (!apiBase.endsWith('/api')) {
                apiBase = `${apiBase}/api`;
            }

            const res = await fetch(`${apiBase}/cross-org/invites/${token}/accept`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify({}),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Failed to accept invite');
            }

            const result = await res.json();
            setLinkedCount(result.linkedCount || 0);
            setStep('success');
            toast.success('Partnership established!');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to accept invite');
            setStep('invite_details'); // Go back to allow retry
        }
    };

    // --- Render Steps ---

    if (step === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-700">
                <Loader2 className="h-8 w-8 animate-spin text-[#5c9c00]" />
                <p className="text-muted-foreground">Loading invite...</p>
            </div>
        );
    }

    if (step === 'error') {
        return (
            <Card className="w-full border-red-200 animate-in zoom-in-95 duration-500">
                <CardHeader>
                    <div className="text-4xl mb-2 text-center">❌</div>
                    <CardTitle className="text-center text-red-700">Invite Issue</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-gray-600">{error}</p>
                    <Button onClick={() => router.push('/')} variant="outline" className="w-full">
                        Go Home
                    </Button>
                </CardContent>
            </Card>
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
                        Create an organization to start managing your inventory across platforms.
                    </p>
                </div>

                <Card className="border-0 shadow-none bg-transparent">
                    <CardContent className="p-0 flex justify-center">
                        <CreateOrganization
                            afterCreateOrganizationUrl={`/partner/accept/${token}`}
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

    if (step === 'accepting') {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-500">
                <Loader2 className="h-8 w-8 animate-spin text-[#5c9c00]" />
                <p className="text-muted-foreground">Establishing partnership...</p>
            </div>
        );
    }

    if (step === 'success') {
        return (
            <div className="flex flex-col space-y-6 text-center animate-in zoom-in-95 slide-in-from-bottom-4 duration-700 fade-in">
                <div className="flex flex-col space-y-2">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Partnership Established!
                    </h1>
                    {linkedCount > 0 && (
                        <p className="text-sm text-muted-foreground">
                            {linkedCount} products ready to sync.
                        </p>
                    )}
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

    // Default: 'invite_details'
    return (
        <div className="flex flex-col space-y-6 animate-in slide-in-from-bottom-8 duration-700 fade-in">
            {/* Header Section */}
            <div className="flex flex-col space-y-2 text-center">
                <div className="mx-auto h-12 w-12 rounded-xl bg-[#647653]/10 flex items-center justify-center text-xl mb-2 shadow-sm">
                    🤝
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">
                    Accept Partner Invite
                </h1>
                <p className="text-sm text-muted-foreground">
                    from <span className="font-medium text-foreground">{invite?.sourceOrg?.Name || invite?.InviteeEmail}</span>?
                </p>
            </div>

            {/* Info Card */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm border border-border/50">
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Products</span>
                    <span className="font-medium bg-white px-2 py-0.5 rounded shadow-sm text-xs border">{invite?.variantCount || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Mode</span>
                    <span className="font-medium capitalize flex items-center gap-1.5 bg-white px-2 py-0.5 rounded shadow-sm text-xs border">
                        {invite?.CanRevoke ? '📦 Consignment' : '🤝 Partnership'}
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
                <Button
                    onClick={handleAcceptClick}
                    className="w-full bg-[#647653] hover:bg-[#546346] text-white h-11 shadow-sm transition-all hover:scale-[1.02]"
                >
                    Yes, Accept Invite
                </Button>

                <Button
                    onClick={handleDeclineClick}
                    variant="ghost"
                    className="w-full h-11 text-muted-foreground hover:text-foreground"
                >
                    No, Decline
                </Button>
            </div>
        </div>
    );
}
