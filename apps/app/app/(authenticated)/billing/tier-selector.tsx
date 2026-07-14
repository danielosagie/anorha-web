'use client';

import { Badge } from '@repo/design-system/components/ui/badge';
import { Button } from '@repo/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import { CheckCircle2Icon, Users, XIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageWrapper } from '../components/page-wrapper';

interface Tier {
  id: 'growth' | 'teams';
  name: string;
  description: string;
  price: number;
  billingPeriod: string;
  features: string[];
  users: number;
  additionalUserPrice: number;
  productId: string;
  highlighted?: boolean;
}

interface TierSelectorProps {
  onSelectTier: (tier: Tier) => void;
  isLoading?: boolean;
  onClose?: () => void;
}

function getTiers(): Tier[] {
  // Try to get from env vars, fallback to hardcoded IDs from Vercel screenshot
  const growthId =
    process.env.NEXT_PUBLIC_POLAR_GROWTH_PRODUCT_ID ||
    '116402ad-3ea6-4fae-904d-483afdfee9a6';
  const teamsId =
    process.env.NEXT_PUBLIC_POLAR_TEAMS_PRODUCT_ID ||
    'ecf2d388-f89c-4a6c-b6af-ad441bd75e17';

  console.log('[TierSelector] Product IDs:', {
    growth: growthId,
    teams: teamsId,
    env_growth: process.env.NEXT_PUBLIC_POLAR_GROWTH_PRODUCT_ID,
    env_teams: process.env.NEXT_PUBLIC_POLAR_TEAMS_PRODUCT_ID,
  });

  return [
    {
      id: 'growth',
      name: 'Growth',
      description: 'Best for small teams',
      price: 20,
      billingPeriod: 'per month',
      users: 2,
      additionalUserPrice: 10,
      productId: growthId,
      highlighted: true,
      features: [
        'Unlimited syncs',
        'Unlimited integrations',
        'Pay $0.20 per scan (40 included)',
        'Email support',
      ],
    },
    {
      id: 'teams',
      name: 'Teams',
      description: 'Best for growing teams',
      price: 60,
      billingPeriod: 'per month',
      users: 5,
      additionalUserPrice: 8,
      productId: teamsId,
      features: [
        'Everything in Growth',
        'Pay $0.15 per scan (120 included)',
        'Priority support',
      ],
    },
  ];
}

export function TierSelector({
  onSelectTier,
  isLoading,
  onClose,
}: TierSelectorProps) {
  const [selectedTierId, setSelectedTierId] = useState<
    'growth' | 'teams' | null
  >(null);
  const TIERS = useMemo(() => getTiers(), []);

  const handleSelectTier = (tier: Tier) => {
    console.log('Selected tier:', tier.id, 'Product ID:', tier.productId);
    setSelectedTierId(tier.id);
  };

  const handleCheckout = () => {
    const tier = TIERS.find((t) => t.id === selectedTierId);
    if (!tier) {
      console.error('[TierSelector] No tier selected');
      return;
    }

    if (!tier.productId || tier.productId.startsWith('missing-')) {
      console.error(
        '[TierSelector] Invalid product ID for tier:',
        tier.id,
        tier.productId
      );
      alert(
        'Configuration error: Product ID not set. Please contact support.\n\nMissing: ' +
          tier.productId
      );
      return;
    }

    console.log(
      '[TierSelector] Checking out with tier:',
      tier.id,
      'Product ID:',
      tier.productId
    );
    onSelectTier(tier);
  };

  return (
    <PageWrapper
      title="Manage Subscription"
      description="Scale as you grow"
      onBack={onClose}
      backButtonText="Close"
    >
      <div className="relative space-y-8">
        {/* Tier Cards */}
        <div className="grid min-h-[40vh] w-full grid-cols-1 gap-6 md:grid-cols-2">
          {TIERS.map((tier) => (
            <div key={tier.id} className="relative pt-6">
              {/* Badge - Outside card for visibility */}
              {tier.highlighted && (
                <Badge className="-translate-x-1/2 absolute top-4 left-1/2 z-20 bg-[#647653] text-white hover:bg-[#F4F4F5] hover:text-black">
                  Most Popular
                </Badge>
              )}

              <Card
                className={`relative flex h-full w-full cursor-pointer flex-col content-between border-2 bg-background/95 pb-0 backdrop-blur-sm transition-all ${
                  selectedTierId === tier.id
                    ? 'border-[#647653] shadow-lg ring-2 ring-[#647653]'
                    : 'border-gray-200 hover:shadow-md'
                }`}
                onClick={() => handleSelectTier(tier)}
              >
                <div className="content-start">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-2xl">{tier.name}</CardTitle>
                    <CardDescription className="text-base">
                      {tier.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-6">
                    {/* Pricing */}
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-4xl">
                          ${tier.price}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          / {tier.billingPeriod}
                        </span>
                      </div>
                    </div>

                    {/* Team Size */}
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Users className="h-4 w-4" />
                      <span>
                        {tier.users} included users (+$
                        {tier.additionalUserPrice} per additional)
                      </span>
                    </div>

                    {/* Features List */}
                    <ul className="space-y-3">
                      {tier.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-3 text-sm"
                        >
                          <CheckCircle2Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#647653]" />
                          <span className="text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </div>

                {/* Selection Indicator - Always at bottom */}
                <div className="h-full min-h-14 w-full content-end rounded-b-lg text-center">
                  {selectedTierId === tier.id && (
                    <div className="min-h-14 bg-[#647653]/5">
                      <p className="min-h-14 content-center justify-center font-semibold text-[#647653] text-sm">
                        ✓ Selected
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-4">
          {onClose && (
            <Button
              variant="outline"
              size="lg"
              onClick={onClose}
              className="px-8"
            >
              <XIcon className="mr-2 size-5" />
              Cancel
            </Button>
          )}
          <Button
            size="lg"
            onClick={handleCheckout}
            disabled={!selectedTierId || isLoading}
            className={`px-8 transition-colors ${
              selectedTierId
                ? 'bg-[#647653] text-white hover:bg-[#F4F4F5]'
                : 'cursor-not-allowed bg-[#F4F4F5] text-gray-500 hover:bg-[#F4F4F5] '
            }`}
          >
            {isLoading ? 'Redirecting to checkout...' : 'Continue to checkout'}
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
}
