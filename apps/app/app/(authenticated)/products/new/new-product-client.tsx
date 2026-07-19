'use client';

import { useSupabase } from '@/lib/supabase';
import { useAuth } from '@clerk/nextjs';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@repo/design-system/components/ui/alert';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Button } from '@repo/design-system/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import { Progress } from '@repo/design-system/components/ui/progress';
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
import {
  ArrowLeftIcon,
  ImagePlusIcon,
  SparklesIcon,
  Trash2Icon,
  UploadIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';
import {
  type GenerateJobResult,
  type GenerateJobStatus,
  type GeneratedPlatformDetails,
  type PlatformConnection,
  apiUrl,
  platformKey,
  platformLabel,
  readError,
} from '../contract';

const MAX_PHOTOS = 10;
const MAX_BYTES = 10 * 1024 * 1024;
const POLL_MS = 2500;
const POLL_TIMEOUT_MS = 4 * 60 * 1000;
const SAFE_EXTENSION = /^[a-z0-9]+$/;

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like new' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

type Photo = {
  id: string;
  file: File;
  preview: string;
};

type Stage = 'photos' | 'generating' | 'review' | 'saving';

function extension(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && SAFE_EXTENSION.test(fromName)) {
    return fromName;
  }
  if (file.type === 'image/png') {
    return 'png';
  }
  if (file.type === 'image/webp') {
    return 'webp';
  }
  return 'jpg';
}

function normalizeCondition(value: unknown) {
  if (typeof value !== 'string') {
    return 'good';
  }
  const normalized = value.trim().toLowerCase().replaceAll(' ', '_');
  return CONDITIONS.some((item) => item.value === normalized)
    ? normalized
    : 'good';
}

function pickSuggestion(platforms: Record<string, GeneratedPlatformDetails>) {
  return (
    platforms.canonical ||
    platforms.shopify ||
    platforms.ebay ||
    Object.values(platforms)[0] ||
    {}
  );
}

function wait(duration: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, duration));
}

export function NewProductClient({
  connections,
  userId,
}: {
  connections: PlatformConnection[];
  userId: string;
}) {
  const { getToken } = useAuth();
  const supabase = useSupabase();
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const photosRef = React.useRef<Photo[]>([]);
  const cancelledRef = React.useRef(false);
  const [photos, setPhotos] = React.useState<Photo[]>([]);
  const [stage, setStage] = React.useState<Stage>('photos');
  const [dragging, setDragging] = React.useState(false);
  const [error, setError] = React.useState('');
  const [jobStage, setJobStage] = React.useState('Preparing');
  const [progress, setProgress] = React.useState(0);
  const [uploadedUrls, setUploadedUrls] = React.useState<string[]>([]);
  const [generatedPlatforms, setGeneratedPlatforms] = React.useState<
    Record<string, GeneratedPlatformDetails>
  >({});
  const [productId, setProductId] = React.useState('');
  const [variantId, setVariantId] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [condition, setCondition] = React.useState('good');

  photosRef.current = photos;

  React.useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
      for (const photo of photosRef.current) {
        URL.revokeObjectURL(photo.preview);
      }
    };
  }, []);

  const request = React.useCallback(
    async <T,>(path: string, init: RequestInit): Promise<T> => {
      const token = await getToken();
      if (!token) {
        throw new Error('Sign in again');
      }
      const response = await fetch(apiUrl(path), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...init.headers,
        },
      });
      const body = (await response.json().catch(() => null)) as unknown;
      if (!response.ok) {
        throw new Error(readError(body, 'Request failed'));
      }
      return body as T;
    },
    [getToken]
  );

  const addFiles = React.useCallback((files: File[]) => {
    setError('');
    const accepted = files.filter(
      (file) => file.type.startsWith('image/') && file.size <= MAX_BYTES
    );
    if (accepted.length !== files.length) {
      setError('Use images under 10 MB.');
    }
    setPhotos((current) => {
      const room = Math.max(0, MAX_PHOTOS - current.length);
      return [
        ...current,
        ...accepted.slice(0, room).map((file) => ({
          id: crypto.randomUUID(),
          file,
          preview: URL.createObjectURL(file),
        })),
      ];
    });
  }, []);

  const removePhoto = (id: string) => {
    setPhotos((current) => {
      const target = current.find((photo) => photo.id === id);
      if (target) {
        URL.revokeObjectURL(target.preview);
      }
      return current.filter((photo) => photo.id !== id);
    });
  };

  const uploadPhotos = React.useCallback(async () => {
    const urls = await Promise.all(
      photos.map(async (photo, index) => {
        const path = `${userId}/web-${Date.now()}-${index}-${photo.id}.${extension(photo.file)}`;
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(path, photo.file, {
            cacheControl: '86400',
            contentType: photo.file.type || 'image/jpeg',
            upsert: false,
          });
        if (uploadError) {
          throw uploadError;
        }
        return supabase.storage.from('product-images').getPublicUrl(path).data
          .publicUrl;
      })
    );
    return urls;
  }, [photos, supabase.storage, userId]);

  const generate = async () => {
    if (photos.length === 0) {
      setError('Add a photo.');
      return;
    }

    cancelledRef.current = false;
    setError('');
    setStage('generating');
    setProgress(5);
    setJobStage('Uploading');

    try {
      const urls = await uploadPhotos();
      if (cancelledRef.current) {
        return;
      }
      setUploadedUrls(urls);
      setProgress(12);
      setJobStage('Generating');

      const enabledPlatforms = Array.from(
        new Set(
          connections
            .filter((connection) => connection.isEnabled)
            .map((connection) => platformKey(connection.platformType))
            .filter((key) => key && key !== 'unknown')
        )
      );
      const selectedPlatforms =
        enabledPlatforms.length > 0 ? enabledPlatforms : ['shopify'];

      const submitted = await request<{ jobId: string }>(
        '/api/products/generate/jobs',
        {
          method: 'POST',
          body: JSON.stringify({
            products: [
              {
                productIndex: 0,
                productId: `web-${crypto.randomUUID()}`,
                imageUrls: urls,
                coverImageIndex: 0,
                quantity: 1,
              },
            ],
            selectedPlatforms,
            options: { useScraping: true },
          }),
        }
      );

      const startedAt = Date.now();
      let completedResult: GenerateJobResult | undefined;
      while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
        if (cancelledRef.current) {
          return;
        }
        const status = await request<GenerateJobStatus>(
          `/api/products/generate/jobs/${submitted.jobId}/status`,
          { method: 'GET' }
        );
        setJobStage(status.currentStage || 'Generating');
        setProgress(
          Math.max(12, Math.min(96, status.progress?.stagePercentage || 20))
        );
        if (status.status === 'failed' || status.status === 'cancelled') {
          throw new Error(status.error || 'Generation failed');
        }
        if (status.status === 'completed') {
          completedResult = status.results?.[0];
          if (!completedResult) {
            const results = await request<{ results: GenerateJobResult[] }>(
              `/api/products/generate/jobs/${submitted.jobId}/results`,
              { method: 'GET' }
            );
            completedResult = results.results[0];
          }
          break;
        }
        await wait(POLL_MS);
      }

      if (!completedResult) {
        throw new Error('Generation timed out');
      }
      if (completedResult.error) {
        throw new Error('Generation failed');
      }
      if (!completedResult.productId || !completedResult.variantId) {
        throw new Error('Draft was not created');
      }

      const suggestion = pickSuggestion(completedResult.platforms || {});
      const suggestedPrice = Number(suggestion.price ?? 0);
      setGeneratedPlatforms(completedResult.platforms || {});
      setProductId(completedResult.productId);
      setVariantId(completedResult.variantId);
      setTitle(
        typeof suggestion.title === 'string' ? suggestion.title : 'Untitled'
      );
      setDescription(
        typeof suggestion.description === 'string' ? suggestion.description : ''
      );
      setPrice(Number.isFinite(suggestedPrice) ? String(suggestedPrice) : '0');
      setCondition(normalizeCondition(suggestion.condition));
      setProgress(100);
      setStage('review');
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : 'Generation failed'
      );
      setStage('photos');
      setProgress(0);
    }
  };

  const save = async () => {
    const parsedPrice = Number(price);
    if (!title.trim()) {
      setError('Add a title.');
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setError('Check the price.');
      return;
    }
    if (!productId || !variantId) {
      setError('Generate details first.');
      return;
    }

    setError('');
    setStage('saving');
    try {
      const canonical = {
        title: title.trim(),
        description: description.trim(),
        price: parsedPrice,
        sku: `INV-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        condition,
        inventoryQuantity: 1,
      };
      await request('/api/products/publish', {
        method: 'POST',
        body: JSON.stringify({
          productId,
          variantId,
          publishIntent: 'SAVE_TO_INVENTORY',
          platformDetails: { ...generatedPlatforms, canonical },
          media: { imageUris: uploadedUrls, coverImageIndex: 0 },
          selectedPlatformsToPublish: [],
        }),
      });
      router.push(`/products/${variantId}`);
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Could not save'
      );
      setStage('review');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button asChild size="sm" variant="ghost">
          <Link href="/inventory">
            <ArrowLeftIcon data-icon="inline-start" />
            Inventory
          </Link>
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Could not continue</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {stage === 'photos' || stage === 'generating' ? (
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Photos</CardTitle>
            <CardDescription>Up to {MAX_PHOTOS} images.</CardDescription>
            <CardAction>
              <Badge variant="outline">
                {photos.length}/{MAX_PHOTOS}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <fieldset
              className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/35 p-6 text-center transition-colors data-[dragging=true]:border-primary data-[dragging=true]:bg-primary/10"
              data-dragging={dragging}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setDragging(false);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                addFiles(Array.from(event.dataTransfer.files));
              }}
            >
              <legend className="sr-only">Photo upload</legend>
              <div className="flex size-12 items-center justify-center rounded-full bg-background text-muted-foreground">
                <ImagePlusIcon className="size-5" />
              </div>
              <div>
                <p className="font-semibold">Drop photos</p>
                <p className="text-muted-foreground text-sm">
                  JPG, PNG, or WebP
                </p>
              </div>
              <Button
                disabled={stage === 'generating' || photos.length >= MAX_PHOTOS}
                onClick={() => inputRef.current?.click()}
                type="button"
                variant="outline"
              >
                <UploadIcon data-icon="inline-start" />
                Browse
              </Button>
              <input
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                className="sr-only"
                disabled={stage === 'generating'}
                id="product-photos"
                multiple
                onChange={(event) => {
                  addFiles(Array.from(event.target.files || []));
                  event.target.value = '';
                }}
                ref={inputRef}
                type="file"
              />
            </fieldset>

            {photos.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {photos.map((photo, index) => (
                  <div
                    className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
                    key={photo.id}
                  >
                    {/* Browser previews are local blob URLs. */}
                    <Image
                      alt={`Item view ${index + 1}`}
                      className="object-cover"
                      fill
                      sizes="(max-width: 640px) 50vw, 20vw"
                      src={photo.preview}
                      unoptimized
                    />
                    <Badge
                      className="absolute top-2 left-2"
                      variant="secondary"
                    >
                      {index === 0 ? 'Cover' : index + 1}
                    </Badge>
                    <Button
                      aria-label={`Remove photo ${index + 1}`}
                      className="absolute top-2 right-2 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
                      disabled={stage === 'generating'}
                      onClick={() => removePhoto(photo.id)}
                      size="icon"
                      type="button"
                      variant="secondary"
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}

            {stage === 'generating' ? (
              <output className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">{jobStage}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {Math.round(progress)}%
                  </span>
                </div>
                <Progress value={progress} />
              </output>
            ) : null}
          </CardContent>
          <CardFooter className="justify-end border-t">
            <Button
              disabled={photos.length === 0 || stage === 'generating'}
              onClick={generate}
            >
              {stage === 'generating' ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <SparklesIcon data-icon="inline-start" />
              )}
              Generate
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(24rem,1.2fr)]">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Photos</CardTitle>
              <CardDescription>{uploadedUrls.length} uploaded.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {photos.map((photo, index) => (
                <div
                  className="relative aspect-square overflow-hidden rounded-lg border bg-muted"
                  key={photo.id}
                >
                  <Image
                    alt={`Item view ${index + 1}`}
                    className="object-cover"
                    fill
                    sizes="(max-width: 1024px) 50vw, 20vw"
                    src={photo.preview}
                    unoptimized
                  />
                  {index === 0 ? (
                    <Badge
                      className="absolute top-2 left-2"
                      variant="secondary"
                    >
                      Cover
                    </Badge>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Details</CardTitle>
              <CardDescription>Review before saving.</CardDescription>
              <CardAction className="flex flex-wrap gap-1">
                {Object.keys(generatedPlatforms)
                  .slice(0, 3)
                  .map((key) => (
                    <Badge key={key} variant="outline">
                      {platformLabel(key)}
                    </Badge>
                  ))}
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="new-title">Title</Label>
                <Input
                  id="new-title"
                  onChange={(event) => setTitle(event.target.value)}
                  value={title}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="new-description">Description</Label>
                <Textarea
                  className="min-h-40 resize-y"
                  id="new-description"
                  onChange={(event) => setDescription(event.target.value)}
                  value={description}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="new-price">Price</Label>
                  <Input
                    id="new-price"
                    min={0}
                    onChange={(event) => setPrice(event.target.value)}
                    step="0.01"
                    type="number"
                    value={price}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="new-condition">Condition</Label>
                  <Select onValueChange={setCondition} value={condition}>
                    <SelectTrigger className="w-full" id="new-condition">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {CONDITIONS.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end border-t">
              <Button disabled={stage === 'saving'} onClick={save}>
                {stage === 'saving' ? (
                  <Spinner data-icon="inline-start" />
                ) : null}
                Save
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
