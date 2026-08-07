'use client';

import { Button } from '@repo/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import { ArrowRightIcon, MapPinIcon, SkipForwardIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface AddressForm {
  street1: string;
  street2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
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
    phone: '',
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary/10 to-background p-4">
      <Card className="w-full max-w-lg border-0 shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
            <MapPinIcon className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            Where's your store located?
          </CardTitle>
          <CardDescription className="text-base">
            This helps us set up shipping & returns for platforms like eBay.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <label
              htmlFor="street1"
              className="mb-1.5 block font-medium text-sm"
            >
              Street Address
            </label>
            <input
              id="street1"
              type="text"
              placeholder="123 Main Street"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
              value={address.street1}
              onChange={(e) =>
                setAddress((prev) => ({ ...prev, street1: e.target.value }))
              }
            />
          </div>

          <div>
            <label
              htmlFor="street2"
              className="mb-1.5 block font-medium text-sm"
            >
              Apt, Suite, Unit (optional)
            </label>
            <input
              id="street2"
              type="text"
              placeholder="Suite 100"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
              value={address.street2}
              onChange={(e) =>
                setAddress((prev) => ({ ...prev, street2: e.target.value }))
              }
            />
          </div>

          <div>
            <label
              htmlFor="business-phone"
              className="mb-1.5 block font-medium text-sm"
            >
              Business Phone
            </label>
            <input
              id="business-phone"
              type="tel"
              placeholder="+1 (555) 555-5555"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
              value={address.phone}
              onChange={(e) =>
                setAddress((prev) => ({ ...prev, phone: e.target.value }))
              }
            />
            <p className="mt-1 text-gray-500 text-xs">
              Required for eBay location creation.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label
                htmlFor="city"
                className="mb-1.5 block font-medium text-sm"
              >
                City
              </label>
              <input
                id="city"
                type="text"
                placeholder="Los Angeles"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                value={address.city}
                onChange={(e) =>
                  setAddress((prev) => ({ ...prev, city: e.target.value }))
                }
              />
            </div>
            <div>
              <label
                htmlFor="state"
                className="mb-1.5 block font-medium text-sm"
              >
                State
              </label>
              <input
                id="state"
                type="text"
                placeholder="CA"
                maxLength={2}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 uppercase focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                value={address.state}
                onChange={(e) =>
                  setAddress((prev) => ({
                    ...prev,
                    state: e.target.value.toUpperCase(),
                  }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="postal-code"
                className="mb-1.5 block font-medium text-sm"
              >
                ZIP Code
              </label>
              <input
                id="postal-code"
                type="text"
                placeholder="90001"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                value={address.postalCode}
                onChange={(e) =>
                  setAddress((prev) => ({
                    ...prev,
                    postalCode: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label
                htmlFor="country"
                className="mb-1.5 block font-medium text-sm"
              >
                Country
              </label>
              <input
                id="country"
                type="text"
                placeholder="US"
                maxLength={2}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 uppercase focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                value={address.country}
                onChange={(e) =>
                  setAddress((prev) => ({
                    ...prev,
                    country: e.target.value.toUpperCase(),
                  }))
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-primary py-6 text-base text-white hover:bg-primary/90"
            >
              {loading ? 'Saving...' : 'Continue'}
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="w-full text-gray-500 hover:text-gray-700"
            >
              <SkipForwardIcon className="mr-2 h-4 w-4" />
              Skip for now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
