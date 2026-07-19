'use client';

import type { ReactNode } from 'react';
import { useRef } from 'react';
import { useGsapScroll } from '../motion/gsap';

type SectionRevealProps = {
  children: ReactNode;
  className?: string;
};

export function SectionReveal({ children, className }: SectionRevealProps) {
  const scope = useRef<HTMLDivElement>(null);

  useGsapScroll(
    ({ gsap }) => {
      const element = scope.current;
      if (!element) {
        return;
      }

      gsap.fromTo(
        element,
        { autoAlpha: 0, filter: 'blur(3px)', y: 28 },
        {
          autoAlpha: 1,
          duration: 0.72,
          ease: 'power4.out',
          filter: 'blur(0px)',
          scrollTrigger: {
            end: 'top 42%',
            once: true,
            start: 'top 86%',
            trigger: element,
          },
          y: 0,
        }
      );
    },
    { scope }
  );

  return (
    <div className={className} ref={scope}>
      {children}
    </div>
  );
}
