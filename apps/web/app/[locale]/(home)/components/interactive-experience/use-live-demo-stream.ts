'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DemoCandidate, LiveSnapshot } from './types';

type DemoJobType = 'match' | 'generate' | 'regenerate';

type DemoSession = {
  jobId: string;
  jobType: DemoJobType;
};

const pollIntervalMs = 3200;

const normalizeLiveSnapshot = (payload: any): LiveSnapshot => ({
  status: payload?.status,
  currentStage: payload?.currentStage,
  progress: payload?.progress?.stagePercentage ?? payload?.progress,
  results: Array.isArray(payload?.results)
    ? payload.results.map((result: any) => ({
        title: result?.title || result?.matchedTitle || result?.name,
        confidence: result?.confidence,
      }))
    : [],
  error: payload?.error,
});

const parseUrlSession = (): DemoSession | null => {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const jobId = params.get('demoJobId');
  const requestedType = params.get('demoJobType') as DemoJobType | null;
  if (!jobId) return null;

  if (requestedType === 'match' || requestedType === 'generate' || requestedType === 'regenerate') {
    return { jobId, jobType: requestedType };
  }

  return { jobId, jobType: 'match' };
};

const endpointFor = (baseUrl: string, session: DemoSession): string => {
  const root = baseUrl.replace(/\/+$/, '');
  if (session.jobType === 'match') return `${root}/api/products/match/jobs/${encodeURIComponent(session.jobId)}/status`;
  if (session.jobType === 'generate') return `${root}/api/products/generate/jobs/${encodeURIComponent(session.jobId)}/status`;
  return `${root}/api/products/regenerate/status/${encodeURIComponent(session.jobId)}`;
};

const captureAnalytics = (eventName: string, properties: Record<string, unknown>) => {
  if (typeof window === 'undefined') return;
  const posthog = (window as any)?.posthog;
  if (posthog?.capture) {
    posthog.capture(eventName, properties);
    return;
  }
  window.dispatchEvent(new CustomEvent('demo:analytics', { detail: { eventName, properties } }));
};

export const startDemoSession = async (): Promise<DemoSession | null> => {
  const baseUrl = process.env.NEXT_PUBLIC_SSSYNC_API_BASE_URL || '';
  try {
    const response = await fetch(`${baseUrl}/api/demo/start-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'web_home_demo' }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data?.jobId || !data?.jobType) return null;

    return {
      jobId: String(data.jobId),
      jobType: data.jobType,
    };
  } catch {
    return null;
  }
};

export const submitCandidateOrder = async (jobId: string, rankedCandidates: DemoCandidate[]) => {
  if (!jobId) return;

  const orderedCandidateIds = rankedCandidates.map((candidate) => candidate.id);
  try {
    await fetch('/api/demo/candidate-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jobId, orderedCandidateIds }),
    });
  } catch {
    // No-op by design. UX should remain unaffected.
  }
};

export const subscribeDemoEvents = (
  sessionOrJobId: DemoSession,
  onSnapshot: (snapshot: LiveSnapshot) => void,
) => {
  let isDisposed = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const baseUrl = process.env.NEXT_PUBLIC_SSSYNC_API_BASE_URL || '';

  const poll = async () => {
    if (isDisposed) return;
    try {
      const response = await fetch(endpointFor(baseUrl, sessionOrJobId), {
        cache: 'no-store',
      });

      if (isDisposed) return;

      if (!response.ok) {
        onSnapshot({
          status: 'failed',
          error: `Live status request failed (${response.status})`,
        });
        return;
      }

      const payload = await response.json();
      if (isDisposed) return;
      onSnapshot(normalizeLiveSnapshot(payload));
    } catch {
      if (isDisposed) return;
      onSnapshot({
        status: 'failed',
        error: 'Network error while subscribing to live updates.',
      });
    } finally {
      if (!isDisposed) {
        timeoutId = setTimeout(poll, pollIntervalMs);
      }
    }
  };

  poll();

  return () => {
    isDisposed = true;
    if (timeoutId) clearTimeout(timeoutId);
  };
};

export const useLiveDemoStream = () => {
  const [mode, setMode] = useState<'scripted' | 'live'>('scripted');
  const [liveSnapshot, setLiveSnapshot] = useState<LiveSnapshot | null>(null);
  const [session, setSession] = useState<DemoSession | null>(null);
  const [isAttemptingLive, setIsAttemptingLive] = useState<boolean>(false);
  const hasAttemptedRef = useRef(false);

  const connectToLive = useCallback(async () => {
    if (hasAttemptedRef.current) return;
    hasAttemptedRef.current = true;
    setIsAttemptingLive(true);

    const fromUrl = parseUrlSession();
    const nextSession = fromUrl || (await startDemoSession());

    if (!nextSession) {
      setMode('scripted');
      setIsAttemptingLive(false);
      captureAnalytics('web_demo_live_unavailable', {});
      return;
    }

    setSession(nextSession);
    setMode('live');
    setIsAttemptingLive(false);
    captureAnalytics('web_demo_live_connected', {
      jobId: nextSession.jobId,
      jobType: nextSession.jobType,
    });
  }, []);

  useEffect(() => {
    if (!session) return;
    const unsubscribe = subscribeDemoEvents(session, (snapshot) => {
      if (snapshot.status === 'failed') {
        setMode('scripted');
        // Disengage live mode: clearing the session unmounts this effect and
        // triggers unsubscribe, stopping the poll loop against a failed job.
        setSession(null);
      }
      setLiveSnapshot(snapshot);
    });

    return () => {
      unsubscribe();
    };
  }, [session]);

  const api = useMemo(
    () => ({
      mode,
      liveSnapshot,
      session,
      isAttemptingLive,
      connectToLive,
    }),
    [mode, liveSnapshot, session, isAttemptingLive, connectToLive],
  );

  return api;
};
