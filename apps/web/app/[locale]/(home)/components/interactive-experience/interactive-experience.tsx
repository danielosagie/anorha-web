'use client';

import { useEffect, useRef } from 'react';
import { CandidateCards } from './candidate-cards';
import { EventLog } from './event-log';
import { SourcePane } from './source-pane';
import { StageRail } from './stage-rail';
import type { DemoCandidate } from './types';
import { useDemoStateMachine } from './use-demo-state-machine';
import { submitCandidateOrder, useLiveDemoStream } from './use-live-demo-stream';

type InteractiveExperienceProps = {
  imageSrc: string;
  laneDragEnabled: boolean;
  className?: string;
};

export const InteractiveExperience = ({
  imageSrc,
  laneDragEnabled,
  className,
}: InteractiveExperienceProps) => {
  const { mode, liveSnapshot, session, connectToLive, isAttemptingLive } = useLiveDemoStream();

  const { state, setIsDragging, onCandidatesReordered, onLaneDrop, restartScript } =
    useDemoStateMachine({ mode, liveSnapshot });

  // Holds the latest reordered candidates so we persist once on drag end
  // rather than on every onReorder tick during the gesture.
  const pendingOrderRef = useRef<DemoCandidate[] | null>(null);

  useEffect(() => {
    void connectToLive();
  }, [connectToLive]);

  const handleDragStateChange = (dragging: boolean) => {
    setIsDragging(dragging);
    if (!dragging && pendingOrderRef.current) {
      if (mode === 'live' && session?.jobId) {
        void submitCandidateOrder(session.jobId, pendingOrderRef.current);
      }
      pendingOrderRef.current = null;
    }
  };

  return (
    <section
      className={`rounded-2xl border border-zinc-700 bg-gradient-to-br from-zinc-900/95 to-zinc-950 p-4 shadow-[0_18px_55px_-28px_rgba(0,0,0,0.8)] md:p-5 ${className || ''}`}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Interactive Demo</p>
          <h3 className="text-lg font-semibold text-white">Analyze, Match, Generate</h3>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-300">
            mode: {mode}
          </span>
          {isAttemptingLive ? (
            <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-amber-200">
              connecting live...
            </span>
          ) : null}
          {session?.jobId ? (
            <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-400">
              job: {session.jobId.slice(0, 12)}
            </span>
          ) : null}
          <button
            type="button"
            onClick={restartScript}
            className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-zinc-200 transition hover:border-zinc-500"
          >
            restart
          </button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <StageRail
            currentStage={state.currentStage}
            progress={state.progress}
            laneDragEnabled={laneDragEnabled}
            onLaneDrop={onLaneDrop}
          />
          <SourcePane imageSrc={imageSrc} laneDragEnabled={laneDragEnabled} />
        </div>

        <div className="space-y-3">
          <CandidateCards
            candidates={state.candidates}
            onDragStateChange={handleDragStateChange}
            onChange={(next) => {
              onCandidatesReordered(next);
              pendingOrderRef.current = next;
            }}
          />
          <EventLog events={state.events} />
        </div>
      </div>
    </section>
  );
};
