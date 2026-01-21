'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Button } from '@repo/design-system/components/ui/button';
import { CheckCircleIcon } from 'lucide-react';

export default function BillingSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [source, setSource] = useState<'web' | 'mobile' | 'unknown'>('unknown');

  const checkoutId = searchParams.get('checkout_id');

  useEffect(() => {
    // Detect if user came from mobile app
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileApp = userAgent.includes('expo') || userAgent.includes('sssync');
    
    if (isMobileApp) {
      setSource('mobile');
      // Deeplink back to mobile app billing screen
      // Format: sssync://billing?checkout_id=...
      setTimeout(() => {
        window.location.href = `sssync://billing?checkout_id=${checkoutId || ''}`;
      }, 2000);
    } else {
      setSource('web');
      // Redirect to billing page after 3 seconds
      setTimeout(() => {
        router.push('/billing');
      }, 3000);
    }

    setIsLoading(false);
  }, [checkoutId, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4" style={{ backgroundColor: '#FEF4DD' }}>
      <Card className="max-w-md w-full border-2 shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div>
            <p className="text-muted-foreground mb-2">
              {source === 'mobile'
                ? 'Thank you for subscribing! Returning to the app...'
                : 'Thank you for subscribing! Redirecting to your billing dashboard...'}
            </p>
            {checkoutId && (
              <p className="text-xs text-muted-foreground">
                Checkout ID: {checkoutId}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {source === 'mobile'
                ? 'Returning to the app...'
                : 'Redirecting in a few seconds...'}
            </p>
            <Button
              onClick={() => {
                if (source === 'mobile') {
                  window.location.href = `sssync://billing?checkout_id=${checkoutId || ''}`;
                } else {
                  router.push('/billing');
                }
              }}
              variant="default"
              className="w-full"
            >
              {source === 'mobile' ? 'Open App' : 'Go to Billing'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

