'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ConveyorShowcase } from './conveyor-showcase';

/** Where inside the section's scroll each shot sits, for the dot buttons. */
const SHOT_AT = [0.12, 0.74];
/** How far down the runway Single gives way to Bulk. */
const FLIP_AT = 0.42;

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

  // Scroll is the only thing that sets the shot, on the pin and off it, so
  // every visitor sees both states without touching anything.
  const progressAt = useCallback((section: HTMLElement) => {
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const range = section.offsetHeight - vh;
    // On the pin the runway is the overhang below the viewport. Off it the
    // section is no taller than the screen, so read how far it has risen
    // through the viewport instead.
    return range > 40
      ? -rect.top / range
      : (vh * 0.8 - rect.top) / Math.max(1, rect.height);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) {
      return;
    }

    const read = () => {
      setShot(progressAt(section) > FLIP_AT ? 1 : 0);
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
  }, [progressAt]);

  // The dots are indicators first. Pressing one still works, but it scrolls to
  // where that shot lives rather than setting it, so scroll stays the one
  // source of truth and the poll never argues with a click.
  const goTo = useCallback((next: 0 | 1) => {
    const section = sectionRef.current;
    if (!section) {
      return;
    }
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const range = section.offsetHeight - vh;
    const sectionTop = window.scrollY + rect.top;
    const top =
      range > 40
        ? sectionTop + range * SHOT_AT[next]
        : sectionTop - vh * 0.8 + rect.height * SHOT_AT[next];
    window.scrollTo({ behavior: 'smooth', top: Math.max(0, top) });
  }, []);

  return (
    <section
      className={`single-bulk-section${shot === 1 ? ' is-bulk' : ' is-single'}`}
      id="product"
      ref={sectionRef}
    >
      <div className="single-bulk-pin">
        <div className="section-heading centered-heading">
          {/* One sentence throughout. Only which number carries the accent
              changes, so the heading reads the shot you are on. */}
          <h2 className="analyze-heading">
            Analyze{' '}
            <span className="analyze-count" data-active={shot === 0}>
              1
            </span>{' '}
            or{' '}
            <span className="analyze-count" data-active={shot === 1}>
              100
            </span>{' '}
            items at once
          </h2>
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
            {/* The scene swaps with the shot: tight on one item for Single,
                pulled back to every belt for Bulk. */}
            <ConveyorShowcase phase={shot} />
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
