'use client';

import { useRef } from 'react';
import { useGsapScroll } from './gsap';

const ITEMS = [
  ['Capture', 'A single photo starts the listing.'],
  ['Enrich', 'Details become structured product data.'],
  ['Publish', 'Every marketplace stays in sync.'],
] as const;

export function GsapScrollStrip() {
  const scope = useRef<HTMLDivElement>(null);

  useGsapScroll(
    ({ gsap }) => {
      gsap.from('[data-gsap-strip-item]', {
        duration: 0.7,
        ease: 'power3.out',
        opacity: 0,
        scrollTrigger: {
          once: true,
          start: 'top 82%',
          trigger: scope.current,
        },
        stagger: 0.09,
        y: 24,
      });
    },
    { scope }
  );

  return (
    <div
      className="grid w-full overflow-hidden rounded-2xl border border-black/8 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_18px_50px_-32px_rgba(0,0,0,0.24)] md:grid-cols-3"
      ref={scope}
    >
      {ITEMS.map(([title, description], index) => (
        <div
          className="relative min-h-44 border-black/8 not-last:border-b p-6 md:not-last:border-r md:not-last:border-b-0"
          data-gsap-strip-item
          key={title}
        >
          <span className="font-mono text-[var(--anorhaDarkGreen)] text-xs">
            0{index + 1}
          </span>
          <h3 className="mt-8 font-semibold text-lg text-neutral-900 tracking-tight">
            {title}
          </h3>
          <p className="mt-2 max-w-64 text-neutral-500 text-sm leading-6">
            {description}
          </p>
          <span
            aria-hidden="true"
            className="absolute top-6 right-6 h-2 w-2 rounded-full bg-[var(--anorhaGreen)]"
          />
        </div>
      ))}
    </div>
  );
}
