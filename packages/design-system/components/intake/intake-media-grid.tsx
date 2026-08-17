'use client';

import { AspectRatio } from '@repo/design-system/components/ui/aspect-ratio';
import { cn } from '@repo/design-system/lib/utils';
import { ImageIcon, VideoIcon } from 'lucide-react';
import type { SignedIntakeMedia } from './types';

export function mediaFailureMessage(code: string | null): string {
  const messages: Record<string, string> = {
    INTAKE_MEDIA_MISSING: 'Photo was not received.',
    INTAKE_MEDIA_SIZE_MISMATCH: 'Photo size did not match.',
    INTAKE_IMAGE_TOO_LARGE: 'Photo is too large.',
    INTAKE_MEDIA_TYPE_MISMATCH: 'Photo type did not match.',
    INTAKE_MEDIA_READ_FAILED: 'Photo could not be checked.',
    INTAKE_MEDIA_MAGIC_UNSUPPORTED: 'Photo type is not supported.',
    INTAKE_MEDIA_MAGIC_MISMATCH: 'Photo type did not match.',
    INTAKE_IMAGE_DIMENSIONS_MISSING: 'Photo dimensions were missing.',
    INTAKE_IMAGE_MALFORMED: 'Photo could not be read.',
  };
  return code
    ? (messages[code] ?? 'Photo was rejected.')
    : 'Photo unavailable.';
}

export function IntakeMediaGrid({
  media,
  onSelect,
  selectedId,
}: {
  media: SignedIntakeMedia[];
  onSelect?: (mediaId: string) => void;
  selectedId?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {media.map((item) => (
        <button
          aria-label={`Open ${item.kind}`}
          className={cn(
            'overflow-hidden rounded-xl border bg-muted text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
            selectedId === item.id ? 'border-k0-ink' : 'border-border'
          )}
          key={item.id}
          onClick={() => onSelect?.(item.id)}
          type="button"
        >
          <AspectRatio ratio={4 / 3}>
            {item.status === 'ready' && item.url ? (
              item.kind === 'video' ? (
                <video
                  aria-label="Video preview"
                  className="size-full object-cover"
                  muted
                  poster={item.posterUrl ?? undefined}
                  preload="metadata"
                  src={item.url}
                />
              ) : (
                /* biome-ignore lint/nursery/noImgElement: Signed private media must load directly. */
                <img
                  alt="Submitted item"
                  className="size-full object-cover"
                  src={item.url}
                />
              )
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-2 p-3 text-center text-muted-foreground text-xs">
                {item.kind === 'video' ? (
                  <VideoIcon aria-hidden className="size-5" />
                ) : (
                  <ImageIcon aria-hidden className="size-5" />
                )}
                <span>
                  {item.status === 'rejected'
                    ? mediaFailureMessage(item.failureCode)
                    : 'Checking'}
                </span>
              </div>
            )}
          </AspectRatio>
        </button>
      ))}
    </div>
  );
}
