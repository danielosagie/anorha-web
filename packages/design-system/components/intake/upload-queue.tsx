'use client';

import { Button } from '@repo/design-system/components/ui/button';
import { Progress } from '@repo/design-system/components/ui/progress';
import { ImageIcon, RefreshCwIcon, Trash2Icon, VideoIcon } from 'lucide-react';
import type { UploadQueueItem } from './types';

function bytesLabel(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.ceil(bytes / 1024)} KB`;
}

function statusLabel(item: UploadQueueItem): string {
  if (item.status === 'uploading') {
    return `${bytesLabel(item.uploadedBytes)} of ${bytesLabel(item.bytes)}`;
  }
  const labels: Record<UploadQueueItem['status'], string> = {
    selected: 'Ready',
    reserved: 'Reserved',
    uploading: 'Uploading',
    uploaded: 'Uploaded',
    inspecting: 'Checking',
    ready: 'Ready',
    rejected: 'Rejected',
    failed: 'Upload failed',
  };
  return item.reason ?? labels[item.status];
}

export function UploadQueue({
  items,
  onRemove,
  onRetry,
}: {
  items: UploadQueueItem[];
  onRemove?: (clientId: string) => void;
  onRetry?: (clientId: string) => void;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div aria-live="polite" className="flex flex-col gap-3">
      {items.map((item) => (
        <div
          className="flex items-center gap-3 rounded-xl border bg-card p-3"
          key={item.clientId}
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            {item.kind === 'video' ? (
              <VideoIcon aria-hidden className="size-5" />
            ) : (
              <ImageIcon aria-hidden className="size-5" />
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate font-medium text-sm">{item.name}</p>
              <span className="shrink-0 text-muted-foreground text-xs">
                {bytesLabel(item.bytes)}
              </span>
            </div>
            <Progress aria-label="Upload progress" value={item.progress} />
            <p className="text-muted-foreground text-xs">{statusLabel(item)}</p>
          </div>
          {item.status === 'failed' && onRetry ? (
            <Button
              aria-label={`Retry ${item.name}`}
              onClick={() => onRetry(item.clientId)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <RefreshCwIcon aria-hidden />
            </Button>
          ) : null}
          {item.status === 'selected' && onRemove ? (
            <Button
              aria-label={`Remove ${item.name}`}
              onClick={() => onRemove(item.clientId)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <Trash2Icon aria-hidden />
            </Button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
