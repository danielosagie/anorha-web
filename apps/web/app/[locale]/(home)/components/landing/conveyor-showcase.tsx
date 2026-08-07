'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

const BulkConveyor = dynamic(
  () => import('../motion/bulk-conveyor').then((module) => module.BulkConveyor),
  { loading: () => <div className="conveyor-placeholder" />, ssr: false }
);

/**
 * Holds the conveyor and passes it the shot the section is on. Mounting is
 * deferred until the stage is near the viewport so the scene is not built for
 * visitors who never scroll this far.
 */
export function ConveyorShowcase({ phase = 0 }: { phase?: 0 | 1 }) {
  const scope = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const element = scope.current;
    if (!element) {
      return;
    }

    let settled = false;
    const mount = () => {
      if (settled) {
        return;
      }
      settled = true;
      setMounted(true);
    };

    // Proximity check as a backstop: some embedded browsers and in-app web
    // views never deliver intersection callbacks, and gating solely on the
    // observer would leave a blank stage on the page forever.
    const check = () => {
      const rect = element.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (rect.top < vh + 280 && rect.bottom > -280) {
        mount();
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          mount();
        }
      },
      { rootMargin: '280px 0px' }
    );
    observer.observe(element);

    check();
    const poll = window.setInterval(() => {
      if (settled) {
        window.clearInterval(poll);
        return;
      }
      check();
    }, 400);
    window.addEventListener('scroll', check, { passive: true });

    return () => {
      observer.disconnect();
      window.clearInterval(poll);
      window.removeEventListener('scroll', check);
    };
  }, []);

  return (
    <div className="conveyor-stage" ref={scope}>
      <div className="conveyor-canvas">
        {mounted ? (
          <BulkConveyor className="conveyor-scene" phase={phase} rows={7} />
        ) : (
          <div className="conveyor-placeholder" />
        )}
      </div>
    </div>
  );
}
