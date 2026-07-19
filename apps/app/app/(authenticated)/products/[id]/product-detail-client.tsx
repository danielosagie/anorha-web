'use client';

import { useAuth } from '@clerk/nextjs';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Button } from '@repo/design-system/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
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
import { Separator } from '@repo/design-system/components/ui/separator';
import { Spinner } from '@repo/design-system/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/design-system/components/ui/table';
import { Textarea } from '@repo/design-system/components/ui/textarea';
import {
  ArrowLeftIcon,
  CheckIcon,
  ImageIcon,
  PackageIcon,
  SendIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';
import {
  type InventoryLevel,
  type PlatformConnection,
  type ProductDetailData,
  type ProductVariant,
  type PublishResponse,
  apiUrl,
  platformKey,
  platformLabel,
  readError,
} from '../contract';

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like new' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

const PUBLISHABLE_PLATFORMS = new Set([
  'shopify',
  'square',
  'ebay',
  'facebook',
]);

type SaveState = 'saved' | 'dirty' | 'saving' | 'error';
type RowState = 'idle' | 'saving' | 'saved' | 'error';
type ChannelState = 'idle' | 'publishing' | 'published' | 'error';

function initialProductVariant(product: ProductDetailData) {
  const variant =
    product.variants.find((item) => item.id === product.activeVariantId) ||
    product.variants[0];
  if (!variant) {
    throw new Error('Product has no variants');
  }
  return variant;
}

function money(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

function SaveStatus({ state }: { state: SaveState }) {
  if (state === 'saving') {
    return (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground text-xs">
        <Spinner className="size-3" />
        Saving
      </span>
    );
  }
  if (state === 'error') {
    return <span className="text-destructive text-xs">Not saved</span>;
  }
  if (state === 'dirty') {
    return <span className="text-muted-foreground text-xs">Unsaved</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
      <CheckIcon className="size-3" />
      Saved
    </span>
  );
}

function RowSaveStatus({ state }: { state: RowState }) {
  if (state === 'idle') {
    return null;
  }
  let label = 'Retry';
  if (state === 'saving') {
    label = 'Saving';
  } else if (state === 'saved') {
    label = 'Saved';
  }
  return (
    <span
      className={
        state === 'error'
          ? 'text-destructive text-xs'
          : 'text-muted-foreground text-xs'
      }
    >
      {label}
    </span>
  );
}

function PriceInput({
  variant,
  state,
  onSave,
}: {
  variant: ProductVariant;
  state: RowState;
  onSave: (variant: ProductVariant, price: number) => Promise<void>;
}) {
  const [draft, setDraft] = React.useState(String(variant.price));

  React.useEffect(() => setDraft(String(variant.price)), [variant.price]);

  const commit = async () => {
    const price = Number(draft);
    if (!Number.isFinite(price) || price < 0) {
      setDraft(String(variant.price));
      return;
    }
    if (price === variant.price) {
      return;
    }
    await onSave(variant, price);
  };

  return (
    <div className="flex min-w-28 flex-col gap-1">
      <Input
        aria-label={`Price for ${variant.title}`}
        disabled={state === 'saving'}
        min={0}
        onBlur={commit}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur();
          }
          if (event.key === 'Escape') {
            setDraft(String(variant.price));
            event.currentTarget.blur();
          }
        }}
        step="0.01"
        type="number"
        value={draft}
      />
      <RowSaveStatus state={state} />
    </div>
  );
}

function StockInput({
  level,
  state,
  onSave,
}: {
  level: InventoryLevel;
  state: RowState;
  onSave: (level: InventoryLevel, quantity: number) => Promise<void>;
}) {
  const [draft, setDraft] = React.useState(String(level.quantity));
  const canEdit = Boolean(level.connectionId && level.locationId);

  React.useEffect(() => setDraft(String(level.quantity)), [level.quantity]);

  const commit = async () => {
    const quantity = Number(draft);
    if (!Number.isInteger(quantity) || quantity < 0) {
      setDraft(String(level.quantity));
      return;
    }
    if (quantity === level.quantity) {
      return;
    }
    await onSave(level, quantity);
  };

  return (
    <div className="flex min-w-32 flex-col gap-1">
      <Label className="text-muted-foreground text-xs">
        {level.locationName}
      </Label>
      <Input
        aria-label={`${level.locationName} quantity`}
        disabled={!canEdit || state === 'saving'}
        min={0}
        onBlur={commit}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur();
          }
          if (event.key === 'Escape') {
            setDraft(String(level.quantity));
            event.currentTarget.blur();
          }
        }}
        step={1}
        type="number"
        value={draft}
      />
      {canEdit ? (
        <RowSaveStatus state={state} />
      ) : (
        <span className="text-muted-foreground text-xs">Read only</span>
      )}
    </div>
  );
}

function channelBadge(
  connection: PlatformConnection,
  mapped: boolean,
  syncError: string | null,
  state: ChannelState
) {
  if (state === 'publishing') {
    return <Badge variant="secondary">Publishing</Badge>;
  }
  if (state === 'error' || syncError) {
    return <Badge variant="destructive">Issue</Badge>;
  }
  if (state === 'published' || mapped) {
    return <Badge>Live</Badge>;
  }
  if (!connection.isEnabled) {
    return <Badge variant="outline">Paused</Badge>;
  }
  return <Badge variant="secondary">Ready</Badge>;
}

export function ProductDetailClient({
  product,
}: { product: ProductDetailData }) {
  const { getToken } = useAuth();
  const router = useRouter();
  const initialVariant = initialProductVariant(product);

  const [variants, setVariants] = React.useState(product.variants);
  const [inventory, setInventory] = React.useState(product.inventory);
  const [title, setTitle] = React.useState(initialVariant.title);
  const [description, setDescription] = React.useState(
    initialVariant.description
  );
  const [price, setPrice] = React.useState(String(initialVariant.price));
  const [condition, setCondition] = React.useState(initialVariant.condition);
  const [saveState, setSaveState] = React.useState<SaveState>('saved');
  const [selectedImage, setSelectedImage] = React.useState(0);
  const [rowStates, setRowStates] = React.useState<Record<string, RowState>>(
    {}
  );
  const [channelStates, setChannelStates] = React.useState<
    Record<string, ChannelState>
  >({});
  const [channelErrors, setChannelErrors] = React.useState<
    Record<string, string>
  >({});
  const editVersion = React.useRef(0);

  const activeVariant =
    variants.find((variant) => variant.id === product.activeVariantId) ||
    initialVariant;
  const activeImages = product.images.length > 0 ? product.images : [];
  const mainImage = activeImages[selectedImage] || activeImages[0];

  const fetchApi = React.useCallback(
    async (path: string, init: RequestInit) => {
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
      return body;
    },
    [getToken]
  );

  const platformDetails = React.useCallback(() => {
    const canonical = {
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      sku:
        activeVariant.sku ||
        `INV-${activeVariant.id.slice(0, 8).toUpperCase()}`,
      condition,
    };
    const details: Record<string, unknown> = { canonical };
    for (const mapping of product.mappings) {
      const connection = product.connections.find(
        (item) => item.id === mapping.connectionId
      );
      if (!connection) {
        continue;
      }
      const key = platformKey(connection.platformType);
      details[key] = mapping.platformData;
    }
    return details;
  }, [
    activeVariant.id,
    activeVariant.sku,
    condition,
    description,
    price,
    product.connections,
    product.mappings,
    title,
  ]);

  const saveCanonical = React.useCallback(
    async (version: number) => {
      const parsedPrice = Number(price);
      if (!title.trim() || !Number.isFinite(parsedPrice) || parsedPrice < 0) {
        setSaveState('error');
        return false;
      }
      setSaveState('saving');
      try {
        await fetchApi('/api/products/publish', {
          method: 'POST',
          body: JSON.stringify({
            productId: product.productId,
            variantId: product.activeVariantId,
            publishIntent: 'SAVE_TO_INVENTORY',
            platformDetails: platformDetails(),
            media: {
              imageUris: product.images.map((image) => image.url),
              coverImageIndex: 0,
            },
            selectedPlatformsToPublish: [],
          }),
        });
        if (editVersion.current === version) {
          setSaveState('saved');
        }
        setVariants((current) =>
          current.map((variant) =>
            variant.id === product.activeVariantId
              ? {
                  ...variant,
                  title: title.trim(),
                  description: description.trim(),
                  price: parsedPrice,
                  condition,
                }
              : variant
          )
        );
        return true;
      } catch {
        if (editVersion.current === version) {
          setSaveState('error');
        }
        return false;
      }
    },
    [
      condition,
      description,
      fetchApi,
      platformDetails,
      price,
      product.activeVariantId,
      product.images,
      product.productId,
      title,
    ]
  );

  React.useEffect(() => {
    if (saveState !== 'dirty') {
      return;
    }
    const version = editVersion.current;
    const timeout = window.setTimeout(async () => {
      await saveCanonical(version);
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [saveCanonical, saveState]);

  const markDirty = () => {
    editVersion.current += 1;
    setSaveState('dirty');
  };

  const saveVariantPrice = React.useCallback(
    async (variant: ProductVariant, nextPrice: number) => {
      setRowStates((current) => ({ ...current, [variant.id]: 'saving' }));
      try {
        await fetchApi(`/api/products/${variant.id}`, {
          method: 'PUT',
          body: JSON.stringify({ Price: nextPrice }),
        });
        setVariants((current) =>
          current.map((item) =>
            item.id === variant.id ? { ...item, price: nextPrice } : item
          )
        );
        if (variant.id === product.activeVariantId) {
          setPrice(String(nextPrice));
        }
        setRowStates((current) => ({ ...current, [variant.id]: 'saved' }));
      } catch {
        setRowStates((current) => ({ ...current, [variant.id]: 'error' }));
      }
    },
    [fetchApi, product.activeVariantId]
  );

  const saveStock = React.useCallback(
    async (level: InventoryLevel, quantity: number) => {
      if (!level.connectionId || !level.locationId) {
        return;
      }
      setRowStates((current) => ({ ...current, [level.id]: 'saving' }));
      try {
        await fetchApi(`/api/products/${level.variantId}/inventory`, {
          method: 'PUT',
          body: JSON.stringify({
            updates: [
              {
                platformConnectionId: level.connectionId,
                locationId: level.locationId,
                locationName: level.locationName,
                quantity,
              },
            ],
          }),
        });
        setInventory((current) =>
          current.map((item) =>
            item.id === level.id ? { ...item, quantity } : item
          )
        );
        setRowStates((current) => ({ ...current, [level.id]: 'saved' }));
      } catch {
        setRowStates((current) => ({ ...current, [level.id]: 'error' }));
      }
    },
    [fetchApi]
  );

  const publish = React.useCallback(
    async (connection: PlatformConnection) => {
      const key = platformKey(connection.platformType);
      setChannelStates((current) => ({
        ...current,
        [connection.id]: 'publishing',
      }));
      setChannelErrors((current) => ({ ...current, [connection.id]: '' }));
      try {
        const body = (await fetchApi('/api/products/publish', {
          method: 'POST',
          body: JSON.stringify({
            productId: product.productId,
            variantId: product.activeVariantId,
            publishIntent: 'PUBLISH_PLATFORM_LIVE',
            platformDetails: platformDetails(),
            media: {
              imageUris: product.images.map((image) => image.url),
              coverImageIndex: 0,
            },
            selectedPlatformsToPublish: [key],
            connectionIds: { [key]: [connection.id] },
          }),
        })) as PublishResponse;
        const result = body.results?.find(
          (item) => item.connectionId === connection.id
        );
        if (!result?.success) {
          throw new Error(result?.error || 'Publish failed');
        }
        setChannelStates((current) => ({
          ...current,
          [connection.id]: 'published',
        }));
        router.refresh();
      } catch (error) {
        setChannelStates((current) => ({
          ...current,
          [connection.id]: 'error',
        }));
        setChannelErrors((current) => ({
          ...current,
          [connection.id]:
            error instanceof Error ? error.message : 'Publish failed',
        }));
      }
    },
    [
      fetchApi,
      platformDetails,
      product.activeVariantId,
      product.images,
      product.productId,
      router,
    ]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild size="sm" variant="ghost">
          <Link href="/inventory">
            <ArrowLeftIcon data-icon="inline-start" />
            Inventory
          </Link>
        </Button>
        <SaveStatus state={saveState} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(24rem,1.2fr)]">
        <Card className="overflow-hidden py-0 shadow-none">
          <CardContent className="flex flex-col gap-3 p-3">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
              {mainImage ? (
                <Image
                  alt={mainImage.alt}
                  className="object-contain"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  src={mainImage.url}
                  unoptimized
                />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  <ImageIcon className="size-8" />
                </div>
              )}
            </div>
            {activeImages.length > 1 ? (
              <div className="grid grid-cols-5 gap-2">
                {activeImages.map((image, index) => (
                  <button
                    aria-label={`View photo ${index + 1}`}
                    className="relative aspect-square overflow-hidden rounded-md border bg-muted outline-none transition-colors hover:border-foreground/35 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 data-[active=true]:border-primary"
                    data-active={selectedImage === index}
                    key={image.id}
                    onClick={() => setSelectedImage(index)}
                    type="button"
                  >
                    <Image
                      alt=""
                      className="object-cover"
                      fill
                      sizes="96px"
                      src={image.url}
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Changes save automatically.</CardDescription>
            <CardAction>
              <SaveStatus state={saveState} />
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="product-title">Title</Label>
              <Input
                id="product-title"
                onChange={(event) => {
                  setTitle(event.target.value);
                  markDirty();
                }}
                value={title}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                className="min-h-36 resize-y"
                id="product-description"
                onChange={(event) => {
                  setDescription(event.target.value);
                  markDirty();
                }}
                value={description}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="product-price">Price</Label>
                <Input
                  id="product-price"
                  min={0}
                  onChange={(event) => {
                    setPrice(event.target.value);
                    markDirty();
                  }}
                  step="0.01"
                  type="number"
                  value={price}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="product-condition">Condition</Label>
                <Select
                  onValueChange={(value) => {
                    setCondition(value);
                    markDirty();
                  }}
                  value={condition}
                >
                  <SelectTrigger className="w-full" id="product-condition">
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
        </Card>
      </div>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Variants</CardTitle>
          <CardDescription>Price and stock by option.</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Variant</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="pr-6">Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((variant) => {
                  const levels = inventory.filter(
                    (level) => level.variantId === variant.id
                  );
                  return (
                    <TableRow key={variant.id}>
                      <TableCell className="min-w-52 pl-6 font-medium">
                        <div className="flex items-center gap-2">
                          <PackageIcon className="size-4 text-muted-foreground" />
                          <span>{variant.title}</span>
                          {variant.id === product.activeVariantId ? (
                            <Badge variant="outline">Current</Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {variant.sku || 'None'}
                      </TableCell>
                      <TableCell>
                        <PriceInput
                          onSave={saveVariantPrice}
                          state={rowStates[variant.id] || 'idle'}
                          variant={variant}
                        />
                      </TableCell>
                      <TableCell className="pr-6">
                        {levels.length > 0 ? (
                          <div className="flex flex-wrap gap-3">
                            {levels.map((level) => (
                              <StockInput
                                key={level.id}
                                level={level}
                                onSave={saveStock}
                                state={rowStates[level.id] || 'idle'}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            0
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Channels</CardTitle>
          <CardDescription>Publish to connected shops.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-0">
          {product.connections.length === 0 ? (
            <div className="flex min-h-28 items-center justify-center text-muted-foreground text-sm">
              No connections
            </div>
          ) : (
            product.connections.map((connection, index) => {
              const mappings = product.mappings.filter(
                (mapping) => mapping.connectionId === connection.id
              );
              const mapped = mappings.some(
                (mapping) => mapping.isEnabled && mapping.platformProductId
              );
              const syncError =
                mappings.find((mapping) => mapping.syncError)?.syncError ||
                null;
              const state = channelStates[connection.id] || 'idle';
              const key = platformKey(connection.platformType);
              const canPublish =
                connection.isEnabled && PUBLISHABLE_PLATFORMS.has(key);

              return (
                <React.Fragment key={connection.id}>
                  {index > 0 ? <Separator /> : null}
                  <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted font-semibold text-sm">
                        {platformLabel(key).slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold text-sm">
                            {connection.displayName}
                          </p>
                          {channelBadge(connection, mapped, syncError, state)}
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {channelErrors[connection.id] ||
                            platformLabel(connection.platformType)}
                        </p>
                      </div>
                    </div>
                    {canPublish ? (
                      <Button
                        disabled={state === 'publishing'}
                        onClick={() => publish(connection)}
                        size="sm"
                        variant={mapped ? 'outline' : 'default'}
                      >
                        {state === 'publishing' ? (
                          <Spinner data-icon="inline-start" />
                        ) : (
                          <SendIcon data-icon="inline-start" />
                        )}
                        Publish
                      </Button>
                    ) : null}
                  </div>
                </React.Fragment>
              );
            })
          )}
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-xs">
        Active price: {money(Number(price) || 0)}
      </p>
    </div>
  );
}
