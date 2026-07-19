'use client';

import { Button } from '@repo/design-system/components/ui/button';
import { cn } from '@repo/design-system/lib/utils';
import { Smartphone } from 'lucide-react';
import {
  AndroidIcon,
  AndroidInvite,
  AppleIcon,
  DownloadQrDialog,
  IOS_TESTFLIGHT_URL,
  useDownloadFlow,
} from './download-flow';

type WaitlistProps = {
  className?: string;
  variant?: 'default' | 'landing';
};

export function Waitlist({ className, variant = 'default' }: WaitlistProps) {
  const flow = useDownloadFlow();
  const isLanding = variant === 'landing';

  return (
    <div
      className={cn(
        'w-full',
        isLanding
          ? 'landing-waitlist'
          : 'rounded-xl border-white bg-background p-4',
        className
      )}
      style={isLanding ? undefined : { backgroundColor: '#FFFBF1B2' }}
    >
      <div className="flex flex-col gap-4">
        {isLanding ? null : (
          <div>
            <p className="font-medium text-black text-sm">
              We are in private beta
            </p>
            <p className="mt-1 text-gray-700 text-xs">
              Download the app to get started.
            </p>
          </div>
        )}

        <div
          className={cn(
            'flex flex-col gap-3 sm:flex-row',
            isLanding && 'landing-download-button-row'
          )}
        >
          <Button
            className={cn(
              'flex h-12 flex-1 items-center justify-center gap-2',
              isLanding && 'landing-store-button landing-store-button-ios'
            )}
            onClick={() => flow.openInstall('ios', IOS_TESTFLIGHT_URL)}
            style={
              isLanding
                ? undefined
                : {
                    backgroundColor: '#647653',
                    border: '2px solid rgba(255, 255, 255, 0.6)',
                    color: 'white',
                  }
            }
          >
            {isLanding ? <AppleIcon /> : <Smartphone size={18} />}
            <span>
              {isLanding ? 'Download for iPhone' : 'TestFlight (iOS)'}
            </span>
          </Button>
          <Button
            aria-expanded={flow.showAndroidForm}
            className={cn(
              'flex h-12 flex-1 items-center justify-center gap-2',
              isLanding && 'landing-store-button landing-store-button-android'
            )}
            onClick={flow.openAndroid}
            style={
              isLanding
                ? undefined
                : {
                    backgroundColor: '#A7CE38',
                    border: '2px solid rgba(255, 255, 255, 0.6)',
                    color: 'white',
                  }
            }
          >
            {isLanding ? <AndroidIcon /> : <Smartphone size={18} />}
            <span>{isLanding ? 'Download for Android' : 'Google Play'}</span>
          </Button>
        </div>

        {!isLanding && !flow.isMobileViewport ? (
          <p className="-mt-1 text-gray-600 text-xs">
            On your computer? Choose a store to show a QR code.
          </p>
        ) : null}

        <AndroidInvite
          className={cn(isLanding && 'landing-waitlist-form')}
          flow={flow}
        />
      </div>
      <DownloadQrDialog flow={flow} />
    </div>
  );
}
