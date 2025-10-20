'use client';

import { Button } from '@repo/design-system/components/ui/button';
import { ExternalLinkIcon } from 'lucide-react';
import { useState } from 'react';

interface BillingActionsProps {
  paymentProvider?: 'stripe' | 'polar';
  hasActiveSubscription?: boolean;
}

export function BillingActions({ paymentProvider = 'stripe', hasActiveSubscription = false }: BillingActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      window.location.href = '/api/billing/portal';
    } catch (error) {
      console.error('Error opening portal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      // Use POST to preserve future options (tier/price)
      const res = await fetch('/api/billing/checkout', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          tier: 'Growth',
          paymentProvider: paymentProvider
        }),
      });
      if (res.redirected) {
        window.location.href = res.url;
      } else {
        // Fallback if not redirected by the route
        const { url } = await res.json();
        if (url) window.location.href = url;
      }
    } catch (error) {
      console.error('Error opening checkout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      {hasActiveSubscription ? (
        <Button 
          onClick={handleManageSubscription}
          disabled={isLoading}
          className="w-full md:w-auto" 
          size="sm"
        >
          <ExternalLinkIcon className="mr-2 size-4" />
          {isLoading ? 'Opening...' : 'Manage Subscription'}
        </Button>
      ) : (
        <Button 
          onClick={handleSubscribe}
          disabled={isLoading}
          className="w-full md:w-auto" 
          size="sm"
        >
          <ExternalLinkIcon className="mr-2 size-4" />
          {isLoading ? 'Opening...' : 'Subscribe Now'}
        </Button>
      )}
    </div>
  );
}
