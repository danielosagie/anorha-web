'use client';

import { Reorder } from 'framer-motion';
import type { DemoCandidate } from './types';

type CandidateCardsProps = {
  candidates: DemoCandidate[];
  onChange: (next: DemoCandidate[]) => void;
  onDragStateChange: (dragging: boolean) => void;
};

const confidenceClass = (confidence: DemoCandidate['confidence']): string => {
  if (confidence === 'high') return 'text-emerald-300';
  if (confidence === 'medium') return 'text-amber-300';
  return 'text-zinc-400';
};

export const CandidateCards = ({ candidates, onChange, onDragStateChange }: CandidateCardsProps) => {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Candidate Cards</p>
        <p className="text-xs text-zinc-500">Drag to reorder</p>
      </div>

      <Reorder.Group
        axis="y"
        values={candidates}
        onReorder={onChange}
        className="space-y-2"
      >
        {candidates.map((candidate) => (
          <Reorder.Item
            key={candidate.id}
            value={candidate}
            onDragStart={() => onDragStateChange(true)}
            onDragEnd={() => onDragStateChange(false)}
            className="cursor-grab rounded-xl border border-zinc-700 bg-zinc-900/90 p-3 active:cursor-grabbing"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-600 text-xs font-semibold text-zinc-200">
                {candidate.rank}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium text-white">{candidate.title}</p>
                <div className="mt-1 flex items-center gap-3 text-xs">
                  <span className={confidenceClass(candidate.confidence)}>
                    {candidate.confidence} confidence
                  </span>
                  <span className="text-zinc-500">{candidate.source}</span>
                </div>
              </div>
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );
};
