import Image from 'next/image';
import type { ReactNode } from 'react';

import { CoreFeaturesCart } from './core-features-cart';

/**
 * Core features, left to right in the order the seller lives it: snap, review,
 * manage. The finished listing sits in the middle rather than first, so the
 * payoff is not given away by the opening card.
 *
 * Every screen here is an unmodified simulator capture at 1320 x 2868, shown
 * inside a device frame so the corners are rounded like a real phone rather
 * than sitting as a square-cornered rectangle.
 */

type CardProps = {
  blurb: string;
  children: ReactNode;
  title: string;
  tone: 'snap' | 'review' | 'manage';
};

function Card({ blurb, children, title, tone }: CardProps) {
  return (
    <article className={`cf-card cf-card-${tone}`}>
      <div className="cf-copy">
        <h3>{title}</h3>
        <p>{blurb}</p>
      </div>
      <div className="cf-visual">{children}</div>
    </article>
  );
}

function AppScreen({
  overlay,
  screen,
}: {
  overlay?: { alt: string; src: string };
  screen: { alt: string; src: string };
}) {
  return (
    <div className="cf-device">
      <span className="cf-device-screen">
        <Image
          alt={screen.alt}
          fill
          sizes="(max-width: 900px) 90vw, 340px"
          src={screen.src}
        />
        {overlay ? (
          <span aria-hidden="true" className="cf-device-sheet">
            <Image
              alt={overlay.alt}
              fill
              sizes="(max-width: 900px) 90vw, 340px"
              src={overlay.src}
            />
          </span>
        ) : null}
      </span>
    </div>
  );
}

function LiveMarketplaceListing() {
  return (
    <div className="cf-device cf-live-device">
      <span
        aria-label="A published marketplace listing live on eBay"
        className="cf-device-screen cf-live-screen"
        role="img"
      >
        <span className="cf-live-browser">
          <i />
          <i />
          <i />
          <b>ebay.com/itm</b>
        </span>
        <span className="cf-live-marketplace">
          <Image
            alt="eBay"
            height={24}
            src="/assets/platforms/ebay.svg"
            width={58}
          />
          <span className="cf-live-status">
            <i /> Live
          </span>
        </span>
        <span className="cf-live-photo">
          <Image
            alt="EP-133 sampler listed for sale"
            fill
            sizes="(max-width: 900px) 82vw, 280px"
            src="/assets/landing/scan-item-sampler.jpg"
          />
        </span>
        <span className="cf-live-copy">
          <small>EP-133 K.O. II sampler</small>
          <strong>$249.00</strong>
          <span className="cf-live-buy">Buy It Now</span>
        </span>
        <span className="cf-live-published">
          <b>
            <i /> Published
          </b>
          <span aria-label="Also live on Shopify and Etsy">
            <Image
              alt=""
              height={20}
              src="/assets/platforms/shopify.svg"
              width={20}
            />
            <Image
              alt=""
              height={20}
              src="/assets/platforms/etsy.svg"
              width={20}
            />
          </span>
        </span>
      </span>
    </div>
  );
}

export function CoreFeatures() {
  return (
    <section aria-label="Core features" className="core-features">
      <div className="section-heading centered-heading">
        <span className="landing-eyebrow">FEATURES</span>
        <h2>From photo to sold</h2>
      </div>

      <div className="cf-grid">
        <Card blurb="Snap a photo" title="Snap" tone="snap">
          <AppScreen
            overlay={{
              alt: '',
              src: '/assets/landing/app-cart-sheet-v2.png',
            }}
            screen={{
              alt: 'Adding a product in the app',
              src: '/assets/landing/app-camera-v2.png',
            }}
          />
        </Card>
        <Card blurb="We create an optimized listing" title="Listing" tone="review">
          <AppScreen
            screen={{
              alt: 'The finished listing, written and priced',
              src: '/assets/landing/app-listing-v2.png',
            }}
          />
        </Card>
        <Card blurb="Publish to your platforms" title="Live" tone="manage">
          <AppScreen
            screen={{
              alt: 'The finished listing, written and priced',
              src: '/assets/landing/ebay-live.png',
            }}
          />
        </Card>
      </div>

      <CoreFeaturesCart />
    </section>
  );
}
