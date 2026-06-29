'use client';

import { formatDistanceToNowStrict } from 'date-fns';
import type { DemoEvent } from './types';

type EventLogProps = {
  events: DemoEvent[];
};

const toneClass = (type: DemoEvent['type']) => {
  if (type === 'error') return 'text-red-300';
  if (type === 'warning') return 'text-amber-300';
  if (type === 'success') return 'text-emerald-300';
  return 'text-zinc-300';
};

export const EventLog = ({ events }: EventLogProps) => {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
      <p className="mb-3 text-xs uppercase tracking-[0.16em] text-zinc-400">Timeline</p>
      <div className="max-h-[220px] space-y-2 overflow-auto pr-1">
        {events.map((event) => (
          <div key={event.id} className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2">
            <div className="mb-1 flex items-center justify-between gap-2 text-[11px] uppercase tracking-wide">
              <span className="text-zinc-500">{event.stage}</span>
              <span className="text-zinc-600">
                {formatDistanceToNowStrict(event.ts, { addSuffix: true })}
              </span>
            </div>
            <p className={`text-sm ${toneClass(event.type)}`}>{event.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
