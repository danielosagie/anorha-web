'use client';

import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@repo/design-system/components/ui/sheet';
import { LoaderCircleIcon, MinusIcon, PlusIcon } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import { toast } from 'sonner';
import type { InventoryItem, VariantLevel } from './inventory-client';
import { useVariantMutations } from './use-variant-mutations';

function formatUSD(value?: number) {
  if (value === null || value === undefined) return '$0.00';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(Number(value));
  } catch {
    return `$${Number(value).toFixed(2)}`;
  }
}

function isValidPrice(value: string) {
  if (value.trim() === '') return false;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0;
}

type RowDraft = {
  key: string;
  connectionId: string | null;
  locationId: string | null;
  locationName: string;
  connectionName: string;
  price: string;
  quantity: number;
  editable: boolean;
  origPrice?: number;
  origQuantity: number;
};

type SheetSavePatch = {
  price?: number;
  totalQuantity: number;
  levels: VariantLevel[];
};

function buildRows(item: InventoryItem): RowDraft[] {
  if (!item.levels || item.levels.length === 0) {
    // No per-location data: one fallback row bound to the canonical price.
    return [
      {
        key: 'all-channels',
        connectionId: null,
        locationId: null,
        locationName: 'All channels',
        connectionName: 'All channels',
        price: item.price === undefined ? '' : String(item.price),
        quantity: item.totalQuantity,
        editable: false,
        origPrice: item.price,
        origQuantity: item.totalQuantity,
      },
    ];
  }
  return item.levels.map((level, index) => ({
    key: `${level.connectionId ?? 'none'}:${level.locationId ?? index}`,
    connectionId: level.connectionId,
    locationId: level.locationId,
    locationName: level.locationName || 'Default',
    connectionName: level.connectionName || 'Channel',
    price: level.price === undefined ? '' : String(level.price),
    quantity: level.quantity,
    editable: Boolean(level.connectionId && level.locationId),
    origPrice: level.price,
    origQuantity: level.quantity,
  }));
}

export function PriceStockSheet({
  item,
  open,
  onOpenChange,
  onSaved,
}: {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (itemId: string, patch: SheetSavePatch) => void;
}) {
  const { saveVariantPricing } = useVariantMutations();
  const [rows, setRows] = React.useState<RowDraft[]>([]);
  const [changeAllActive, setChangeAllActive] = React.useState(false);
  const [changeAllPrice, setChangeAllPrice] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  // Reset drafts each time the sheet opens for a variant.
  React.useEffect(() => {
    if (open && item) {
      setRows(buildRows(item));
      setChangeAllActive(false);
      setChangeAllPrice(item.price === undefined ? '' : String(item.price));
    }
  }, [open, item]);

  const liveQuantity = React.useMemo(
    () => rows.reduce((total, row) => total + (row.quantity || 0), 0),
    [rows]
  );

  const groups = React.useMemo(() => {
    const map = new Map<string, { name: string; rows: RowDraft[] }>();
    rows.forEach((row) => {
      const key = row.connectionId ?? row.connectionName;
      if (!map.has(key)) {
        map.set(key, { name: row.connectionName, rows: [] });
      }
      map.get(key)!.rows.push(row);
    });
    return Array.from(map.values());
  }, [rows]);

  const updateRow = (key: string, patch: Partial<RowDraft>) => {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row))
    );
  };

  const isDirty = React.useMemo(() => {
    const canonicalDirty =
      changeAllActive &&
      isValidPrice(changeAllPrice) &&
      Number(changeAllPrice) !== item?.price;
    const rowsDirty = rows.some((row) => {
      if (!row.editable) return false;
      const effectivePrice =
        changeAllActive && isValidPrice(changeAllPrice)
          ? Number(changeAllPrice)
          : row.price.trim() === ''
            ? undefined
            : Number(row.price);
      const priceChanged =
        effectivePrice !== undefined && effectivePrice !== row.origPrice;
      const quantityChanged = row.quantity !== row.origQuantity;
      return priceChanged || quantityChanged;
    });
    return Boolean(canonicalDirty) || rowsDirty;
  }, [rows, changeAllActive, changeAllPrice, item?.price]);

  const handleSave = async () => {
    if (!item) return;

    const useChangeAll = changeAllActive && isValidPrice(changeAllPrice);
    const changeAllValue = useChangeAll ? Number(changeAllPrice) : undefined;

    const canonicalPrice =
      changeAllValue !== undefined && changeAllValue !== item.price
        ? changeAllValue
        : undefined;

    const nextLevels: VariantLevel[] = [];
    const levelUpdates: {
      connectionId: string;
      locationId: string;
      quantity?: number;
      price?: number;
    }[] = [];

    rows.forEach((row) => {
      const effectivePrice =
        changeAllValue !== undefined
          ? changeAllValue
          : row.price.trim() === ''
            ? undefined
            : Number(row.price);

      nextLevels.push({
        connectionId: row.connectionId,
        locationId: row.locationId,
        locationName: row.locationName,
        connectionName: row.connectionName,
        quantity: row.quantity,
        price: effectivePrice,
      });

      if (!row.editable || !row.connectionId || !row.locationId) return;
      const update: {
        connectionId: string;
        locationId: string;
        quantity?: number;
        price?: number;
      } = { connectionId: row.connectionId, locationId: row.locationId };
      if (
        effectivePrice !== undefined &&
        Number.isFinite(effectivePrice) &&
        effectivePrice !== row.origPrice
      ) {
        update.price = effectivePrice;
      }
      if (row.quantity !== row.origQuantity) {
        update.quantity = row.quantity;
      }
      if (update.price !== undefined || update.quantity !== undefined) {
        levelUpdates.push(update);
      }
    });

    setSaving(true);
    try {
      await saveVariantPricing({
        variantId: item.id,
        canonicalPrice,
        levelUpdates,
      });
      onSaved(item.id, {
        price: canonicalPrice ?? item.price,
        totalQuantity: liveQuantity,
        levels: item.levels && item.levels.length > 0 ? nextLevels : item.levels,
      });
      toast.success('Saved.');
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const displayPrice = item?.price;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b p-5">
          <SheetTitle className="font-semibold text-2xl">
            Price &amp; stock
          </SheetTitle>
        </SheetHeader>

        {item ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5">
            <div className="flex flex-col gap-5">
              {/* Summary card */}
              <div className="rounded-xl bg-muted p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[0.6875rem] text-muted-foreground uppercase tracking-[0.06em]">
                      Price · all channels
                    </span>
                    {changeAllActive ? (
                      <div className="relative w-40">
                        <span className="-translate-y-1/2 absolute top-1/2 left-3 text-muted-foreground text-sm">
                          $
                        </span>
                        <Input
                          autoFocus
                          type="number"
                          min={0}
                          step="0.01"
                          inputMode="decimal"
                          aria-label="Price for all channels"
                          value={changeAllPrice}
                          onChange={(event) =>
                            setChangeAllPrice(event.target.value)
                          }
                          className="h-10 rounded-lg bg-background pl-6 font-semibold text-lg tabular-nums"
                        />
                      </div>
                    ) : (
                      <span className="font-semibold text-2xl tabular-nums">
                        {formatUSD(displayPrice)}
                      </span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setChangeAllActive((active) => {
                        const next = !active;
                        if (next) {
                          setChangeAllPrice(
                            item.price === undefined ? '' : String(item.price)
                          );
                        }
                        return next;
                      });
                    }}
                    className={
                      changeAllActive
                        ? 'rounded-full border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                        : 'rounded-full'
                    }
                  >
                    Change all
                  </Button>
                </div>
                {changeAllActive ? (
                  <p className="mt-2 text-muted-foreground text-xs">
                    Applied to every location on save.
                  </p>
                ) : null}
              </div>

              {/* Inventory */}
              <div className="flex flex-col gap-3">
                <span className="text-[0.6875rem] text-muted-foreground uppercase tracking-[0.06em]">
                  Inventory
                </span>

                {/* Variant card */}
                <div className="flex items-center gap-3 rounded-xl border p-3">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      width={48}
                      height={48}
                      className="size-12 rounded-lg border object-cover"
                    />
                  ) : (
                    <div className="size-12 rounded-lg border bg-muted" />
                  )}
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-semibold text-sm">
                      {item.title}
                    </span>
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {liveQuantity} in stock
                    </span>
                  </div>
                </div>

                {/* Groups */}
                <div className="flex flex-col gap-4">
                  {groups.map((group) => (
                    <div key={group.name} className="flex flex-col gap-2">
                      <span className="text-muted-foreground text-xs">
                        {group.name}
                        {group.rows.length > 1
                          ? ` · ${group.rows.length} locations`
                          : ''}
                      </span>
                      <div className="flex flex-col gap-2">
                        {group.rows.map((row) => (
                          <div
                            key={row.key}
                            className="flex items-center justify-between gap-3"
                          >
                            <span className="min-w-0 flex-1 truncate text-sm">
                              {row.locationName}
                            </span>
                            <div className="relative w-24">
                              <span className="-translate-y-1/2 absolute top-1/2 left-2.5 text-muted-foreground text-sm">
                                $
                              </span>
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                inputMode="decimal"
                                aria-label={`Price for ${row.locationName}`}
                                disabled={
                                  changeAllActive || saving || !row.editable
                                }
                                value={
                                  changeAllActive && isValidPrice(changeAllPrice)
                                    ? changeAllPrice
                                    : row.price
                                }
                                onChange={(event) =>
                                  updateRow(row.key, {
                                    price: event.target.value,
                                  })
                                }
                                className="h-9 rounded-lg pl-6 tabular-nums"
                              />
                            </div>
                            {row.editable ? (
                              <div className="flex items-center gap-1.5">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  aria-label="Decrease quantity"
                                  disabled={saving || row.quantity <= 0}
                                  onClick={() =>
                                    updateRow(row.key, {
                                      quantity: Math.max(0, row.quantity - 1),
                                    })
                                  }
                                  className="size-8 rounded-full"
                                >
                                  <MinusIcon className="size-3.5" />
                                </Button>
                                <span className="w-8 text-center font-medium text-sm tabular-nums">
                                  {row.quantity}
                                </span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  aria-label="Increase quantity"
                                  disabled={saving}
                                  onClick={() =>
                                    updateRow(row.key, {
                                      quantity: row.quantity + 1,
                                    })
                                  }
                                  className="size-8 rounded-full"
                                >
                                  <PlusIcon className="size-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <span className="w-[5.75rem] text-right text-muted-foreground text-sm tabular-nums">
                                {row.quantity} in stock
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6">
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving || !isDirty}
                className="h-11 w-full rounded-full"
              >
                {saving ? (
                  <LoaderCircleIcon
                    className="animate-spin"
                    data-icon="inline-start"
                  />
                ) : null}
                Save
              </Button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
