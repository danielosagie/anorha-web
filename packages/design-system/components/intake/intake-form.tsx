'use client';

import { BudgetNotice } from '@repo/design-system/components/intake/budget-notice';
import { mediaFailureMessage } from '@repo/design-system/components/intake/intake-media-grid';
import type {
  BudgetFailure,
  IntakeCondition,
  IntakeMediaKind,
  PublicIntakeLink,
  UploadQueueItem,
} from '@repo/design-system/components/intake/types';
import { UploadQueue } from '@repo/design-system/components/intake/upload-queue';
import {
  Alert,
  AlertDescription,
} from '@repo/design-system/components/ui/alert';
import { Button } from '@repo/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/design-system/components/ui/select';
import { Spinner } from '@repo/design-system/components/ui/spinner';
import { Textarea } from '@repo/design-system/components/ui/textarea';
import { CheckCircle2Icon, ImagePlusIcon } from 'lucide-react';
import { type FormEvent, useRef, useState } from 'react';

export type IntakeUploadGrant = {
  clientId: string;
  mediaId: string;
  objectPath: string;
  protocol: 'signed-standard';
  uploadUrl: string;
  headers: Record<string, string>;
  maxBytes: number;
  expiresAt: string;
};

export type IntakeReservation = {
  submissionId: string;
  finalizeToken: string;
  expiresAt: string;
  media: IntakeUploadGrant[];
};

export type IntakeFinalizeResponse = {
  submissionId: string;
  state: 'processing' | 'submitted' | 'rejected';
  media: Array<{
    id: string;
    status: UploadQueueItem['status'];
    failureCode?: string;
  }>;
};

export type IntakeFinalizePayload = {
  submissionId: string;
  finalizeToken: string;
  media: Array<{ id: string }>;
};

type Stage =
  | 'editing'
  | 'reserving'
  | 'uploading'
  | 'upload_error'
  | 'ready_to_finalize'
  | 'inspecting'
  | 'finalize_error'
  | 'submitted'
  | 'rejected';

export type IntakeReservationPayload = {
  customer: { name: string; email: string };
  description: string;
  quantity: number;
  condition: string;
  media: Array<{
    clientId: string;
    kind: IntakeMediaKind;
    declaredContentType: string;
    declaredBytes: number;
    originalName: string;
  }>;
};

export type IntakeActionResult<Data> =
  | { data: Data; failure?: never }
  | {
      failure: { budget?: BudgetFailure; message: string };
      data?: never;
    };

const conditionItems: Array<{ value: IntakeCondition; label: string }> = [
  { value: 'unknown', label: 'Not sure' },
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like new' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

function megabytes(bytes: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(
    bytes / (1024 * 1024)
  );
}

type FileValidation =
  | { kind: IntakeMediaKind; ok: true }
  | { budget?: BudgetFailure; message?: string; ok: false };

function validateFile(
  file: File,
  mediaPolicy: PublicIntakeLink['mediaPolicy']
): FileValidation {
  const kind: IntakeMediaKind = file.type.startsWith('video/')
    ? 'video'
    : 'image';
  if (!mediaPolicy.allowedTypes.includes(file.type)) {
    return {
      ok: false,
      message:
        kind === 'video'
          ? 'Video is not available yet.'
          : 'Photo type is not supported.',
    };
  }

  const maxBytes =
    kind === 'video' ? mediaPolicy.videoMaxBytes : mediaPolicy.imageMaxBytes;
  if (maxBytes === null || file.size > maxBytes) {
    return {
      ok: false,
      budget: {
        code: 'INTAKE_SUBMISSION_BYTE_LIMIT',
        budget: 'image_bytes_per_file',
        limit: maxBytes ?? mediaPolicy.imageMaxBytes,
        unit: 'bytes/file',
        ask: 'Choose a smaller file.',
        message: 'Photo is too large.',
      },
    };
  }
  return { kind, ok: true };
}

function selectedQueueItem(
  clientId: string,
  file: File,
  kind: IntakeMediaKind
): UploadQueueItem {
  return {
    clientId,
    name: file.name,
    kind,
    bytes: file.size,
    uploadedBytes: 0,
    progress: 0,
    status: 'selected',
  };
}

function reservationPayload(
  data: FormData,
  items: UploadQueueItem[],
  files: Map<string, File>
): IntakeReservationPayload {
  return {
    customer: {
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
    },
    description: String(data.get('description') ?? ''),
    quantity: Number(data.get('quantity') ?? 1),
    condition: String(data.get('condition') ?? 'unknown'),
    media: items.map((item) => ({
      clientId: item.clientId,
      kind: item.kind,
      declaredContentType: files.get(item.clientId)?.type ?? '',
      declaredBytes: item.bytes,
      originalName: item.name,
    })),
  };
}

function FormAction({
  busy,
  onFinalize,
  onReset,
  stage,
}: {
  busy: boolean;
  onFinalize: () => void;
  onReset: () => void;
  stage: Stage;
}) {
  if (stage === 'ready_to_finalize' || stage === 'finalize_error') {
    return (
      <Button onClick={onFinalize} type="button">
        Finish
      </Button>
    );
  }
  if (stage === 'rejected') {
    return (
      <Button onClick={onReset} type="button" variant="outline">
        Start again
      </Button>
    );
  }
  return (
    <Button disabled={busy || stage !== 'editing'} type="submit">
      {busy ? <Spinner className="size-4" /> : null}
      {stage === 'inspecting' ? 'Checking' : 'Send'}
    </Button>
  );
}

export function IntakeForm({
  finalizeSubmission,
  mediaPolicy,
  reserveSubmission,
}: {
  finalizeSubmission: (
    payload: IntakeFinalizePayload
  ) => Promise<IntakeActionResult<IntakeFinalizeResponse>>;
  mediaPolicy: PublicIntakeLink['mediaPolicy'];
  reserveSubmission: (
    payload: IntakeReservationPayload
  ) => Promise<IntakeActionResult<IntakeReservation>>;
}) {
  const [items, setItems] = useState<UploadQueueItem[]>([]);
  const [stage, setStage] = useState<Stage>('editing');
  const [message, setMessage] = useState<string | null>(null);
  const [budget, setBudget] = useState<BudgetFailure | null>(null);
  const filesRef = useRef(new Map<string, File>());
  const grantsRef = useRef(new Map<string, IntakeUploadGrant>());
  const reservationRef = useRef<IntakeReservation | null>(null);

  const acceptsVideo =
    mediaPolicy.videoMaxBytes !== null &&
    mediaPolicy.allowedTypes.some((type) => type.startsWith('video/'));

  const updateItem = (clientId: string, update: Partial<UploadQueueItem>) => {
    setItems((current) =>
      current.map((item) =>
        item.clientId === clientId ? { ...item, ...update } : item
      )
    );
  };

  const addFiles = (selected: FileList | null) => {
    if (!selected || stage !== 'editing') {
      return;
    }
    setBudget(null);
    setMessage(null);

    const incoming = Array.from(selected);
    const remaining = mediaPolicy.maxItems - items.length;
    if (incoming.length > remaining) {
      setBudget({
        code: 'INTAKE_MEDIA_COUNT_LIMIT',
        budget: 'media_per_submission',
        limit: mediaPolicy.maxItems,
        unit: 'files/submission',
        ask: 'Remove files.',
        message: 'Photo limit reached.',
      });
    }

    const accepted: UploadQueueItem[] = [];
    for (const file of incoming.slice(0, Math.max(remaining, 0))) {
      const validation = validateFile(file, mediaPolicy);
      if (!validation.ok) {
        setMessage(validation.message ?? null);
        setBudget(validation.budget ?? null);
        continue;
      }

      const clientId = crypto.randomUUID();
      filesRef.current.set(clientId, file);
      accepted.push(selectedQueueItem(clientId, file, validation.kind));
    }
    setItems((current) => [...current, ...accepted]);
  };

  const removeFile = (clientId: string) => {
    filesRef.current.delete(clientId);
    setItems((current) => current.filter((item) => item.clientId !== clientId));
  };

  const uploadOne = (clientId: string): Promise<boolean> => {
    const file = filesRef.current.get(clientId);
    const grant = grantsRef.current.get(clientId);
    if (!file || !grant) {
      updateItem(clientId, {
        status: 'failed',
        reason: 'Upload permission is missing.',
      });
      return Promise.resolve(false);
    }

    updateItem(clientId, {
      status: 'uploading',
      reason: undefined,
      uploadedBytes: 0,
      progress: 0,
    });

    return new Promise((resolve) => {
      const request = new XMLHttpRequest();
      request.open('PUT', grant.uploadUrl);
      for (const [name, value] of Object.entries(grant.headers)) {
        request.setRequestHeader(name, value);
      }
      request.upload.onprogress = (event) => {
        if (!event.lengthComputable) {
          return;
        }
        updateItem(clientId, {
          uploadedBytes: event.loaded,
          progress: Math.round((event.loaded / event.total) * 100),
        });
      };
      request.onerror = () => {
        updateItem(clientId, {
          status: 'failed',
          reason: 'Upload failed. Try again.',
        });
        resolve(false);
      };
      request.onload = () => {
        if (request.status >= 200 && request.status < 300) {
          updateItem(clientId, {
            status: 'uploaded',
            uploadedBytes: file.size,
            progress: 100,
          });
          resolve(true);
          return;
        }
        updateItem(clientId, {
          status: 'failed',
          reason: 'Upload failed. Try again.',
        });
        resolve(false);
      };
      request.send(file);
    });
  };

  const uploadAll = async (clientIds: string[]): Promise<boolean> => {
    const queue = [...clientIds];
    const results: boolean[] = [];
    const worker = async () => {
      while (queue.length > 0) {
        const next = queue.shift();
        if (next) {
          results.push(await uploadOne(next));
        }
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(3, queue.length) }, () => worker())
    );
    return results.every(Boolean);
  };

  const finalize = async () => {
    const reservation = reservationRef.current;
    if (!reservation) {
      setMessage('Submission permission is missing. Start again.');
      setStage('finalize_error');
      return;
    }

    setStage('inspecting');
    setMessage(null);
    setItems((current) =>
      current.map((item) => ({ ...item, status: 'inspecting' }))
    );

    let action: IntakeActionResult<IntakeFinalizeResponse>;
    try {
      action = await finalizeSubmission({
        submissionId: reservation.submissionId,
        finalizeToken: reservation.finalizeToken,
        media: reservation.media.map((item) => ({ id: item.mediaId })),
      });
    } catch {
      setMessage('Submission could not be checked. Try again.');
      setStage('finalize_error');
      return;
    }

    if (action.failure) {
      setBudget(action.failure.budget ?? null);
      setMessage(
        action.failure.budget
          ? null
          : 'Submission could not be checked. Try again.'
      );
      setStage('finalize_error');
      return;
    }

    const result = action.data;
    const grantByMediaId = new Map(
      reservation.media.map((grant) => [grant.mediaId, grant.clientId])
    );
    setItems((current) =>
      current.map((item) => {
        const resultItem = result.media.find(
          (media) => grantByMediaId.get(media.id) === item.clientId
        );
        if (!resultItem) {
          return item;
        }
        return {
          ...item,
          status: resultItem.status,
          reason:
            resultItem.status === 'rejected'
              ? mediaFailureMessage(resultItem.failureCode ?? null)
              : undefined,
        };
      })
    );
    if (result.state === 'processing') {
      setMessage('Photos are still being checked.');
      setStage('finalize_error');
      return;
    }
    setStage(result.state === 'submitted' ? 'submitted' : 'rejected');
  };

  const reserve = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (stage !== 'editing') {
      return;
    }
    if (items.length === 0) {
      setMessage('Add at least one photo.');
      return;
    }

    setStage('reserving');
    setMessage(null);
    setBudget(null);
    const data = new FormData(event.currentTarget);
    let result: IntakeActionResult<IntakeReservation>;
    try {
      result = await reserveSubmission(
        reservationPayload(data, items, filesRef.current)
      );
    } catch {
      setMessage('Submission could not start. Try again.');
      setStage('editing');
      return;
    }
    if (result.failure) {
      setBudget(result.failure.budget ?? null);
      setMessage(result.failure.budget ? null : result.failure.message);
      setStage('editing');
      return;
    }

    const reservation = result.data;
    reservationRef.current = reservation;
    grantsRef.current = new Map(
      reservation.media.map((grant) => [grant.clientId, grant])
    );
    setItems((current) =>
      current.map((item) => ({ ...item, status: 'reserved' }))
    );
    setStage('uploading');
    const uploaded = await uploadAll(items.map((item) => item.clientId));
    if (!uploaded) {
      setMessage('Some photos did not upload. Retry each photo.');
      setStage('upload_error');
      return;
    }
    setStage('ready_to_finalize');
    await finalize();
  };

  const retryFile = async (clientId: string) => {
    setMessage(null);
    const uploaded = await uploadOne(clientId);
    if (!uploaded) {
      setStage('upload_error');
      return;
    }
    const hasOtherFailure = items.some(
      (item) => item.clientId !== clientId && item.status === 'failed'
    );
    setStage(hasOtherFailure ? 'upload_error' : 'ready_to_finalize');
  };

  const reset = () => {
    filesRef.current.clear();
    grantsRef.current.clear();
    reservationRef.current = null;
    setItems([]);
    setMessage(null);
    setBudget(null);
    setStage('editing');
  };

  if (stage === 'submitted') {
    return (
      <Card>
        <CardHeader>
          <CheckCircle2Icon aria-hidden className="size-6 text-success" />
          <CardTitle>Submitted</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            The seller received your items.
          </p>
        </CardContent>
      </Card>
    );
  }

  const busy = ['reserving', 'uploading', 'inspecting'].includes(stage);

  return (
    <Card>
      <form onSubmit={reserve}>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="intake-media">
                {acceptsVideo ? 'Media' : 'Photos'}
              </Label>
              <span className="text-muted-foreground text-xs">
                {mediaPolicy.maxItems} max,{' '}
                {megabytes(mediaPolicy.imageMaxBytes)} MB each
              </span>
            </div>
            <Input
              accept={mediaPolicy.allowedTypes.join(',')}
              className="sr-only"
              disabled={stage !== 'editing'}
              id="intake-media"
              multiple
              onChange={(event) => {
                addFiles(event.target.files);
                event.target.value = '';
              }}
              type="file"
            />
            <Button asChild variant="outline">
              <label htmlFor="intake-media">
                <ImagePlusIcon aria-hidden data-icon="inline-start" />
                Add photos
              </label>
            </Button>
            <UploadQueue
              items={items}
              onRemove={removeFile}
              onRetry={retryFile}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              disabled={stage !== 'editing'}
              id="description"
              name="description"
              required
              rows={4}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                autoComplete="name"
                disabled={stage !== 'editing'}
                id="name"
                name="name"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                autoComplete="email"
                disabled={stage !== 'editing'}
                id="email"
                name="email"
                required
                type="email"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                defaultValue={1}
                disabled={stage !== 'editing'}
                id="quantity"
                min={1}
                name="quantity"
                required
                type="number"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="condition">Condition</Label>
              <Select
                defaultValue="unknown"
                disabled={stage !== 'editing'}
                name="condition"
              >
                <SelectTrigger className="w-full" id="condition">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {conditionItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {budget ? <BudgetNotice failure={budget} /> : null}
          {message ? (
            <Alert variant={stage === 'rejected' ? 'destructive' : 'default'}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}
          {stage === 'rejected' ? (
            <Alert variant="destructive">
              <AlertDescription>
                No photo passed inspection. Start again with another photo.
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
        <CardFooter className="mt-6 gap-2">
          <FormAction
            busy={busy}
            onFinalize={finalize}
            onReset={reset}
            stage={stage}
          />
        </CardFooter>
      </form>
    </Card>
  );
}
