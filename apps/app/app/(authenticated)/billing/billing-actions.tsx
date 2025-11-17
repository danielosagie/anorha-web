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
  const [error, setError] = useState<string | null>(null);

  const handleManageSubscription = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (paymentProvider === 'polar') {
        // Use Polar customer portal
        window.location.href = '/api/polar/portal';
      } else {
        // Use Stripe billing portal
        window.location.href = '/api/billing/portal';
      }
    } catch (err) {
      console.error('Error opening portal:', err);
      setError('Failed to open portal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (paymentProvider === 'polar') {
        // For Polar, we don't use the backend checkout endpoint
        // Instead, redirect directly to Next.js Polar checkout route
        window.location.href = '/api/polar/checkout';
      } else {
        // Use backend checkout for Stripe
        const res = await fetch('/api/billing/checkout', { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            tier: 'Growth',
            paymentProvider: 'stripe'
          }),
        });
        if (res.redirected) {
          window.location.href = res.url;
        } else {
          // Fallback if not redirected by the route
          const { url } = await res.json();
          if (url) window.location.href = url;
        }
      }
    } catch (err) {
      console.error('Error opening checkout:', err);
      setError('Failed to open checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
          {error}
        </div>
      )}
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
    </div>
  );
}
