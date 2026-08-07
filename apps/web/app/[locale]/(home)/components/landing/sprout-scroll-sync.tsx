'use client';

import { useEffect } from 'react';

/**
 * Maps the sticky section to one persistent phone inside one persistent card.
 *
 * Three things move, and nothing else:
 *  - `--sprout-open` on the stage, 0 to 1 across the first slice of the pin.
 *    The card widens once on entry and then holds that width for every beat,
 *    so the beats read as one scene rather than five boxes.
 *  - the device eases up into place once, then stays put.
 *  - app screens cross-fade in place inside its clipped viewport; becoming
 *    active triggers that screen's small UI sequence and its callouts.
 *
 * The beat dots stay real buttons: pressing one scrolls the page to that
 * moment in the demo.
 */
export function SproutScrollSync() {
  useEffect(() => {
    const section = document.querySelector<HTMLElement>('.sprout-features');
    const stage = section?.querySelector<HTMLElement>('.sprout-stage');
    const phone = section?.querySelector<HTMLElement>('[data-phone]');
    if (!(section && stage && phone)) {
      return;
    }

    const screens = Array.from(
      section.querySelectorAll<HTMLElement>('[data-phone-screen]')
    );
    const copies = Array.from(
      section.querySelectorAll<HTMLElement>('[data-copy-layer]')
    );
    const dots = Array.from(
      section.querySelectorAll<HTMLButtonElement>('[data-progress-dot]')
    );
    const actions = Array.from(
      section.querySelectorAll<HTMLButtonElement>('.sprout-action')
    );

    if (screens.length === 0) {
      return;
    }

    const pinned = window.matchMedia(
      '(min-width: 901px) and (prefers-reduced-motion: no-preference)'
    );

    let frame = 0;
    let activeIndex = -1;
    let currentProgress = 0;
    let targetProgress = 0;
    let currentOpen = 0;
    let targetOpen = 0;

    const clamp = (value: number, min = 0, max = 1) =>
      Math.min(max, Math.max(min, value));

    const ease = (value: number) => {
      const clamped = clamp(value);
      return clamped * clamped * (3 - 2 * clamped);
    };

    const activateScreen = (nextIndex: number) => {
      const index = Math.round(clamp(nextIndex, 0, screens.length - 1));
      if (index === activeIndex) {
        return;
      }

      for (let item = 0; item < screens.length; item += 1) {
        const isActive = item === index;
        screens[item].classList.toggle('is-active', isActive);
        screens[item].setAttribute('aria-hidden', String(!isActive));
        copies[item]?.setAttribute('aria-hidden', String(!isActive));
        dots[item]?.classList.toggle('is-active', isActive);
        dots[item]?.setAttribute('aria-pressed', String(isActive));
      }

      stage.dataset.active = String(index);
      activeIndex = index;
    };

    const clearStyles = () => {
      stage.style.removeProperty('--sprout-open');
      phone.style.removeProperty('transform');
      for (const screen of screens) {
        screen.style.removeProperty('opacity');
        screen.style.removeProperty('transform');
        screen.style.removeProperty('visibility');
        screen.style.removeProperty('z-index');
      }
      for (const copy of copies) {
        copy.style.removeProperty('opacity');
        copy.style.removeProperty('transform');
        copy.style.removeProperty('visibility');
      }
      activateScreen(activeIndex < 0 ? 0 : activeIndex);
    };

    const measure = () => {
      const rect = section.getBoundingClientRect();
      const range = rect.height - window.innerHeight;
      targetProgress = range > 0 ? clamp(-rect.top / range) : 0;
      // The card opens while the section is still rising into view, so it is
      // already at full width by the time the pin starts and the first beat
      // reads at the same width as the four that follow it.
      targetOpen = clamp((window.innerHeight - rect.top) / window.innerHeight);
    };

    /**
     * Screens cross-fade in place. They used to slide up from below, which read
     * as a swipe gesture nobody made and drew the eye to the movement instead
     * of to the screen. Now the outgoing one settles back a hair while the
     * incoming one comes forward, and nothing travels.
     */
    const paintScreen = (
      index: number,
      baseIndex: number,
      transition: number
    ) => {
      const isCurrent = index === baseIndex;
      const isNext = index === Math.min(baseIndex + 1, screens.length - 1);
      const screen = screens[index];

      // Barely overlap the two. A straight 50/50 cross-fade ghosted, because
      // both screens are dense text: the outgoing one is gone by 0.55 and the
      // incoming one only starts at 0.45, so they coexist for a tenth of the
      // handover instead of all of it.
      let opacity = 0;
      let scale = 0.986;
      if (isCurrent) {
        opacity = clamp(1 - transition / 0.55);
        scale = 1 - transition * 0.014;
      } else if (isNext) {
        opacity = clamp((transition - 0.45) / 0.55);
        scale = 0.986 + transition * 0.014;
      }

      screen.style.transform = `translate3d(0, 0, 0) scale(${scale.toFixed(4)})`;
      screen.style.opacity = opacity.toFixed(4);
      screen.style.visibility = isCurrent || isNext ? 'visible' : 'hidden';
      screen.style.zIndex = String(index + 1);
    };

    const paintCopy = (index: number, position: number) => {
      const copy = copies[index];
      if (!copy) {
        return;
      }

      const distance = Math.abs(index - position);
      copy.style.opacity = ease(1 - distance * 2.2).toFixed(4);
      copy.style.transform = `translate3d(0, ${(
        (index - position) * 28
      ).toFixed(2)}px, 0)`;
      copy.style.visibility = distance < 0.48 ? 'visible' : 'hidden';
    };

    const paint = (progress: number) => {
      const position = progress * (screens.length - 1);
      const baseIndex = Math.min(
        screens.length - 1,
        Math.floor(position + 0.00001)
      );
      const rawPhase = position - baseIndex;
      const transition = ease((rawPhase - 0.16) / 0.68);
      const nearest = Math.round(position);
      // Card width and device lift both run off the section's entry, not the
      // pin, so the scene has fully settled by the time the first beat reads.
      const entrance = ease(currentOpen);
      const phoneY = (1 - entrance) * 64;
      const phoneScale = 0.94 + entrance * 0.06;

      stage.style.setProperty('--sprout-open', entrance.toFixed(4));
      phone.style.transform = `translate3d(0, ${phoneY.toFixed(
        2
      )}px, 0) scale(${phoneScale.toFixed(4)})`;

      for (let index = 0; index < screens.length; index += 1) {
        paintScreen(index, baseIndex, transition);
        paintCopy(index, position);
      }

      activateScreen(nearest);
    };

    const tick = () => {
      frame = 0;
      const distance = targetProgress - currentProgress;
      currentProgress =
        Math.abs(distance) < 0.0005
          ? targetProgress
          : currentProgress + distance * 0.14;

      const openDistance = targetOpen - currentOpen;
      currentOpen =
        Math.abs(openDistance) < 0.0005
          ? targetOpen
          : currentOpen + openDistance * 0.14;

      paint(currentProgress);

      if (currentProgress !== targetProgress || currentOpen !== targetOpen) {
        frame = requestAnimationFrame(tick);
      }
    };

    const queuePaint = () => {
      if (!pinned.matches) {
        if (frame) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
        clearStyles();
        return;
      }

      measure();
      if (!frame) {
        frame = requestAnimationFrame(tick);
      }
    };

    const scrollToScreen = (index: number) => {
      if (!pinned.matches) {
        activateScreen(index);
        return;
      }

      const sectionTop = window.scrollY + section.getBoundingClientRect().top;
      const range = section.offsetHeight - window.innerHeight;
      const nextTop =
        sectionTop + (range * index) / Math.max(1, screens.length - 1);
      window.scrollTo({ behavior: 'smooth', top: nextTop });
    };

    const dotHandlers = dots.map((button) => {
      const handler = () => {
        scrollToScreen(Number(button.dataset.progressDot ?? 0));
      };
      button.addEventListener('click', handler);
      return handler;
    });

    const actionHandlers = actions.map((button, index) => {
      const handler = () => {
        button.classList.add('is-confirmed');
        if (index < screens.length - 1) {
          scrollToScreen(index + 1);
        }
        window.setTimeout(() => button.classList.remove('is-confirmed'), 650);
      };
      button.addEventListener('click', handler);
      return handler;
    });

    activateScreen(0);
    queuePaint();
    window.addEventListener('scroll', queuePaint, { passive: true });
    window.addEventListener('resize', queuePaint, { passive: true });
    pinned.addEventListener('change', queuePaint);

    return () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
      clearStyles();
      window.removeEventListener('scroll', queuePaint);
      window.removeEventListener('resize', queuePaint);
      pinned.removeEventListener('change', queuePaint);
      dots.forEach((button, index) => {
        button.removeEventListener('click', dotHandlers[index]);
      });
      actions.forEach((button, index) => {
        button.removeEventListener('click', actionHandlers[index]);
      });
    };
  }, []);

  return null;
}
