'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

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

export default function PartnerAcceptPage() {
    const params = useParams();
    const router = useRouter();
    const { isLoaded, isSignedIn, getToken } = useAuth();

    const token = params.token as string;

    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [invite, setInvite] = useState<InviteDetails | null>(null);
    const [success, setSuccess] = useState(false);

    // Fetch invite details (public endpoint)
    useEffect(() => {
        if (!token) return;

        const fetchInvite = async () => {
            try {
                // Normalize API base URL - ensure it ends with /api
                let apiBase = (process.env.NEXT_PUBLIC_API_URL || 'https://api.sssync.app/api').replace(/\/$/, '');
                if (!apiBase.endsWith('/api')) {
                    apiBase = `${apiBase}/api`;
                }
                const res = await fetch(`${apiBase}/cross-org/invites/token/${token}`);

                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || 'Invite not found');
                }

                const data = await res.json();
                setInvite(data);
            } catch (err: any) {
                setError(err.message || 'Failed to load invite');
            } finally {
                setLoading(false);
            }
        };

        fetchInvite();
    }, [token]);

    // Accept the invite
    const handleAccept = async () => {
        if (!isSignedIn) {
            // Redirect to sign-in with return URL
            router.push(`/sign-in?redirect_url=/partner/accept/${token}`);
            return;
        }

        setAccepting(true);
        setError(null);

        try {
            const authToken = await getToken();
            // Normalize API base URL - ensure it ends with /api
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

            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Failed to accept invite');
        } finally {
            setAccepting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (error && !invite) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                    <div className="text-6xl mb-4">❌</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Invite Not Found</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Link
                        href="/team"
                        className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700"
                    >
                        Go to Team Page
                    </Link>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                    <div className="text-6xl mb-4">🎉</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Partnership Activated!</h1>
                    <p className="text-gray-600 mb-6">
                        You're now connected with {invite?.sourceOrg?.Name || 'your partner'}.
                        Their products are syncing to your account.
                    </p>
                    <Link
                        href="/team#partners"
                        className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700"
                    >
                        View Partnerships
                    </Link>
                </div>
            </div>
        );
    }

    const isExpired = invite?.ExpiresAt && new Date(invite.ExpiresAt) < new Date();
    const isAlreadyAccepted = invite?.Status?.toLowerCase() === 'accepted';

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-lg w-full bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-green-600 px-8 py-6 text-center">
                    <h1 className="text-2xl font-bold text-white">Partner Invitation</h1>
                </div>

                {/* Content */}
                <div className="p-8">
                    {isExpired && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <p className="text-red-700 font-medium">This invite has expired.</p>
                        </div>
                    )}

                    {isAlreadyAccepted && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <p className="text-blue-700 font-medium">This invite has already been accepted.</p>
                        </div>
                    )}

                    <div className="text-center mb-8">
                        <p className="text-lg text-gray-700">
                            <span className="font-bold text-gray-900">{invite?.sourceOrg?.Name || 'A partner'}</span>
                            {' '}wants to share inventory with you
                        </p>
                    </div>

                    {/* Details */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
                        {invite?.pool?.name && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">Pool:</span>
                                <span className="font-medium text-gray-900">{invite.pool.name}</span>
                            </div>
                        )}
                        {invite?.variantCount !== undefined && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">Products:</span>
                                <span className="font-medium text-gray-900">{invite.variantCount}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-gray-600">Type:</span>
                            <span className="font-medium text-gray-900 capitalize">
                                {invite?.CanRevoke ? '📦 Consignment' : '🤝 Partnership'}
                            </span>
                        </div>
                    </div>

                    {invite?.CanRevoke && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                            <p className="text-sm text-yellow-800">
                                <strong>Consignment Mode:</strong> The sender retains control of these products and can update inventory/pricing.
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <p className="text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    {!isExpired && !isAlreadyAccepted && (
                        <div className="space-y-3">
                            {!isSignedIn && isLoaded && (
                                <p className="text-center text-sm text-gray-600 mb-4">
                                    You'll need to sign in to accept this invitation.
                                </p>
                            )}

                            <button
                                onClick={handleAccept}
                                disabled={accepting}
                                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {accepting ? 'Accepting...' : isSignedIn ? 'Accept Invitation' : 'Sign In & Accept'}
                            </button>

                            <Link
                                href="/"
                                className="block w-full text-center py-3 px-6 rounded-lg font-medium text-gray-600 hover:bg-gray-100"
                            >
                                Decline
                            </Link>
                        </div>
                    )}

                    {(isExpired || isAlreadyAccepted) && (
                        <Link
                            href="/team#partners"
                            className="block w-full text-center bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700"
                        >
                            Go to Partnerships
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
