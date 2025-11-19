'use client';

import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Badge } from '@repo/design-system/components/ui/badge';
import { CheckCircle2Icon, TrendingUpIcon, Users, XIcon } from 'lucide-react';
import { useState } from 'react';
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react';
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

const TIERS: Tier[] = [
  {
    id: 'growth',
    name: 'Growth',
    description: 'Best for small teams',
    price: 20,
    billingPeriod: 'per month',
    users: 2,
    additionalUserPrice: 10,
    productId: process.env.NEXT_PUBLIC_POLAR_GROWTH_PRODUCT_ID || 'prod_growth',
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
    additionalUserPrice: 10,
    productId: process.env.NEXT_PUBLIC_POLAR_TEAMS_PRODUCT_ID || 'prod_teams',
    features: [
      'Everything in Growth',
      'Unlimited integrations',
      'Pay $0.15 per scan (80 included)',
      'Priority support',
    ],
  },
];

export function TierSelector({ onSelectTier, isLoading, onClose }: TierSelectorProps) {
  const [selectedTierId, setSelectedTierId] = useState<'growth' | 'teams' | null>(null);

  const handleSelectTier = (tier: Tier) => {
    setSelectedTierId(tier.id);
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {TIERS.map((tier) => (
              <div key={tier.id} className="relative pt-6">
                {/* Badge - Outside card for visibility */}
                {tier.highlighted && (
                  <Badge className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#647653] text-white hover:bg-[#F4F4F5] hover:text-black z-20">
                    Most Popular
                  </Badge>
                )}

                {/* Shader Gradient Background - Only for selected card */}
                {selectedTierId === tier.id && (
                  <div className="absolute inset-0 -z-10 rounded-lg overflow-hidden">
                    <ShaderGradientCanvas
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                      }}
                    >
                      <ShaderGradient
                        control="query"
                        urlString="https://www.shadergradient.co/customize?animate=on&axesHelper=off&bgColor1=%23000000&bgColor2=%23000000&brightness=1.2&cAzimuthAngle=180&cDistance=3.6&cPolarAngle=90&cameraZoom=1&color1=%23647653&color2=%23F4F4F5&color3=%23ce8a1d&embedMode=off&envPreset=city&fov=45&gizmoHelper=hide&grain=on&lightType=3d&pixelDensity=3&positionX=0&positionY=0&positionZ=0&reflection=0.1&rotationX=0&rotationY=0&rotationZ=0&shader=defaults&type=plane&uDensity=1.5&uFrequency=5.5&uSpeed=0.3&uStrength=3.5&uTime=0&wireframe=false&zoomOut=false"
                      />
                    </ShaderGradientCanvas>
                  </div>
                )}

                <Card
                  className={`relative cursor-pointer w-full transition-all h-full border-2 bg-background/95 backdrop-blur-sm ${
                    selectedTierId === tier.id
                      ? 'ring-2 ring-[#647653] shadow-lg border-[#647653]'
                      : 'hover:shadow-md border-gray-200'
                  }`}
                  onClick={() => handleSelectTier(tier)}
                >

                  <CardHeader className="pb-4">
                    <CardTitle className="text-2xl">{tier.name}</CardTitle>
                    <CardDescription className="text-base">{tier.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-6">
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

                    {/* Selection Indicator */}
                    {selectedTierId === tier.id && (
                      <div className="pt-4 border-t border-[#647653]/20 bg-[#647653]/5 -mx-6 px-6 py-3 rounded-b-lg">
                        <p className="text-sm text-[#647653] font-semibold">✓ Selected</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col items-center gap-3 pt-4">
            {selectedTierId && (
              <Button
                size="lg"
                onClick={() => {
                  const tier = TIERS.find((t) => t.id === selectedTierId);
                  if (tier) handleSelectTier(tier);
                }}
                disabled={isLoading}
                className="px-8 bg-[#647653] hover:bg-[#556145]"
              >
                {isLoading ? 'Redirecting to checkout...' : 'Continue to checkout'}
              </Button>
            )}
            {onClose && (
              <Button
                variant="secondary"
                size="longlg"
                onClick={onClose}
                className="px-8 border-2 border-gray-300 text-gray-600"
              >
                <XIcon className="size-5 gray-600" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      </PageWrapper>
    </div>
  );
}
