'use client';

import { ArrowUpRight, ScanLine } from 'lucide-react';
import {
  ANDROID_DIRECT_URL,
  AndroidIcon,
  AndroidInvite,
  AppleIcon,
  DESKTOP_ARM64_URL,
  DESKTOP_X64_URL,
  DesktopIcon,
  DownloadQrDialog,
  IOS_TESTFLIGHT_URL,
  useDownloadFlow,
} from '../(home)/components/download-flow';

export function DownloadPageClient() {
  const flow = useDownloadFlow();
  const installLabel = flow.isMobileViewport ? 'Install' : 'Show QR';

  return (
    <div className="download-page">
      <section aria-labelledby="download-title" className="download-page-inner">
        <div className="download-page-heading">
          <span>DOWNLOAD</span>
          <h1 id="download-title">Get Anorha.</h1>
          <p>Choose your device.</p>
        </div>

        <div className="download-page-list">
          <article
            className={`download-device-row${flow.mobilePlatform === 'ios' ? ' is-matching' : ''}`}
          >
            <div className="download-device-icon">
              <AppleIcon size={24} />
            </div>
            <div className="download-device-copy">
              <h2>iOS</h2>
              <p>App Store via TestFlight.</p>
            </div>
            <button
              className="download-device-action"
              onClick={() => flow.openInstall('ios', IOS_TESTFLIGHT_URL)}
              type="button"
            >
              {flow.isMobileViewport ? (
                <ArrowUpRight aria-hidden="true" size={16} />
              ) : (
                <ScanLine aria-hidden="true" size={16} />
              )}
              {installLabel}
            </button>
          </article>

          <article
            className={`download-device-row download-device-android${flow.mobilePlatform === 'android' ? ' is-matching' : ''}`}
          >
            <div className="download-device-row-main">
              <div className="download-device-icon">
                <AndroidIcon size={25} />
              </div>
              <div className="download-device-copy">
                <h2>Android</h2>
                <p>
                  {ANDROID_DIRECT_URL
                    ? 'Get it on Google Play.'
                    : 'Invite access.'}
                </p>
              </div>
              <button
                aria-expanded={flow.showAndroidForm}
                className="download-device-action"
                onClick={flow.openAndroid}
                type="button"
              >
                {ANDROID_DIRECT_URL && !flow.isMobileViewport ? (
                  <ScanLine aria-hidden="true" size={16} />
                ) : (
                  <ArrowUpRight aria-hidden="true" size={16} />
                )}
                {ANDROID_DIRECT_URL ? installLabel : 'Get invite'}
              </button>
            </div>
            <AndroidInvite className="download-page-invite" flow={flow} />
          </article>

          <article className="download-device-row download-device-desktop">
            <div className="download-device-row-main">
              <div className="download-device-icon">
                <DesktopIcon size={24} />
              </div>
              <div className="download-device-copy">
                <h2>Desktop</h2>
                <p>
                  Posts and syncs on marketplaces that have no API. Runs in the
                  background on your Mac.
                </p>
              </div>
              <div className="download-device-desktop-actions">
                <a
                  className="download-device-action"
                  href={DESKTOP_ARM64_URL}
                  rel="noreferrer"
                >
                  <ArrowUpRight aria-hidden="true" size={16} />
                  Apple Silicon
                </a>
                <a
                  className="download-device-action"
                  href={DESKTOP_X64_URL}
                  rel="noreferrer"
                >
                  <ArrowUpRight aria-hidden="true" size={16} />
                  Intel
                </a>
              </div>
            </div>
          </article>
        </div>
      </section>

      <DownloadQrDialog flow={flow} />
    </div>
  );
}
