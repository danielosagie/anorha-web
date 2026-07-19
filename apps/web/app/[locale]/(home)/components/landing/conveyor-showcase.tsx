'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useGsapScroll } from '../motion/gsap';

const ConveyorScene = dynamic(
  () =>
    import('../motion/conveyor-scene').then((module) => module.ConveyorScene),
  { loading: () => <div className="conveyor-placeholder" />, ssr: false }
);

export function ConveyorShowcase() {
  const scope = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [paused, setPaused] = useState(true);
  const [speed, setSpeed] = useState(0.85);

  useEffect(() => {
    const element = scope.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setMounted(true);
        }
      },
      { rootMargin: '280px 0px' }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useGsapScroll(
    ({ ScrollTrigger }) => {
      const element = scope.current;
      if (!element) {
        return;
      }

      ScrollTrigger.create({
        end: 'bottom top',
        onEnter: () => setPaused(false),
        onEnterBack: () => setPaused(false),
        onLeave: () => setPaused(true),
        onLeaveBack: () => setPaused(true),
        onUpdate: (self) => {
          const nextSpeed = Math.min(
            1.8,
            0.72 + Math.abs(self.getVelocity()) / 2400
          );
          setSpeed((current) =>
            Math.abs(current - nextSpeed) > 0.12 ? nextSpeed : current
          );
        },
        start: 'top bottom',
        trigger: element,
      });
    },
    { scope }
  );

  return (
    <div className="conveyor-stage" ref={scope}>
      <div className="conveyor-canvas">
        {mounted ? (
          <ConveyorScene
            accent="#A7C13A"
            background="#F6F7EF"
            belt="#44520F"
            className="conveyor-scene"
            paused={paused}
            speed={speed}
          />
        ) : (
          <div className="conveyor-placeholder" />
        )}
      </div>
    </div>
  );
}
