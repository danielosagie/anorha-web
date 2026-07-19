'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import type { DependencyList, RefObject } from 'react';

type GsapScrollTools = {
  gsap: typeof gsap;
  ScrollTrigger: typeof ScrollTrigger;
};

type UseGsapScrollOptions = {
  dependencies?: DependencyList;
  disabled?: boolean;
  revertOnUpdate?: boolean;
  scope?: RefObject<Element | null>;
};

type GsapScrollSetup = (tools: GsapScrollTools) => void;

const EMPTY_DEPENDENCIES: DependencyList = [];
let hasRegisteredPlugins = false;

const registerPlugins = () => {
  if (typeof window === 'undefined' || hasRegisteredPlugins) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger, useGSAP);
  hasRegisteredPlugins = true;
};

export function useGsapScroll(
  setup: GsapScrollSetup,
  {
    dependencies = EMPTY_DEPENDENCIES,
    disabled = false,
    revertOnUpdate = true,
    scope,
  }: UseGsapScrollOptions = {}
) {
  registerPlugins();

  useGSAP(
    () => {
      if (disabled || !hasRegisteredPlugins) {
        return;
      }

      const media = gsap.matchMedia();
      media.add('(prefers-reduced-motion: no-preference)', () => {
        setup({ gsap, ScrollTrigger });
      });

      return () => media.revert();
    },
    { dependencies: [...dependencies], revertOnUpdate, scope }
  );
}
