'use client';

import Image from 'next/image';

type SourcePaneProps = {
  imageSrc: string;
  laneDragEnabled: boolean;
};

export const SourcePane = ({ imageSrc, laneDragEnabled }: SourcePaneProps) => {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Source</p>
        {laneDragEnabled ? <p className="text-xs text-zinc-500">Drag image into lanes</p> : null}
      </div>

      <div className="relative overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900">
        <div
          draggable={laneDragEnabled}
          onDragStart={(event) => {
            if (!laneDragEnabled) return;
            event.dataTransfer.setData('application/x-demo-source', 'thumbnail');
          }}
          className={laneDragEnabled ? 'cursor-grab active:cursor-grabbing' : ''}
        >
          <Image
            src={imageSrc}
            alt="Demo source"
            width={1280}
            height={720}
            className="h-[170px] w-full object-cover opacity-90"
          />
        </div>

        <div className="absolute left-3 top-3 rounded-md border border-white/15 bg-black/50 px-2 py-1 text-[11px] text-zinc-200">
          Static image + live overlay mode
        </div>

        <div className="absolute bottom-3 left-3 right-3 grid grid-cols-2 gap-2 text-[10px] text-zinc-100 sm:grid-cols-4">
          <div className="rounded bg-black/60 px-2 py-1">Brand: Nike</div>
          <div className="rounded bg-black/60 px-2 py-1">Category: Sneaker</div>
          <div className="rounded bg-black/60 px-2 py-1">Condition: Used</div>
          <div className="rounded bg-black/60 px-2 py-1">Color: White/Grey</div>
        </div>
      </div>
    </div>
  );
};
