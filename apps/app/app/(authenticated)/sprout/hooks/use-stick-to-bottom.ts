'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const BOTTOM_THRESHOLD = 96;

type UseStickToBottomOptions = {
  content: HTMLElement | null;
  followKey?: string;
  viewport: HTMLElement | null;
};

export function useStickToBottom({
  content,
  followKey,
  viewport,
}: UseStickToBottomOptions) {
  const followingRef = useRef(true);
  const frameRef = useRef<number | null>(null);
  const [showJumpButton, setShowJumpButton] = useState(false);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = 'auto') => {
      if (!viewport) {
        return;
      }

      followingRef.current = true;
      setShowJumpButton(false);

      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }

      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null;
        viewport.scrollTo({ top: viewport.scrollHeight, behavior });
      });
    },
    [viewport]
  );

  useEffect(() => {
    if (!viewport) {
      return;
    }

    const handleScroll = () => {
      const distanceFromBottom =
        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      const nearBottom = distanceFromBottom < BOTTOM_THRESHOLD;
      followingRef.current = nearBottom;
      setShowJumpButton(!nearBottom);
    };

    handleScroll();
    viewport.addEventListener('scroll', handleScroll, { passive: true });
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [viewport]);

  useEffect(() => {
    if (!(content && viewport)) {
      return;
    }

    const observer = new ResizeObserver(() => {
      if (followingRef.current) {
        scrollToBottom('auto');
      }
    });
    observer.observe(content);
    scrollToBottom('auto');

    return () => observer.disconnect();
  }, [content, scrollToBottom, viewport]);

  useEffect(() => {
    if (!followKey) {
      return;
    }

    scrollToBottom('smooth');
  }, [followKey, scrollToBottom]);

  useEffect(
    () => () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    },
    []
  );

  return { scrollToBottom, showJumpButton };
}
