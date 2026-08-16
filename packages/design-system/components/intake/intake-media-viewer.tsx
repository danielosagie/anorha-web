'use client';

import { AspectRatio } from '@repo/design-system/components/ui/aspect-ratio';
import { useState } from 'react';
import { IntakeMediaGrid, mediaFailureMessage } from './intake-media-grid';
import type { SignedIntakeMedia } from './types';

export function IntakeMediaViewer({
  media,
  onRefresh,
}: {
  media: SignedIntakeMedia[];
  onRefresh?: () => void;
}) {
  const firstReady = media.find((item) => item.status === 'ready') ?? media[0];
  const [selectedId, setSelectedId] = useState(firstReady?.id);
  const selected =
    media.find((item) => item.id === selectedId) ?? firstReady ?? null;

  if (!selected) {
    return (
      <div className="rounded-xl border bg-muted p-6 text-center text-muted-foreground text-sm">
        No media
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-2xl border bg-muted">
        <AspectRatio ratio={4 / 3}>
          {selected.status === 'ready' && selected.url ? (
            selected.kind === 'video' ? (
              <video
                className="size-full object-contain"
                controls
                onError={onRefresh}
                poster={selected.posterUrl ?? undefined}
                preload="metadata"
                src={selected.url}
              >
                <track kind="captions" />
              </video>
            ) : (
              /* biome-ignore lint/nursery/noImgElement: Signed private media must load directly. */
              <img
                alt="Submitted item"
                className="size-full object-contain"
                onError={onRefresh}
                src={selected.url}
              />
            )
          ) : (
            <div className="flex size-full items-center justify-center p-6 text-center text-muted-foreground text-sm">
              {selected.status === 'rejected'
                ? mediaFailureMessage(selected.failureCode)
                : 'Media unavailable'}
            </div>
          )}
        </AspectRatio>
      </div>
      {media.length > 1 ? (
        <IntakeMediaGrid
          media={media}
          onSelect={setSelectedId}
          selectedId={selected.id}
        />
      ) : null}
    </div>
  );
}
