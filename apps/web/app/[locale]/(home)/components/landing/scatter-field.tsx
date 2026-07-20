'use client';

import { useRef } from 'react';
import { useGsapScroll } from '../motion/gsap';

const pills = [
  {
    className: 'pill-marketing',
    dx: -82,
    dy: -36,
    label: 'Marketing',
    rotation: -6,
  },
  { className: 'pill-taxes', dx: 78, dy: -50, label: 'Taxes', rotation: 5 },
  {
    className: 'pill-photos pill-green',
    dx: -44,
    dy: -70,
    label: 'Photos',
    rotation: 3,
  },
  {
    className: 'pill-pricing',
    dx: 54,
    dy: -68,
    label: 'Pricing',
    rotation: -4,
  },
  { className: 'pill-team', dx: -90, dy: 46, label: 'Team', rotation: 4 },
  {
    className: 'pill-inventory pill-green',
    dx: 92,
    dy: 52,
    label: 'Inventory',
    rotation: -5,
  },
  {
    className: 'pill-messages',
    dx: -55,
    dy: 74,
    label: 'Messages',
    rotation: -3,
  },
  {
    className: 'pill-shipping',
    dx: 62,
    dy: 76,
    label: 'Shipping',
    rotation: 6,
  },
] as const;

export function ScatterField() {
  const scope = useRef<HTMLDivElement>(null);

  useGsapScroll(
    ({ gsap }) => {
      const element = scope.current;
      if (!element) {
        return;
      }

      // The scatter-and-settle only reads on the wide absolute layout. On
      // mobile the pills use a static wrapped cluster, so scope the animation
      // to desktop and let matchMedia revert it below the breakpoint.
      const mm = gsap.matchMedia();
      mm.add('(min-width: 769px)', () => {
        for (const pill of pills) {
          const target = element.querySelector(
            `.${pill.className.split(' ')[0]}`
          );
          if (!target) {
            continue;
          }

          gsap.fromTo(
            target,
            {
              rotation: pill.rotation + Math.sign(pill.rotation || 1) * 9,
              x: pill.dx,
              y: pill.dy,
            },
            {
              ease: 'none',
              rotation: pill.rotation,
              scrollTrigger: {
                end: 'center 48%',
                scrub: 0.65,
                start: 'top 90%',
                trigger: element,
              },
              x: 0,
              y: 0,
            }
          );
        }
      });
    },
    { scope }
  );

  return (
    <div className="scatter-field" ref={scope}>
      <div className="scatter-you">you</div>
      {pills.map((pill) => (
        <div className={`scatter-pill ${pill.className}`} key={pill.label}>
          {pill.label}
        </div>
      ))}
    </div>
  );
}
