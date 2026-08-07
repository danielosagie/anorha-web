'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ConveyorShowcase } from './conveyor-showcase';

function Arrow({ muted = false }: { muted?: boolean }) {
  return (
    <svg aria-hidden="true" className="flow-arrow" viewBox="0 0 56 24">
      <path
        d="M2 12H50M50 12L40 4M50 12L40 20"
        fill="none"
        stroke={muted ? '#8B93AB' : '#9AA36B'}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
    </svg>
  );
}

function ProductPhoto({
  label,
  src,
  position = 'center',
}: {
  label: string;
  src: string;
  position?: string;
}) {
  return (
    <div className="product-photo">
      <Image
        alt="A photographed inventory item ready to list"
        fill
        sizes="150px"
        src={src}
        style={{ objectPosition: position }}
      />
      <span>{label}</span>
    </div>
  );
}

const bulkThumbs = [
  {
    position: '50% 40%',
    price: '$249',
    src: '/assets/landing/scan-item-sampler.jpg',
    title: 'EP-133 sampler',
  },
  {
    position: '50% 55%',
    price: '$180',
    src: '/assets/landing/scan-item-table.jpg',
    title: 'Marble bistro table',
  },
  {
    position: '50% 45%',
    price: '$320',
    src: '/assets/landing/scan-shelf.jpg',
    title: 'Parts lot (12)',
  },
];

/** Where inside the section's scroll each shot sits, for the dot buttons. */
const SHOT_AT = [0.12, 0.74];

export function SingleBulkCards() {
  // The section is taller than the viewport and its stage is pinned, so
  // scrolling here moves nothing on screen: it only crosses the mark that
  // flips Single to Bulk, and the conveyor punches out to every belt with it.
  const sectionRef = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState<0 | 1>(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) {
      return;
    }
    const read = () => {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (!vh) {
        return;
      }
      const range = section.offsetHeight - vh;
      // Below the pin breakpoint the section is no taller than the screen, so
      // fall back to how far it has risen through the viewport.
      const progress =
        range > 40
          ? -rect.top / range
          : (vh * 0.8 - rect.top) / Math.max(1, rect.height);
      setPhase(progress > 0.42 ? 1 : 0);
    };
    read();
    // Polled as well as event-driven: smooth scrolling drives the page from a
    // rAF loop, and some embedded views never deliver scroll events at all.
    const poll = window.setInterval(read, 150);
    window.addEventListener('scroll', read, { passive: true });
    window.addEventListener('resize', read);
    return () => {
      window.clearInterval(poll);
      window.removeEventListener('scroll', read);
      window.removeEventListener('resize', read);
    };
  }, []);

  const goTo = (shot: 0 | 1) => {
    const section = sectionRef.current;
    if (!section) {
      return;
    }
    const range = section.offsetHeight - window.innerHeight;
    if (range <= 40) {
      setPhase(shot);
      return;
    }
    const top = window.scrollY + section.getBoundingClientRect().top;
    window.scrollTo({ behavior: 'smooth', top: top + range * SHOT_AT[shot] });
  };

  return (
    <section
      className={`single-bulk-section${phase === 1 ? ' is-bulk' : ' is-single'}`}
      id="product"
      ref={sectionRef}
    >
      <div className="single-bulk-pin">
        <div className="section-heading centered-heading">
          <span className="landing-eyebrow">ANALYZE</span>
          <h2>One item, or a hundred.</h2>
        </div>
        <div className="single-bulk-split">
          <div className="single-bulk-rail">
            <article
              className="listing-flow-card listing-flow-single"
              data-emphasis={phase === 0 ? 'on' : 'off'}
            >
              <h3>Single</h3>
              <p>Snap one photo, get a full listing.</p>
              <div className="listing-flow">
                <ProductPhoto
                  label="photo"
                  position="50% 40%"
                  src="/assets/landing/scan-item-sampler.jpg"
                />
                <Arrow />
                <div className="generated-listing">
                  <strong>EP-133 K.O. II sampler</strong>
                  <div className="price-row">
                    <b>$249</b>
                    <span>priced from comps</span>
                  </div>
                  <p className="generated-description">
                    Portable sampler with original box, tested and ready to
                    play.
                  </p>
                  <div className="channel-pills">
                    <span>eBay</span>
                    <span>Shopify</span>
                    <span>Depop</span>
                  </div>
                </div>
              </div>
            </article>
            <article
              className="listing-flow-card listing-flow-bulk"
              data-emphasis={phase === 1 ? 'on' : 'off'}
            >
              <h3>Bulk</h3>
              <p>A whole pile, priced and listed in one pass.</p>
              <div className="listing-flow">
                <ProductPhoto
                  label="photos"
                  position="50% 45%"
                  src="/assets/landing/scan-shelf.jpg"
                />
                <Arrow muted />
                <div className="bulk-cart">
                  <div className="cart-heading">
                    <strong>Cart</strong>
                    <span>15 ready</span>
                  </div>
                  {bulkThumbs.map((thumb) => (
                    <div className="cart-row" key={thumb.src}>
                      <Image
                        alt=""
                        height={26}
                        src={thumb.src}
                        style={{
                          objectFit: 'cover',
                          objectPosition: thumb.position,
                        }}
                        width={26}
                      />
                      <span className="cart-item-copy">
                        <strong>{thumb.title}</strong>
                        <b>{thumb.price}</b>
                      </span>
                    </div>
                  ))}
                  <button type="button">List all</button>
                </div>
              </div>
            </article>
          </div>
          <div className="single-bulk-visual">
            <ConveyorShowcase phase={phase} />
          </div>
        </div>
        <div className="single-bulk-dots">
          <button
            aria-label="Show the single item shot"
            aria-pressed={phase === 0}
            className={phase === 0 ? 'is-active' : undefined}
            onClick={() => goTo(0)}
            type="button"
          />
          <button
            aria-label="Show the bulk shot"
            aria-pressed={phase === 1}
            className={phase === 1 ? 'is-active' : undefined}
            onClick={() => goTo(1)}
            type="button"
          />
        </div>
      </div>
    </section>
  );
}
