'use client';

import { motion } from 'framer-motion';
import type { DemoStage, StageDropAction } from './types';

type StageRailProps = {
  currentStage: DemoStage;
  progress: number;
  laneDragEnabled: boolean;
  onLaneDrop: (action: StageDropAction) => void;
};

const STAGES: Array<{ key: DemoStage; label: string; helper: string }> = [
  { key: 'analyze', label: 'Analyze', helper: 'Parse image signals' },
  { key: 'match', label: 'Match', helper: 'Score candidates' },
  { key: 'generate', label: 'Generate', helper: 'Build listing output' },
];

export const StageRail = ({ currentStage, progress, laneDragEnabled, onLaneDrop }: StageRailProps) => {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Stage Pipeline</p>
        <p className="text-xs font-semibold text-lime-300">{progress}%</p>
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        {STAGES.map((stage) => {
          const isActive = currentStage === stage.key;

          return (
            <div
              key={stage.key}
              className={`relative rounded-xl border p-3 transition-colors ${
                isActive
                  ? 'border-lime-400/70 bg-lime-400/10'
                  : 'border-zinc-700 bg-zinc-900/80'
              }`}
              onDragOver={(event) => {
                if (!laneDragEnabled) return;
                event.preventDefault();
              }}
              onDrop={(event) => {
                if (!laneDragEnabled) return;
                const dragType = event.dataTransfer.getData('application/x-demo-source');
                if (!dragType) return;
                onLaneDrop({
                  stage: stage.key,
                  source: 'lane-drop',
                });
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">{stage.label}</p>
                {isActive ? (
                  <motion.span
                    layoutId="active-dot"
                    className="h-2.5 w-2.5 rounded-full bg-lime-300"
                  />
                ) : null}
              </div>
              <p className="mt-1 text-xs text-zinc-400">{stage.helper}</p>
              {laneDragEnabled ? (
                <p className="mt-2 text-[10px] uppercase tracking-wide text-zinc-500">Drop source here</p>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-900">
        <motion.div
          className="h-full bg-gradient-to-r from-lime-500 to-emerald-300"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};
