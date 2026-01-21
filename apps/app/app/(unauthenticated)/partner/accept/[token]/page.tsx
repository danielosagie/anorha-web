'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useOrganization, useOrganizationList, CreateOrganization, SignIn, OrganizationSwitcher, useClerk } from '@clerk/nextjs';
import Link from 'next/link';
import { TestFlightBanner } from '@/app/(authenticated)/components/testflight-banner';
import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Loader2, LayoutDashboard, Building2, XCircle, Handshake, Package, AlertTriangle, Link as LinkIcon, PartyPopper, Check } from 'lucide-react';
import { toast } from 'sonner';

interface InviteDetails {
    id: string;
    sourceOrgId?: string;
    inviteeEmail: string;
    status: string;
    shareType: string;
    syncDirection: string;
    canRevoke: boolean;
    expiresAt: string;
    sourceOrgName?: string;
    sourcePoolName?: string;
    productCount?: number;  // Grouped by ProductId
    variantCount?: number;  // Total variants
}

// Stepper Component
function Stepper({ current, total }: { current: number; total: number }) {
    return (
        <div className="flex flex-col items-center mt-8 space-y-2">
            <div className="flex items-center space-x-2">
                {Array.from({ length: total }).map((_, i) => {
                    const step = i + 1;
                    const isActive = step === current;
                    const isCompleted = step < current;

                    return (
                        <div key={step} className="flex items-center">
                            <div className={`
                                h-2 rounded-full transition-all duration-300 
                                ${isActive ? 'bg-[#647653] w-8' : isCompleted ? 'bg-[#647653]/40 w-2' : 'bg-gray-200 w-2'}
                            `} />
                        </div>
                    );
                })}
            </div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Step {current} of {total}: {current === 1 ? 'Review' : current === 2 ? 'Connect' : 'Complete'}
            </p>
        </div>
    );
}

export default function PartnerAcceptPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isLoaded, isSignedIn, getToken, orgId } = useAuth();
    const { signOut } = useClerk();
    const { organization, isLoaded: orgLoaded } = useOrganization();
    const { userMemberships, isLoaded: orgListLoaded } = useOrganizationList({
        userMemberships: { infinite: true },
    });

    const token = params.token as string;
    const justAuth = searchParams.get('auth') === 'success';

    const [currentStep, setCurrentStep] = useState<number>(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [invite, setInvite] = useState<InviteDetails | null>(null);
    const [linkedCount, setLinkedCount] = useState<number>(0);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [isAccepting, setIsAccepting] = useState(false);

    const hasOrgs = userMemberships?.data && userMemberships.data.length > 0;
    const isOwnOrg = invite && orgId && invite.sourceOrgId === orgId;

    // Fetch Invite
    useEffect(() => {
        if (!token) return;
        const fetchInvite = async () => {
            try {
                let apiBase = (process.env.NEXT_PUBLIC_API_URL || 'https://api.sssync.app/api').replace(/\/$/, '');
                if (!apiBase.endsWith('/api')) apiBase = `${apiBase}/api`;

                const res = await fetch(`${apiBase}/cross-org/invites/token/${token}`);
                if (!res.ok) throw new Error(await res.text() || 'Invite not found');

                const data = await res.json();
                setInvite(data);

                // If already accepted or just authorized, move to step 2
                if (data.status?.toLowerCase() === 'accepted') {
                    // If accepted, maybe jump to success? 
                    // But user wants explicit flow. Let's start at 1 usually, unless auth redirect.
                }
                if (justAuth) setCurrentStep(2);

            } catch (err: any) {
                setError(err.message || 'Failed to load invite');
            } finally {
                setIsLoading(false);
            }
        };
        fetchInvite();
    }, [token, justAuth]);

    const [emailMismatchError, setEmailMismatchError] = useState<{
        inviteeEmail: string;
        currentEmail: string;
    } | null>(null);

    const handleAcceptClick = async () => {
        setIsAccepting(true);
        setError(null);
        setEmailMismatchError(null);

        try {
            const authToken = await getToken();
            let apiBase = (process.env.NEXT_PUBLIC_API_URL || 'https://api.sssync.app/api').replace(/\/$/, '');
            if (!apiBase.endsWith('/api')) apiBase = `${apiBase}/api`;

            const res = await fetch(`${apiBase}/cross-org/invites/${token}/accept`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify({}),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ message: 'Failed to accept invite' }));

                // Handle EMAIL_MISMATCH error specially
                if (errorData.code === 'EMAIL_MISMATCH') {
                    setEmailMismatchError({
                        inviteeEmail: errorData.inviteeEmail,
                        currentEmail: errorData.currentEmail,
                    });
                    return;
                }

                throw new Error(errorData.message || 'Failed to accept invite');
            }

            const result = await res.json();
            setLinkedCount(result.linkedCount || 0);
            toast.success('Partnership established!');
            setCurrentStep(3); // Move to final step
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to accept invite');
        } finally {
            setIsAccepting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-700">
                <Loader2 className="h-8 w-8 animate-spin text-[#5c9c00]" />
                <p className="text-muted-foreground">Loading invite...</p>
            </div>
        );
    }

    if (error) {
        return (
            <Card className="w-full border-red-200 animate-in zoom-in-95 duration-500">
                <CardHeader>
                    <div className="mx-auto mb-2 text-center">
                        <XCircle className="h-10 w-10 text-red-500" />
                    </div>
                    <CardTitle className="text-center text-red-700">Invite Issue</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-gray-600">{error}</p>
                    <Button onClick={() => router.push('/')} variant="outline" className="w-full">Go Home</Button>
                </CardContent>
            </Card>
        );
    }

    // Step 1: Review
    const renderStep1 = () => {
        const senderName = invite?.sourceOrgName || invite?.inviteeEmail || 'Partner';
        const isConsignment = invite?.canRevoke;

        return (
            <div className="flex flex-col space-y-6 animate-in slide-in-from-bottom-8 duration-500 fade-in">
                <div className="flex flex-col space-y-2 text-center">
                    <div className="mx-auto h-12 w-12 rounded-xl bg-[#647653]/10 flex items-center justify-center mb-2 shadow-sm">
                        <Handshake className="h-6 w-6 text-[#647653]" />
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight">Accept Partner Invite</h1>
                    <p className="text-sm text-muted-foreground">from <span className="font-medium text-foreground">{senderName}</span></p>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm border border-border/50">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Products Shared</span>
                        <span className="font-medium bg-white px-2 py-0.5 rounded shadow-sm text-xs border">
                            {invite?.productCount || invite?.variantCount || 0}
                            {(invite?.variantCount || 0) > (invite?.productCount || 0) && (
                                <span className="text-gray-400 ml-1">({invite?.variantCount} variants)</span>
                            )}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Mode</span>
                        <span className="font-medium capitalize flex items-center gap-1.5 bg-white px-2 py-0.5 rounded shadow-sm text-xs border">
                            {isConsignment ? <><Package className="h-3 w-3" /> Consignment</> : <><Handshake className="h-3 w-3" /> Partnership</>}
                        </span>
                    </div>
                </div>

                <div className="text-xs text-muted-foreground space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="font-medium text-gray-900">What does this mean?</p>
                    <ul className="list-disc leading-relaxed pl-4 space-y-1">
                        <li>{isConsignment ? `You will receive inventory updates from ${senderName}` : `You and ${senderName} will sync inventory levels`}</li>
                        <li>Product details and prices remain managed by you.</li>
                        <li>You can disconnect this partnership at any time.</li>
                    </ul>
                </div>

                <div className="space-y-3 pt-2">
                    <Button
                        onClick={() => setCurrentStep(2)}
                        className="w-full bg-[#647653] hover:bg-[#546346] text-white h-11"
                    >
                        Continue to Connection
                    </Button>
                    <Button onClick={() => router.push('/')} variant="ghost" className="w-full h-11">
                        Decline
                    </Button>
                </div>
            </div>
        );
    };

    // Step 2: Authentication & Organization
    const renderStep2 = () => {
        if (!isLoaded) {
            return (
                <div className="flex flex-col items-center justify-center space-y-4 py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#647653]" />
                    <p className="text-muted-foreground">Verifying account...</p>
                </div>
            );
        }

        // Case: Not Signed In
        if (!isSignedIn) {
            const returnUrl = `/partner/accept/${token}?auth=success`;

            return (
                <div className="flex flex-col items-center space-y-6 animate-in fade-in slide-in-from-bottom-4 pt-4">
                    <div className="w-full max-w-[400px]">
                        <SignIn
                            routing="virtual"
                            afterSignInUrl={returnUrl}
                            afterSignUpUrl={returnUrl}
                            appearance={{
                                elements: {
                                    rootBox: "w-full mx-auto",
                                    card: "shadow-none border-0 w-full bg-transparent p-0",
                                    headerTitle: "text-xl font-semibold text-gray-900",
                                    headerSubtitle: "text-sm text-gray-500",
                                }
                            }}
                        />
                    </div>
                    <Button onClick={() => setCurrentStep(1)} variant="ghost" size="sm">Back to Review</Button>
                </div>
            );
        }

        if (!orgListLoaded) {
            return (
                <div className="flex flex-col items-center justify-center space-y-4 py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#647653]" />
                    <p className="text-muted-foreground">Loading workspaces...</p>
                </div>
            );
        }

        // Case: Signed In, No Org -> Create Org
        if (!hasOrgs) {
            return (
                <div className="flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <div className="text-center">
                        <h2 className="text-xl font-semibold">Create Organization</h2>
                        <p className="text-sm text-muted-foreground">You need an organization to sync inventory.</p>
                    </div>
                    <div className="border rounded-lg p-0 overflow-hidden">
                        <CreateOrganization
                            afterCreateOrganizationUrl={`/partner/accept/${token}?auth=success`}
                            appearance={{
                                elements: {
                                    rootBox: "w-full shadow-none",
                                    card: "shadow-none border-0 w-full",
                                    headerTitle: "hidden",
                                    headerSubtitle: "hidden",
                                }
                            }}
                        />
                    </div>
                    <Button onClick={() => setCurrentStep(1)} variant="ghost">Back</Button>
                </div>
            );
        }

        // Case: Workspace or Personal Context -> Switch Org
        // If user has orgs but is in Personal mode (organization is null) OR in a Workspace/Personal org
        const isWorkspace = organization?.name?.toLowerCase().includes('workspace') ||
            organization?.name?.toLowerCase().includes('personal');

        if (hasOrgs && (!organization || isWorkspace)) {
            return (
                <div className="flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-4 pt-4">
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 space-y-3">
                        <div className="flex items-center gap-2 text-amber-800 font-semibold">
                            <Building2 className="h-5 w-5" />
                            <span>Wrong Organization Context</span>
                        </div>
                        <p className="text-sm text-amber-700 leading-relaxed">
                            You are currently in <strong>{organization?.name || 'Personal Account'}</strong>.
                            partnerships must be established with your main business organization.
                        </p>
                    </div>

                    <div className="w-full space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">Switch Organization</p>
                        <div className="flex justify-center">
                            <OrganizationSwitcher
                                afterSwitchOrganizationUrl={`/partner/accept/${token}?auth=success`}
                                appearance={{
                                    elements: {
                                        rootBox: "w-full",
                                        organizationSwitcherTrigger: "w-full flex items-center justify-between px-4 py-3 border rounded-lg hover:bg-gray-50 bg-white shadow-sm transition-all",
                                        organizationPreviewTextContainer: "flex flex-col items-start gap-0.5",
                                        organizationPreviewMainIdentifier: "font-semibold text-gray-900",
                                        organizationPreviewSecondaryIdentifier: "text-xs text-muted-foreground",
                                    }
                                }}
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <Button
                            onClick={() => window.location.reload()}
                            variant="outline"
                            className="w-full h-11 border-dashed"
                        >
                            I've Switched (Refresh)
                        </Button>
                    </div>
                </div>
            );
        }

        // Case: Signed In + Has Org -> Confirm & Accept

        // Show email mismatch error if present
        if (emailMismatchError) {
            return (
                <div className="flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="text-center space-y-2">
                        <div className="mx-auto h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center mb-2">
                            <AlertTriangle className="h-6 w-6 text-amber-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-amber-800">Wrong Account</h2>
                        <p className="text-sm text-muted-foreground">
                            This invite was sent to a different email address.
                        </p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Invite sent to:</span>
                            <span className="font-medium text-amber-800">{emailMismatchError.inviteeEmail}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">You&apos;re signed in as:</span>
                            <span className="font-medium text-red-600">{emailMismatchError.currentEmail}</span>
                        </div>
                    </div>

                    <p className="text-xs text-center text-muted-foreground">
                        Please sign out and log in with <strong>{emailMismatchError.inviteeEmail}</strong> to accept this invite.
                    </p>

                    <div className="space-y-3">
                        <Button
                            onClick={() => signOut(() => window.location.reload())}
                            className="w-full bg-[#647653] hover:bg-[#546346] text-white h-11"
                        >
                            Sign Out & Switch Account
                        </Button>
                        <Button onClick={() => setCurrentStep(1)} variant="ghost" className="w-full">
                            Back
                        </Button>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-center space-y-2">
                    <div className="mx-auto h-12 w-12 rounded-xl bg-[#647653]/10 flex items-center justify-center mb-2">
                        <LinkIcon className="h-6 w-6 text-[#647653]" />
                    </div>
                    <h2 className="text-xl font-semibold">Ready to Connect</h2>
                    <p className="text-sm text-muted-foreground">
                        You are signed in as a member of an organization.
                    </p>
                </div>

                <div className="flex items-start gap-2 pt-2 bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center h-5">
                        <input
                            id="terms" type="checkbox"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-[#647653] focus:ring-[#647653]"
                        />
                    </div>
                    <label htmlFor="terms" className="text-xs text-muted-foreground leading-tight cursor-pointer select-none">
                        I agree to enable inventory sync {invite?.shareType === 'consignment' ? 'from' : 'with'} <strong>{invite?.sourceOrgName || 'Partner'}</strong>.
                        
                    </label>
                </div>

                {isOwnOrg && (
                    <div className="p-3 bg-red-50 text-red-600 text-xs rounded-md text-center border border-red-100 font-medium">
                        You cannot accept an invite from your own organization. Please switch accounts or organizations.
                    </div>
                )}

                <Button
                    onClick={handleAcceptClick}
                    disabled={!termsAccepted || !!isOwnOrg || isAccepting}
                    className="w-full bg-[#647653] hover:bg-[#546346] text-white h-11"
                >
                    {isAccepting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {isAccepting ? 'Connecting...' : 'Establish Partnership'}
                </Button>
                <Button onClick={() => setCurrentStep(1)} variant="ghost" disabled={isAccepting}>Back</Button>
            </div>
        );
    };

    // Step 3: Success & Actions
    const renderStep3 = () => (
        <div className="flex flex-col space-y-8 text-center animate-in zoom-in-95 slide-in-from-bottom-4 duration-700 fade-in relative">
            {/* Celebration confetti effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-2 h-2 bg-[#647653] rounded-full animate-bounce opacity-60" style={{ animationDelay: '0ms', animationDuration: '1.5s' }} />
                <div className="absolute top-2 right-1/4 w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce opacity-60" style={{ animationDelay: '200ms', animationDuration: '1.8s' }} />
                <div className="absolute top-4 left-1/3 w-1 h-1 bg-emerald-400 rounded-full animate-bounce opacity-50" style={{ animationDelay: '400ms', animationDuration: '2s' }} />
                <div className="absolute top-1 right-1/3 w-2 h-2 bg-blue-400 rounded-full animate-bounce opacity-50" style={{ animationDelay: '300ms', animationDuration: '1.7s' }} />
            </div>

            {/* Success icon with glow effect */}
            <div className="relative mx-auto">
                <div className="absolute inset-0 bg-[#647653]/20 rounded-full blur-xl scale-150 animate-pulse" />
                <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-[#647653] to-[#4a5a3c] flex items-center justify-center shadow-lg shadow-[#647653]/25">
                    <PartyPopper className="h-10 w-10 text-white" />
                </div>
            </div>

            {/* Success message with gradient accent */}
            <div className="flex flex-col space-y-2">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-[#647653] to-gray-900 bg-clip-text text-transparent">
                    Partnership Established!
                </h1>
                {linkedCount > 0 && (
                    <p className="text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5 bg-[#647653]/10 text-[#647653] px-3 py-1 rounded-full font-medium">
                            <Check className="h-3 w-3" /> {linkedCount} products ready to sync
                        </span>
                    </p>
                )}
            </div>

            {/* Action cards in glassmorphic container */}
            <div className="space-y-4 pt-2">
                <p className="text-sm font-medium text-gray-700">What would you like to do next?</p>

                <Link href="/" className="block w-full">
                    <Button
                        variant="outline"
                        className="w-full h-14 border-gray-200 hover:bg-gray-50 hover:border-[#647653]/30 flex items-center justify-center gap-3 rounded-xl transition-all duration-200 hover:shadow-md group"
                    >
                        <LayoutDashboard className="h-5 w-5 text-gray-500 group-hover:text-[#647653] transition-colors" />
                        <span className="font-medium">Open Web Dashboard</span>
                    </Button>
                </Link>

                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200 to-transparent h-px top-1/2" />
                    <span className="relative bg-white px-4 text-xs text-gray-400 font-medium uppercase tracking-wider">
                        or
                    </span>
                </div>

                <TestFlightBanner mode="card" />
            </div>
        </div>
    );

    return (
        <div className="flex flex-col min-h-[500px]">
            <div className="flex-1">
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
            </div>

            {/* Stepper Logic fixed at bottom */}
            <Stepper current={currentStep} total={3} />
        </div>
    );
}
