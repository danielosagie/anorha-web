'use client';

import { Button } from '@repo/design-system/components/ui/button';
import { ExternalLinkIcon } from 'lucide-react';
import { useState } from 'react';

interface BillingActionsProps {
  hasActiveSubscription?: boolean;
  onSubscribeClick?: () => void; // Callback to show tier selector
}

export function BillingActions({ 
  hasActiveSubscription = false,
  onSubscribeClick 
}: BillingActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Navigate to customer portal to manage existing subscription
  const handleManageSubscription = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Open Polar customer portal where they can view subscriptions, invoices, change payment method, etc.
      window.location.href = '/api/polar/portal';
    } catch (err) {
      console.error('Error opening portal:', err);
      setError('Failed to open portal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = () => {
    // Show tier selector (parent handles opening the modal/section)
    if (onSubscribeClick) {
      onSubscribeClick();
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
