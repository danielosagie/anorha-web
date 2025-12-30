'use client';

import { useOrganizationList, useUser, CreateOrganization } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function OnboardingPage() {
    const { user, isLoaded: userLoaded } = useUser();
    const { userMemberships, isLoaded: orgListLoaded } = useOrganizationList({
        userMemberships: {
            infinite: true,
        },
    });
    const router = useRouter();
    const [showForm, setShowForm] = useState(false);

    const membershipsData = userMemberships?.data;
    const hasOrgs = membershipsData && membershipsData.length > 0;

    useEffect(() => {
        if (!userLoaded || !orgListLoaded) return;

        // If user has orgs, redirect to main app
        if (hasOrgs) {
            router.replace('/');
            return;
        }

        // No orgs - show create org form
        setShowForm(true);
    }, [userLoaded, orgListLoaded, hasOrgs, router]);

    if (!userLoaded || !orgListLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
            </div>
        );
    }

    if (!showForm) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FEF4DD] p-4">
            <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#5c9c00] to-[#8cc63f] px-8 py-6 text-center">
                    <h1 className="text-2xl font-bold text-white">Welcome to Anorha!</h1>
                    <p className="text-white/80 mt-2">Let's set up your workspace</p>
                </div>

                {/* Content */}
                <div className="p-8">
                    <p className="text-gray-600 text-center mb-6">
                        Create an organization to start managing your inventory across platforms.
                    </p>

                    <CreateOrganization
                        appearance={{
                            elements: {
                                rootBox: 'w-full',
                                card: 'shadow-none border-0 p-0',
                                headerTitle: 'hidden',
                                headerSubtitle: 'hidden',
                            },
                        }}
                        afterCreateOrganizationUrl="/"
                    />
                </div>
            </div>
        </div>
    );
}
