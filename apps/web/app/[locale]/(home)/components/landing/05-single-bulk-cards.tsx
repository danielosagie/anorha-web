'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ConveyorShowcase } from './conveyor-showcase';

/** Where inside the section's scroll each shot sits, for the dot buttons. */
const SHOT_AT = [0.12, 0.74];
/** How far down the runway Single gives way to Bulk. */
const FLIP_AT = 0.42;
/** The one breakpoint where the stage is tall enough to pin. */
const PIN_QUERY =
  '(min-width: 901px) and (prefers-reduced-motion: no-preference)';

function Arrow() {
  return (
    <svg
      aria-hidden="true"
      className="flow-arrow"
      viewBox="0 3.176 41.176 17.647"
    >
      <path
        d="M1.473 11.999H36.768M36.768 11.999L29.415 6.181M36.768 11.999L29.415 17.818"
        fill="none"
        stroke="#9AA36B"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />
    </svg>
  );
}

function UploadedPhoto({
  count,
  position,
  src,
}: {
  count: string;
  position: string;
  src: string;
}) {
  return (
    <div className="product-photo">
      <Image
        alt="A photographed inventory item ready to list"
        fill
        sizes="160px"
        src={src}
        style={{ objectPosition: position }}
      />
      <span>{count}</span>
    </div>
  );
}

const CART_ROWS = [
  { price: '$249', title: '4 HVAC Blowers' },
  { price: '$53', title: '700298 HVAC' },
  { price: '$47', title: 'Evaporador Frontal' },
  { price: '$55', title: 'FOUR SEASONS 75855' },
  { price: '$55', title: '75855 Flange Kit' },
  { price: '$45', title: '75860 Motor Assembly' },
];

export function SingleBulkCards() {
  // The section is taller than the viewport and its stage is pinned, so
  // scrolling here moves nothing on screen: it holds on Single, then crosses
  // the one mark that swaps it to Bulk. The cards share a grid cell, so that
  // swap is a cross-fade in place and the conveyor beside them never flinches.
  const sectionRef = useRef<HTMLElement>(null);
  const [shot, setShot] = useState<0 | 1>(0);
  // read by the dots, which scroll on the pin and set the shot off it
  const pinnedRef = useRef(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) {
      return;
    }
    const pinned = window.matchMedia(PIN_QUERY);

    const read = () => {
      pinnedRef.current = pinned.matches;
      // Off the pin there is no runway to read, so the dots own the shot.
      if (!pinned.matches) {
        return;
      }
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const range = section.offsetHeight - vh;
      if (range <= 40) {
        return;
      }
      setShot(-rect.top / range > FLIP_AT ? 1 : 0);
    };

    read();
    // Polled as well as event-driven: smooth scrolling drives the page from a
    // rAF loop, and some embedded views never deliver scroll events at all.
    const poll = window.setInterval(read, 150);
    window.addEventListener('scroll', read, { passive: true });
    window.addEventListener('resize', read);
    pinned.addEventListener('change', read);

    return () => {
      window.clearInterval(poll);
      window.removeEventListener('scroll', read);
      window.removeEventListener('resize', read);
      pinned.removeEventListener('change', read);
    };
  }, []);

  const goTo = useCallback((next: 0 | 1) => {
    const section = sectionRef.current;
    if (!section) {
      return;
    }
    if (!pinnedRef.current) {
      setShot(next);
      return;
    }
    const range = section.offsetHeight - window.innerHeight;
    if (range <= 40) {
      setShot(next);
      return;
    }
    const top = window.scrollY + section.getBoundingClientRect().top;
    window.scrollTo({ behavior: 'smooth', top: top + range * SHOT_AT[next] });
  }, []);

  return (
    <section
      className={`single-bulk-section${shot === 1 ? ' is-bulk' : ' is-single'}`}
      id="product"
      ref={sectionRef}
    >
      <div className="single-bulk-pin">
        <div className="section-heading centered-heading">
          <h2>Analyze 1 or 100 items at once</h2>
        </div>
        <div className="single-bulk-split">
          <div className="single-bulk-rail">
            <article
              className="listing-flow-card listing-flow-single"
              data-emphasis={shot === 0 ? 'on' : 'off'}
            >
              <h3>Single</h3>
              <p>Snap one photo, get a full listing.</p>
              <div className="listing-flow">
                <UploadedPhoto
                  count="1 uploaded photo"
                  position="50% 40%"
                  src="/assets/landing/scan-item-sampler.jpg"
                />
                <Arrow />
                <div className="generated-listing">
                  <div className="listing-thumb">
                    <Image
                      alt=""
                      fill
                      sizes="140px"
                      src="/assets/landing/scan-item-sampler.jpg"
                      style={{ objectPosition: '50% 40%' }}
                    />
                  </div>
                  <strong>EP-133 K.O. II sampler</strong>
                  <div className="price-row">
                    <b>$249</b>
                  </div>
                  <p className="generated-description">
                    Portable sampler with original box, tested and ready to
                    play.
                  </p>
                  <div className="channel-logos">
                    <span>
                      {/* biome-ignore lint/nursery/noImgElement: static brand SVG, no optimization needed */}
                      <img alt="eBay" src="/assets/platforms/ebay.svg" />
                    </span>
                    <span>
                      {/* biome-ignore lint/nursery/noImgElement: static brand SVG, no optimization needed */}
                      <img alt="Shopify" src="/assets/platforms/shopify.svg" />
                    </span>
                  </div>
                </div>
              </div>
            </article>
            <article
              className="listing-flow-card listing-flow-bulk"
              data-emphasis={shot === 1 ? 'on' : 'off'}
            >
              <h3>Bulk</h3>
              <p>A whole pile, priced and listed in one pass.</p>
              <div className="listing-flow">
                <UploadedPhoto
                  count="1 uploaded photo"
                  position="50% 45%"
                  src="/assets/landing/scan-shelf.jpg"
                />
                <Arrow />
                <div className="bulk-cart">
                  <div className="cart-heading">
                    <strong>Cart</strong>
                    <span>28 Items</span>
                  </div>
                  {CART_ROWS.map((row) => (
                    <div className="cart-row" key={row.title}>
                      <strong>{row.title}</strong>
                      <b>{row.price}</b>
                    </div>
                  ))}
                  <div className="cart-foot">
                    <div className="cart-subtotal">
                      <span>Subtotal</span>
                      <b>$1919</b>
                    </div>
                    <button type="button">List all</button>
                  </div>
                </div>
              </div>
            </article>
          </div>
          <div className="single-bulk-visual">
            <ConveyorShowcase phase={1} />
          </div>
        </div>
        <div className="single-bulk-dots">
          <button
            aria-label="Show the single item shot"
            aria-pressed={shot === 0}
            className={shot === 0 ? 'is-active' : undefined}
            onClick={() => goTo(0)}
            type="button"
          />
          <button
            aria-label="Show the bulk shot"
            aria-pressed={shot === 1}
            className={shot === 1 ? 'is-active' : undefined}
            onClick={() => goTo(1)}
            type="button"
          />
        </div>
      </div>
    </section>
  );
}
