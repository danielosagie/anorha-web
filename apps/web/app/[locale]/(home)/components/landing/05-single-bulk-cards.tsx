'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ConveyorShowcase } from './conveyor-showcase';

/** How long each shot holds before the section moves itself on. */
const CYCLE_MS = 5000;

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
  // Two shots of one section. The cards share a grid cell so the swap is a
  // cross-fade in place: nothing beside them moves, and the conveyor keeps
  // running through both.
  const sectionRef = useRef<HTMLElement>(null);
  const [shot, setShot] = useState<0 | 1>(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) {
      return;
    }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      return;
    }

    let timer = 0;
    const start = () => {
      if (timer) {
        return;
      }
      timer = window.setInterval(() => {
        setShot((current) => (current === 0 ? 1 : 0));
      }, CYCLE_MS);
    };
    const stop = () => {
      window.clearInterval(timer);
      timer = 0;
    };

    // Only cycles while the section is on screen: a carousel nobody is looking
    // at is a timer nobody asked for.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          start();
        } else {
          stop();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(section);

    return () => {
      observer.disconnect();
      stop();
    };
  }, []);

  const goTo = useCallback((next: 0 | 1) => {
    setShot(next);
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
