"use client";

import { Button } from '@repo/design-system/components/ui/button';
import { cn } from '@repo/design-system/lib/utils';
import { Smartphone } from 'lucide-react';

type WaitlistProps = {
  className?: string;
};

export function Waitlist({ className }: WaitlistProps) {
  return (
    <div className={cn('w-full rounded-xl border-white bg-background p-4', className)} style={{ backgroundColor: '#FFFBF1B2' }}>
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-black font-medium">We are in private beta</p>
          <p className="text-gray-700 text-xs mt-1">
            Download the app and we will send you an invite to get started.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => window.open('https://testflight.apple.com', '_blank')}
            className="flex-1 flex items-center justify-center gap-2 h-12"
            style={{
              backgroundColor: '#647653',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.6)',
            }}
          >
            <Smartphone size={18} />
            <span>TestFlight (iOS)</span>
          </Button>
          <Button
            onClick={() => window.open('https://play.google.com/store', '_blank')}
            className="flex-1 flex items-center justify-center gap-2 h-12"
            style={{
              backgroundColor: '#A7CE38',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.6)',
            }}
          >
            <Smartphone size={18} />
            <span>Google Play</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
