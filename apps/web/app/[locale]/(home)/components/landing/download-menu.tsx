'use client';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/design-system/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@repo/design-system/components/ui/sheet';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import {
  ANDROID_DIRECT_URL,
  AndroidIcon,
  AndroidInvite,
  AppleIcon,
  DESKTOP_ARM64_URL,
  DesktopIcon,
  type DownloadFlow,
  DownloadQrDialog,
  IOS_TESTFLIGHT_URL,
  useDownloadFlow,
} from '../download-flow';

function DownloadTargets({
  flow,
  locale,
  onMobileInstall,
}: {
  flow: DownloadFlow;
  locale: string;
  onMobileInstall?: () => void;
}) {
  const install = (platform: 'ios' | 'android', url: string) => {
    flow.openInstall(platform, url);
    if (flow.isMobileViewport) {
      onMobileInstall?.();
    }
  };

  return (
    <div className="download-targets">
      <button
        className="download-target-row"
        onClick={() => install('ios', IOS_TESTFLIGHT_URL)}
        type="button"
      >
        <span className="download-target-icon">
          <AppleIcon size={18} />
        </span>
        <span>
          <strong>iPhone</strong>
          <small>TestFlight</small>
        </span>
        <ChevronRight aria-hidden="true" size={17} />
      </button>
      <button
        aria-expanded={flow.showAndroidForm}
        className="download-target-row"
        onClick={() => {
          if (ANDROID_DIRECT_URL) {
            install('android', ANDROID_DIRECT_URL);
            return;
          }
          flow.openAndroid();
        }}
        type="button"
      >
        <span className="download-target-icon">
          <AndroidIcon size={19} />
        </span>
        <span>
          <strong>Android</strong>
          <small>{ANDROID_DIRECT_URL ? 'Google Play' : 'Invite'}</small>
        </span>
        <ChevronRight aria-hidden="true" size={17} />
      </button>
      <a className="download-target-row" href={DESKTOP_ARM64_URL}>
        <span className="download-target-icon">
          <DesktopIcon />
        </span>
        <span>
          <strong>Desktop</strong>
          <small>Mac</small>
        </span>
        <ChevronRight aria-hidden="true" size={17} />
      </a>
      <AndroidInvite flow={flow} />
      <Link className="download-all-link" href={`/${locale}/download`}>
        <span>All downloads</span>
        <ChevronRight aria-hidden="true" size={17} />
      </Link>
    </div>
  );
}

export function DownloadMenu({ locale }: { locale: string }) {
  const flow = useDownloadFlow();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <div className="download-menu-desktop">
        <Popover>
          <PopoverTrigger asChild>
            <button className="landing-nav-download" type="button">
              Download
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="download-popover"
            sideOffset={10}
          >
            <p className="download-menu-label">GET ANORHA</p>
            <DownloadTargets flow={flow} locale={locale} />
          </PopoverContent>
        </Popover>
      </div>

      <div className="download-menu-mobile">
        <Sheet onOpenChange={setMobileOpen} open={mobileOpen}>
          <SheetTrigger asChild>
            <button className="landing-nav-download" type="button">
              Download
            </button>
          </SheetTrigger>
          <SheetContent className="download-bottom-sheet" side="bottom">
            <SheetHeader>
              <SheetTitle>Get Anorha</SheetTitle>
              <SheetDescription>Choose your device.</SheetDescription>
            </SheetHeader>
            <DownloadTargets
              flow={flow}
              locale={locale}
              onMobileInstall={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>

      <DownloadQrDialog flow={flow} />
    </>
  );
}
