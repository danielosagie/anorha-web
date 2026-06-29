'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  DemoCandidate,
  DemoEvent,
  DemoSessionState,
  DemoStage,
  LiveSnapshot,
  StageDropAction,
} from './types';

const SCRIPT_STAGES: Array<{
  delayMs: number;
  stage: DemoStage;
  progress: number;
  message: string;
}> = [
  { delayMs: 350, stage: 'analyze', progress: 9, message: 'Captured source image. Starting visual analysis.' },
  { delayMs: 1200, stage: 'analyze', progress: 26, message: 'Extracting title, brand and condition clues.' },
  { delayMs: 2300, stage: 'match', progress: 44, message: 'Searching product graph for closest matches.' },
  { delayMs: 3300, stage: 'match', progress: 64, message: 'Ranking candidate cards by confidence.' },
  { delayMs: 4300, stage: 'generate', progress: 81, message: 'Composing channel-ready listing details.' },
  { delayMs: 5200, stage: 'generate', progress: 100, message: 'Listing ready. You can reorder candidates or restart.' },
];

const INITIAL_CANDIDATES: DemoCandidate[] = [
  {
    id: 'cand-1',
    title: 'Nike Air Max 90 - White/Grey - Men\'s 10',
    confidence: 'high',
    source: 'mock',
    rank: 1,
  },
  {
    id: 'cand-2',
    title: 'Nike Air Max 90 Essentials - Light Smoke',
    confidence: 'medium',
    source: 'mock',
    rank: 2,
  },
  {
    id: 'cand-3',
    title: 'Air Max 90 Retro Running Sneaker (Similar)',
    confidence: 'low',
    source: 'mock',
    rank: 3,
  },
];

const createEvent = (
  stage: DemoStage,
  message: string,
  progress: number,
  type: DemoEvent['type'] = 'stage_update',
): DemoEvent => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  ts: Date.now(),
  stage,
  type,
  message,
  progress,
});

const INITIAL_EVENT: DemoEvent = {
  id: 'init',
  ts: 0,
  stage: 'analyze',
  type: 'info',
  message: 'Demo initialized in hybrid mode.',
  progress: 0,
};

const clampProgress = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
};

const normalizeStage = (value?: string): DemoStage => {
  if (!value) return 'analyze';
  const input = value.toLowerCase();
  if (input.includes('generate')) return 'generate';
  if (input.includes('match') || input.includes('rank') || input.includes('candidate')) return 'match';
  return 'analyze';
};

type UseDemoStateMachineProps = {
  mode: DemoSessionState['mode'];
  liveSnapshot?: LiveSnapshot | null;
};

export const useDemoStateMachine = ({ mode, liveSnapshot }: UseDemoStateMachineProps) => {
  const [currentStage, setCurrentStage] = useState<DemoStage>('analyze');
  const [progress, setProgress] = useState<number>(0);
  const [events, setEvents] = useState<DemoEvent[]>([INITIAL_EVENT]);
  const [candidates, setCandidates] = useState<DemoCandidate[]>(INITIAL_CANDIDATES);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const progressRef = useRef<number>(0);
  progressRef.current = progress;

  const addEvent = (event: DemoEvent) => {
    setEvents((prev) => [event, ...prev].slice(0, 20));
  };

  const runScript = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = SCRIPT_STAGES.map((step) =>
      setTimeout(() => {
        setCurrentStage(step.stage);
        setProgress(step.progress);
        addEvent(createEvent(step.stage, step.message, step.progress));
      }, step.delayMs),
    );
  };

  const restartScript = () => {
    setCurrentStage('analyze');
    setProgress(0);
    addEvent(createEvent('analyze', 'Restarted scripted timeline.', 0, 'info'));
    runScript();
  };

  useEffect(() => {
    runScript();
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (mode !== 'live' || !liveSnapshot) return;

    // Live mode takes over — stop any scripted timers from continuing to
    // overwrite stage/progress/events.
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const nextStage = normalizeStage(liveSnapshot.currentStage);
    const nextProgress = clampProgress(liveSnapshot.progress ?? progressRef.current);
    const status = String(liveSnapshot.status || 'processing').toLowerCase();

    setCurrentStage(nextStage);
    setProgress(nextProgress);

    if (Array.isArray(liveSnapshot.results) && liveSnapshot.results.length > 0) {
      const nextCandidates: DemoCandidate[] = liveSnapshot.results.slice(0, 4).map((result, index) => ({
        id: `live-${index}`,
        title: result.title || `Live Candidate ${index + 1}`,
        confidence: result.confidence || 'medium',
        source: 'live',
        rank: index + 1,
      }));
      setCandidates(nextCandidates);
    }

    if (status === 'failed' || liveSnapshot.error) {
      addEvent(createEvent(nextStage, liveSnapshot.error || 'Live stream failed. Falling back to scripted mode.', nextProgress, 'warning'));
      return;
    }

    addEvent(createEvent(nextStage, `Live update: ${status} (${nextProgress}%).`, nextProgress, 'info'));
  }, [liveSnapshot, mode]);

  const onCandidatesReordered = (ordered: DemoCandidate[]) => {
    const ranked = ordered.map((candidate, index) => ({
      ...candidate,
      rank: index + 1,
    }));
    setCandidates(ranked);
    addEvent(createEvent('match', 'Candidate ranking updated by drag-and-drop.', progress, 'candidate_update'));
  };

  const onLaneDrop = (action: StageDropAction) => {
    const floor = action.stage === 'analyze' ? 15 : action.stage === 'match' ? 50 : 80;
    const nextProgress = clampProgress(Math.max(progress, floor));
    setCurrentStage(action.stage);
    setProgress(nextProgress);
    addEvent(createEvent(action.stage, `Moved source into ${action.stage.toUpperCase()} lane.`, nextProgress, 'info'));
  };

  const state = useMemo<DemoSessionState>(
    () => ({
      mode,
      currentStage,
      progress,
      candidates,
      events,
      isDragging,
    }),
    [mode, currentStage, progress, candidates, events, isDragging],
  );

  return {
    state,
    setIsDragging,
    onCandidatesReordered,
    onLaneDrop,
    restartScript,
  };
};
