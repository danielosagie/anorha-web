'use client';

import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Badge } from '@repo/design-system/components/ui/badge';
import { CheckCircle2Icon, TrendingUpIcon, Users, XIcon } from 'lucide-react';
import { useState, useMemo } from 'react';
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react';
import { PageWrapper } from '../components/page-wrapper';
import { POLAR_CONFIG } from '@/lib/polar-config';

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
  const growthId = process.env.NEXT_PUBLIC_POLAR_GROWTH_PRODUCT_ID || '116402ad-3ea6-4fae-904d-483afdfee9a6';
  const teamsId = process.env.NEXT_PUBLIC_POLAR_TEAMS_PRODUCT_ID || 'ecf2d388-f89c-4a6c-b6af-ad441bd75e17';

  console.log('[TierSelector] Product IDs:', {
    growth: growthId,
    teams: teamsId,
    env_growth: process.env.NEXT_PUBLIC_POLAR_GROWTH_PRODUCT_ID,
    env_teams: process.env.NEXT_PUBLIC_POLAR_TEAMS_PRODUCT_ID
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

export function TierSelector({ onSelectTier, isLoading, onClose }: TierSelectorProps) {
  const [selectedTierId, setSelectedTierId] = useState<'growth' | 'teams' | null>(null);
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
      console.error('[TierSelector] Invalid product ID for tier:', tier.id, tier.productId);
      alert(
        'Configuration error: Product ID not set. Please contact support.\n\nMissing: ' +
        tier.productId
      );
      return;
    }

    console.log('[TierSelector] Checking out with tier:', tier.id, 'Product ID:', tier.productId);
    onSelectTier(tier);
  };

  return (
    <div className="flex flex-1 flex-col p-2 min-h-[100vh]" style={{ backgroundColor: '#FEF4DD' }}>
      <PageWrapper 
        title="Manage Subscription" 
        description="Scale as you grow"
        onBack={onClose}
        backButtonText="Close"
      >
        <div className="space-y-8 relative">
          {/* Tier Cards */}
          <div className="grid min-h-[40vh] grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {TIERS.map((tier) => (
              <div key={tier.id} className="relative pt-6">
                {/* Badge - Outside card for visibility */}
                {tier.highlighted && (
                  <Badge className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#647653] text-white hover:bg-[#F4F4F5] hover:text-black z-20">
                    Most Popular
                  </Badge>
                )}

                

                  <Card
                  className={`relative cursor-pointer content-between pb-0 w-full transition-all h-full border-2 bg-background/95 backdrop-blur-sm flex flex-col ${
                    selectedTierId === tier.id
                      ? 'ring-2 ring-[#647653] shadow-lg border-[#647653]'
                      : 'hover:shadow-md border-gray-200'
                  }`}
                  onClick={() => handleSelectTier(tier)}
                >
                    <div className="content-start">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-2xl">{tier.name}</CardTitle>
                            <CardDescription className="text-base">{tier.description}</CardDescription>
                        </CardHeader>

                        
                        <CardContent className="space-y-6 flex-1">
                            {/* Pricing */}
                            <div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold">${tier.price}</span>
                                <span className="text-sm text-muted-foreground">/ {tier.billingPeriod}</span>
                            </div>
                            </div>

                            {/* Team Size */}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span>
                                {tier.users} included users (+${tier.additionalUserPrice} per additional)
                            </span>
                            </div>

                            {/* Features List */}
                            <ul className="space-y-3">
                            {tier.features.map((feature, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-sm">
                                <CheckCircle2Icon className="w-5 h-5 text-[#647653] mt-0.5 flex-shrink-0" />
                                <span className="text-foreground">{feature}</span>
                                </li>
                            ))}
                            </ul>
                        </CardContent>
                    </div>

                    {/* Selection Indicator - Always at bottom */}
                    <div className="w-full rounded-b-lg text-center content-end h-full min-h-14">
                        {selectedTierId === tier.id && (
                        <div className="bg-[#647653]/5 min-h-14">
                            <p className="text-sm text-[#647653] justify-center content-center font-semibold min-h-14">✓ Selected</p>
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
                <XIcon className="size-5 mr-2" />
                Cancel
              </Button>
            )}
            <Button
              size="lg"
              onClick={handleCheckout}
              disabled={!selectedTierId || isLoading}
              className={`px-8 transition-colors ${
                selectedTierId
                  ? 'bg-[#647653] hover:bg-[#F4F4F5] text-white'
                  : 'bg-[#F4F4F5] hover:bg-[#F4F4F5] text-gray-500 cursor-not-allowed '
              }`}
            >
              {isLoading ? 'Redirecting to checkout...' : 'Continue to checkout'}
            </Button>
            
          </div>
        </div>
      </PageWrapper>
    </div>
  );
}
