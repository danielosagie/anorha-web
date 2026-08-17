'use client';

import { getPolarProductIds } from '@/lib/polar-config';
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
  const productIds = getPolarProductIds();
  const growthId = productIds.growth || 'missing-growth';
  const teamsId = productIds.teams || 'missing-teams';

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
    setSelectedTierId(tier.id);
  };

  const handleCheckout = () => {
    const tier = TIERS.find((t) => t.id === selectedTierId);
    if (!tier) {
      return;
    }

    if (!tier.productId || tier.productId.startsWith('missing-')) {
      alert(
        `Configuration error: Product ID not set. Please contact support.\n\nMissing: ${tier.productId}`
      );
      return;
    }

    onSelectTier(tier);
  };

  return (
    <PageWrapper
      title="Choose a plan"
      description="Select a plan, then continue to secure checkout."
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
                <Badge className="-translate-x-1/2 absolute top-4 left-1/2 z-20 bg-primary text-primary-foreground hover:bg-primary/90">
                  Most Popular
                </Badge>
              )}

              <Card
                className={`relative flex h-full w-full cursor-pointer flex-col content-between pb-0 transition-colors ${
                  selectedTierId === tier.id
                    ? 'border-k0-accent-ink/40 bg-k0-accent-wash'
                    : 'border-k0-border bg-k0-card hover:border-k0-border-strong'
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
                          <CheckCircle2Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                          <span className="text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </div>

                {/* Selection Indicator - Always at bottom */}
                <div className="h-full min-h-14 w-full content-end rounded-b-lg text-center">
                  {selectedTierId === tier.id && (
                    <div className="min-h-14 bg-primary/5">
                      <p className="min-h-14 content-center justify-center font-semibold text-primary text-sm">
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
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'cursor-not-allowed bg-k0-hairline text-k0-ink-3 hover:bg-k0-hairline '
            }`}
          >
            {isLoading ? 'Redirecting to checkout...' : 'Continue to checkout'}
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
}
