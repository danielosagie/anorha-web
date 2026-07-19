'use client';

import type { ReactNode } from 'react';
import { useRef } from 'react';
import { useGsapScroll } from '../motion/gsap';

type HeroIntroProps = {
  children: ReactNode;
};

export function HeroIntro({ children }: HeroIntroProps) {
  const scope = useRef<HTMLDivElement>(null);

  useGsapScroll(
    ({ gsap }) => {
      const lines = scope.current?.querySelectorAll('[data-hero-line]');
      if (!lines?.length) {
        return;
      }

      gsap.fromTo(
        lines,
        { autoAlpha: 0, filter: 'blur(5px)', y: 30 },
        {
          autoAlpha: 1,
          duration: 0.82,
          ease: 'power4.out',
          filter: 'blur(0px)',
          stagger: 0.1,
          y: 0,
        }
      );
    },
    { scope }
  );

  return <div ref={scope}>{children}</div>;
}
