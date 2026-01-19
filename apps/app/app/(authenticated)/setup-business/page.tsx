'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@repo/design-system/components/ui/card';
import { MapPinIcon, ArrowRightIcon, SkipForwardIcon } from 'lucide-react';

interface AddressForm {
    street1: string;
    street2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

export default function OnboardingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [address, setAddress] = useState<AddressForm>({
        street1: '',
        street2: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'US',
    });

    const handleSave = async () => {
        setLoading(true);
        try {
            // Get org ID from API
            const orgRes = await fetch('/api/organizations/active');
            const orgData = await orgRes.json();
            const orgId = orgData?.activeOrg?.Id;

            if (orgId && address.street1) {
                await fetch(`/api/organizations/${orgId}/address`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(address),
                });
            }

            router.push('/');
        } catch (error) {
            console.error('Failed to save address:', error);
            router.push('/');
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#93C822]/10 to-white flex items-center justify-center p-4">
            <Card className="w-full max-w-lg border-0 shadow-xl">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-[#93C822]/20 rounded-full flex items-center justify-center">
                        <MapPinIcon className="w-8 h-8 text-[#647653]" />
                    </div>
                    <CardTitle className="text-2xl">Where's your store located?</CardTitle>
                    <CardDescription className="text-base">
                        This helps us set up shipping & returns for platforms like eBay.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Street Address</label>
                        <input
                            type="text"
                            placeholder="123 Main Street"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#647653] focus:border-transparent"
                            value={address.street1}
                            onChange={(e) => setAddress(prev => ({ ...prev, street1: e.target.value }))}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">Apt, Suite, Unit (optional)</label>
                        <input
                            type="text"
                            placeholder="Suite 100"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#647653] focus:border-transparent"
                            value={address.street2}
                            onChange={(e) => setAddress(prev => ({ ...prev, street2: e.target.value }))}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1.5">City</label>
                            <input
                                type="text"
                                placeholder="Los Angeles"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#647653] focus:border-transparent"
                                value={address.city}
                                onChange={(e) => setAddress(prev => ({ ...prev, city: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">State</label>
                            <input
                                type="text"
                                placeholder="CA"
                                maxLength={2}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#647653] focus:border-transparent uppercase"
                                value={address.state}
                                onChange={(e) => setAddress(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">ZIP Code</label>
                            <input
                                type="text"
                                placeholder="90001"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#647653] focus:border-transparent"
                                value={address.postalCode}
                                onChange={(e) => setAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Country</label>
                            <input
                                type="text"
                                placeholder="US"
                                maxLength={2}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#647653] focus:border-transparent uppercase"
                                value={address.country}
                                onChange={(e) => setAddress(prev => ({ ...prev, country: e.target.value.toUpperCase() }))}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                        <Button
                            onClick={handleSave}
                            disabled={loading}
                            className="w-full bg-[#647653] hover:bg-[#556145] text-white py-6 text-base"
                        >
                            {loading ? 'Saving...' : 'Continue'}
                            <ArrowRightIcon className="w-4 h-4 ml-2" />
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={handleSkip}
                            className="w-full text-gray-500 hover:text-gray-700"
                        >
                            <SkipForwardIcon className="w-4 h-4 mr-2" />
                            Skip for now
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
