'use client';

import { useAuth } from '@clerk/nextjs';
import { Button } from '@repo/design-system/components/ui/button';
import { Checkbox } from '@repo/design-system/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/design-system/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/design-system/components/ui/dropdown-menu';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/design-system/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/design-system/components/ui/table';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@repo/design-system/components/ui/tabs';
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  DownloadIcon,
  ExternalLinkIcon,
  LoaderCircleIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { toast } from 'sonner';
import { apiUrl, readError } from '../products/contract';
import { PriceStockSheet } from './price-stock-sheet';

export type VariantLevel = {
  connectionId: string | null;
  locationId: string | null;
  locationName: string;
  connectionName?: string;
  platformType?: string;
  quantity: number;
  price?: number;
};

export type InventoryItem = {
  id: string;
  title: string;
  sku?: string;
  price?: number;
  weight?: number;
  weightUnit?: string;
  imageUrl?: string;
  totalQuantity: number;
  locationIds: string[];
  connectionIds: string[];
  platformData: Record<string, Record<string, any>>;
  levels: VariantLevel[];
  onShopify?: boolean;
  onSquare?: boolean;
  onClover?: boolean;
  onAmazon?: boolean;
  hasShopifyMapping?: boolean;
};

type Location = {
  id: string;
  name: string;
  connectionId: string | null;
  connectionName?: string;
  platformType?: string;
};

export type Connection = {
  id: string;
  displayName: string;
  platformType: string;
  isEnabled: boolean;
  status?: string | null;
};

const DEFAULT_PLATFORM_ORDER = ['square', 'shopify', 'clover', 'amazon'];
// Cells that own their own inputs / links must not trigger the row sheet.
const INTERACTIVE_CELL_KEYS = new Set(['select', 'name', 'sku', 'price']);
type PlatformField = {
  key: string;
  label: string;
  path: string;
  formatter?: (value: any) => React.ReactNode;
};

const PLATFORM_FIELD_DEFS: Record<string, PlatformField[]> = {
  shopify: [
    { key: 'title', label: 'Shopify Title', path: 'title' },
    { key: 'description', label: 'Description', path: 'description' },
    { key: 'vendor', label: 'Vendor', path: 'vendor' },
    { key: 'productType', label: 'Product Type', path: 'productType' },
    { key: 'category', label: 'Category Suggestion', path: 'productCategory' },
    { key: 'tags', label: 'Tags', path: 'tags' },
    { key: 'status', label: 'Status', path: 'status' },
    { key: 'price', label: 'Price', path: 'price', formatter: formatPrice },
    {
      key: 'compareAtPrice',
      label: 'Compare at Price',
      path: 'compareAtPrice',
      formatter: formatPrice,
    },
    { key: 'weight', label: 'Weight', path: 'weight' },
    { key: 'weightUnit', label: 'Weight Unit', path: 'weightUnit' },
    { key: 'barcode', label: 'Barcode', path: 'variants[0].barcode' },
    { key: 'sku', label: 'SKU', path: 'variants[0].sku' },
    {
      key: 'primaryImage',
      label: 'Primary Image',
      path: 'images[0].productImageURL',
    },
  ],
  square: [
    { key: 'name', label: 'Item Name', path: 'object.itemData.name' },
    {
      key: 'description',
      label: 'Description',
      path: 'object.itemData.description',
    },
    {
      key: 'categorySuggestion',
      label: 'Category Suggestion',
      path: 'object.itemData.categorySuggestion',
    },
    {
      key: 'sku',
      label: 'Variation SKU',
      path: 'object.itemData.variations[0].itemVariationData.sku',
    },
    {
      key: 'priceMoney',
      label: 'Price',
      path: 'object.itemData.variations[0].itemVariationData.priceMoney.amount',
      formatter: (value) =>
        value === undefined ? '—' : formatPrice(Number(value) / 100),
    },
    {
      key: 'pricingType',
      label: 'Pricing Type',
      path: 'object.itemData.variations[0].itemVariationData.pricingType',
    },
  ],
  amazon: [
    { key: 'title', label: 'Amazon Title', path: 'title' },
    { key: 'brand', label: 'Brand', path: 'brand' },
    { key: 'manufacturer', label: 'Manufacturer', path: 'manufacturer' },
    { key: 'price', label: 'Price', path: 'price', formatter: formatPrice },
    { key: 'quantity', label: 'Quantity', path: 'quantity' },
    { key: 'productType', label: 'Product Type', path: 'amazonProductType' },
    { key: 'condition', label: 'Condition', path: 'condition' },
    { key: 'bulletPoints', label: 'Bullet Points', path: 'bullet_points' },
    { key: 'searchTerms', label: 'Search Terms', path: 'search_terms' },
  ],
  clover: [
    { key: 'name', label: 'Clover Name', path: 'name' },
    { key: 'price', label: 'Price', path: 'price', formatter: formatPrice },
    { key: 'priceType', label: 'Price Type', path: 'priceType' },
    { key: 'sku', label: 'SKU', path: 'sku' },
    { key: 'brand', label: 'Brand', path: 'brand' },
    { key: 'availability', label: 'Availability', path: 'availability' },
  ],
  facebook: [
    { key: 'title', label: 'Listing Title', path: 'title' },
    { key: 'availability', label: 'Availability', path: 'availability' },
    { key: 'condition', label: 'Condition', path: 'condition' },
    { key: 'price', label: 'Price', path: 'price' },
    {
      key: 'category',
      label: 'Category Suggestion',
      path: 'categorySuggestion',
    },
  ],
  ebay: [
    { key: 'title', label: 'Listing Title', path: 'title' },
    { key: 'format', label: 'Format', path: 'listingDetails.format' },
    { key: 'duration', label: 'Duration', path: 'listingDetails.duration' },
    {
      key: 'startPrice',
      label: 'Start Price',
      path: 'listingDetails.startPrice',
      formatter: formatPrice,
    },
    {
      key: 'shippingType',
      label: 'Shipping Type',
      path: 'shippingDetails.shippingType',
    },
  ],
  whatnot: [
    { key: 'title', label: 'Title', path: 'title' },
    { key: 'category', label: 'Category', path: 'category' },
    { key: 'price', label: 'Price', path: 'price', formatter: formatPrice },
    { key: 'quantity', label: 'Quantity', path: 'quantity' },
    { key: 'condition', label: 'Condition', path: 'condition' },
  ],
};

type ColumnDef = {
  key: string;
  label: React.ReactNode;
  menuLabel?: string;
  className?: string;
  render: (item: InventoryItem) => React.ReactNode;
  sortKey?: 'title' | 'sku' | 'price' | 'quantity';
};

type SortState = {
  key: NonNullable<ColumnDef['sortKey']>;
  direction: 'asc' | 'desc';
};

type InventoryPatch = Partial<Pick<InventoryItem, 'title' | 'sku' | 'price'>>;

function formatPrice(value?: number) {
  if (value === null || value === undefined) return '—';
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

function formatWeight(value?: number, unit?: string) {
  if (value === null || value === undefined) return '—';
  return `${value}${unit ? ` ${unit}` : ''}`;
}

function normalizePlatform(value?: string | null) {
  return (value ?? 'unknown').toLowerCase();
}

function toDisplayLabel(value: string) {
  if (!value) return 'All';
  if (value.length <= 4) return value.toUpperCase();
  return value
    .split(/[\s_-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function ProductImage({ src, alt }: { src?: string; alt: string }) {
  if (!src) {
    return (
      <div
        className="size-11 shrink-0 rounded-xl border bg-muted"
        aria-hidden
      />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      className="size-11 shrink-0 rounded-xl border object-cover"
      width={44}
      height={44}
    />
  );
}

function EditableCell({
  value,
  type = 'text',
  ariaLabel,
  disabled,
  onCommit,
}: {
  value: string;
  type?: 'text' | 'number';
  ariaLabel: string;
  disabled?: boolean;
  onCommit: (value: string) => Promise<void>;
}) {
  const [draft, setDraft] = React.useState(value);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => setDraft(value), [value]);

  const commit = async () => {
    if (draft === value) return;
    setSaving(true);
    try {
      await onCommit(draft);
    } catch {
      setDraft(value);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <Input
        value={draft}
        type={type}
        min={type === 'number' ? 0 : undefined}
        step={type === 'number' ? '0.01' : undefined}
        aria-label={ariaLabel}
        disabled={disabled || saving}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
          if (event.key === 'Escape') {
            setDraft(value);
            event.currentTarget.blur();
          }
        }}
        className="h-8 min-h-8 rounded-md border-transparent bg-transparent px-2 text-sm hover:border-input focus-visible:border-ring focus-visible:bg-card"
      />
      {saving ? (
        <LoaderCircleIcon className="-translate-y-1/2 absolute top-1/2 right-2 size-3.5 animate-spin text-muted-foreground" />
      ) : null}
    </div>
  );
}

export function InventoryClient({
  items,
  locations,
  connections,
}: {
  items: InventoryItem[];
  locations: Location[];
  connections: Connection[];
}) {
  const { getToken } = useAuth();
  const [rows, setRows] = React.useState(items);
  const [platform, setPlatform] = React.useState<string>('all');
  const [query, setQuery] = React.useState('');
  const [selectedConnectionIds, setSelectedConnectionIds] = React.useState<
    string[]
  >([]);
  const [selectedLocationIds, setSelectedLocationIds] = React.useState<
    string[]
  >([]);
  const [connectionSearch, setConnectionSearch] = React.useState('');
  const [locationSearch, setLocationSearch] = React.useState('');
  const [rowsPerPage, setRowsPerPage] = React.useState(25);
  const [page, setPage] = React.useState(1);
  const [stockFilter, setStockFilter] = React.useState('all');
  const [sort, setSort] = React.useState<SortState>({
    key: 'title',
    direction: 'asc',
  });
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [hiddenColumnKeys, setHiddenColumnKeys] = React.useState<Set<string>>(
    new Set(['weight'])
  );
  const [savingIds, setSavingIds] = React.useState<Set<string>>(new Set());
  const [bulkPriceOpen, setBulkPriceOpen] = React.useState(false);
  const [bulkPrice, setBulkPrice] = React.useState('');
  const [bulkSaving, setBulkSaving] = React.useState(false);
  const [sheetItem, setSheetItem] = React.useState<InventoryItem | null>(null);

  React.useEffect(() => setRows(items), [items]);

  const applySheetSave = React.useCallback(
    (
      itemId: string,
      patch: {
        price?: number;
        totalQuantity: number;
        levels: InventoryItem['levels'];
      }
    ) => {
      setRows((current) =>
        current.map((item) =>
          item.id === itemId
            ? {
                ...item,
                price: patch.price,
                totalQuantity: patch.totalQuantity,
                levels: patch.levels,
              }
            : item
        )
      );
    },
    []
  );

  const saveItem = React.useCallback(
    async (id: string, patch: InventoryPatch) => {
      const original = rows.find((item) => item.id === id);
      if (!original) return;

      setRows((current) =>
        current.map((item) => (item.id === id ? { ...item, ...patch } : item))
      );
      setSavingIds((current) => new Set(current).add(id));

      try {
        const response = await fetch(`/api/inventory/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });

        if (!response.ok) {
          const detail = await response.json().catch(() => null);
          throw new Error(detail?.error || 'Could not save product');
        }
        toast.success('Product updated');
      } catch (error) {
        setRows((current) =>
          current.map((item) => (item.id === id ? original : item))
        );
        toast.error(
          error instanceof Error ? error.message : 'Could not save product'
        );
        throw error;
      } finally {
        setSavingIds((current) => {
          const next = new Set(current);
          next.delete(id);
          return next;
        });
      }
    },
    [rows]
  );

  const connectionMap = React.useMemo(() => {
    const map: Record<string, Connection & { platformKey: string }> = {};
    connections.forEach((conn) => {
      map[conn.id] = {
        ...conn,
        platformKey: normalizePlatform(conn.platformType),
      };
    });
    return map;
  }, [connections]);

  const platformOptions = React.useMemo(() => {
    const unique = new Set<string>();
    connections.forEach((conn) => {
      unique.add(normalizePlatform(conn.platformType));
    });

    const boolPlatforms: Array<{ key: string; flag: keyof InventoryItem }> = [
      { key: 'square', flag: 'onSquare' },
      { key: 'shopify', flag: 'onShopify' },
      { key: 'clover', flag: 'onClover' },
      { key: 'amazon', flag: 'onAmazon' },
    ];
    boolPlatforms.forEach(({ key, flag }) => {
      if (rows.some((item) => item[flag])) {
        unique.add(key);
      }
    });

    const ordered: string[] = [];
    DEFAULT_PLATFORM_ORDER.forEach((key) => {
      if (unique.has(key)) {
        ordered.push(key);
        unique.delete(key);
      }
    });

    return ['all', ...ordered, ...Array.from(unique)];
  }, [connections, rows]);

  React.useEffect(() => {
    if (!platformOptions.includes(platform)) {
      setPlatform('all');
    }
  }, [platformOptions, platform]);

  React.useEffect(() => {
    if (platform === 'all') return;
    setSelectedConnectionIds((prev) =>
      prev.filter((id) => connectionMap[id]?.platformKey === platform)
    );
  }, [platform, connectionMap]);

  React.useEffect(() => {
    setPage(1);
  }, [
    platform,
    query,
    selectedConnectionIds,
    selectedLocationIds,
    rowsPerPage,
    stockFilter,
  ]);

  const locationMap = React.useMemo(() => {
    const map: Record<string, Location> = {};
    locations.forEach((loc) => {
      map[loc.id] = loc;
    });
    return map;
  }, [locations]);

  const itemPlatformKeys = React.useCallback(
    (item: InventoryItem) => {
      const set = new Set<string>();
      item.connectionIds?.forEach((id) => {
        const conn = connectionMap[id];
        if (conn?.platformKey) {
          set.add(conn.platformKey);
        }
      });
      if (item.onSquare) set.add('square');
      if (item.onShopify) set.add('shopify');
      if (item.onClover) set.add('clover');
      if (item.onAmazon) set.add('amazon');
      return set;
    },
    [connectionMap]
  );

  const platformConnectionCounts = React.useMemo(() => {
    const result: Record<string, number> = {};
    connections.forEach((conn) => {
      const key = normalizePlatform(conn.platformType);
      result[key] = (result[key] ?? 0) + 1;
    });
    return result;
  }, [connections]);

  const platformHasMappings = React.useMemo(() => {
    const result: Record<string, boolean> = {};
    rows.forEach((item) => {
      const keys = itemPlatformKeys(item);
      keys.forEach((key) => {
        result[key] = true;
      });
    });
    return result;
  }, [rows, itemPlatformKeys]);

  const shouldShowAllForPlatform = React.useCallback(
    (platformKey: string) =>
      Boolean(platformConnectionCounts[platformKey]) &&
      !platformHasMappings[platformKey],
    [platformConnectionCounts, platformHasMappings]
  );

  const counts = React.useMemo(() => {
    const result: Record<string, number> = { all: rows.length };
    rows.forEach((item) => {
      const keys = itemPlatformKeys(item);
      keys.forEach((key) => {
        result[key] = (result[key] ?? 0) + 1;
      });
    });
    Object.keys(platformConnectionCounts).forEach((key) => {
      if (shouldShowAllForPlatform(key)) {
        result[key] = rows.length;
      }
    });
    return result;
  }, [
    rows,
    itemPlatformKeys,
    platformConnectionCounts,
    shouldShowAllForPlatform,
  ]);

  const visibleConnections = React.useMemo(() => {
    const base =
      platform === 'all'
        ? connections
        : connections.filter(
            (conn) => normalizePlatform(conn.platformType) === platform
          );
    if (!connectionSearch) return base;
    return base.filter((conn) =>
      conn.displayName.toLowerCase().includes(connectionSearch.toLowerCase())
    );
  }, [connections, platform, connectionSearch]);

  const filteredLocations = React.useMemo(() => {
    return locations.filter((loc) => {
      const platformKey = normalizePlatform(loc.platformType);
      if (platform !== 'all' && platformKey !== platform) return false;
      if (selectedConnectionIds.length > 0) {
        return (
          loc.connectionId && selectedConnectionIds.includes(loc.connectionId)
        );
      }
      return true;
    });
  }, [locations, platform, selectedConnectionIds]);

  const locationGroups = React.useMemo(() => {
    const groups = new Map<
      string,
      { connectionName: string; locations: Location[] }
    >();
    filteredLocations
      .filter((loc) =>
        locationSearch
          ? loc.name.toLowerCase().includes(locationSearch.toLowerCase())
          : true
      )
      .forEach((loc) => {
        const key = loc.connectionId ?? 'unassigned';
        if (!groups.has(key)) {
          groups.set(key, {
            connectionName: loc.connectionName ?? 'Unassigned',
            locations: [],
          });
        }
        groups.get(key)!.locations.push(loc);
      });
    return Array.from(groups.entries());
  }, [filteredLocations, locationSearch]);

  const connectionLabel = React.useMemo(() => {
    if (platform === 'all') {
      return selectedConnectionIds.length > 0
        ? `${selectedConnectionIds.length} Account${
            selectedConnectionIds.length > 1 ? 's' : ''
          } Selected`
        : 'All Accounts';
    }
    if (selectedConnectionIds.length === 0) {
      return `All ${toDisplayLabel(platform)} Accounts`;
    }
    return `${selectedConnectionIds.length} ${toDisplayLabel(platform)} Account${
      selectedConnectionIds.length > 1 ? 's' : ''
    } Selected`;
  }, [platform, selectedConnectionIds]);

  const locationLabel = React.useMemo(() => {
    if (selectedLocationIds.length === 0) return 'All Locations';
    return `${selectedLocationIds.length} Location${
      selectedLocationIds.length > 1 ? 's' : ''
    } Selected`;
  }, [selectedLocationIds]);

  const filteredItems = React.useMemo(() => {
    return rows.filter((item) => {
      if (platform !== 'all') {
        const keys = itemPlatformKeys(item);
        if (!shouldShowAllForPlatform(platform) && !keys.has(platform)) {
          return false;
        }
      }
      if (selectedConnectionIds.length > 0) {
        const hasConn = item.connectionIds?.some((id) =>
          selectedConnectionIds.includes(id)
        );
        if (!hasConn) return false;
      }
      if (selectedLocationIds.length > 0) {
        const hasLocation = item.locationIds.some((id) =>
          selectedLocationIds.includes(id)
        );
        if (!hasLocation) return false;
      }
      if (query) {
        const q = query.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(q);
        const matchesSku = item.sku?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSku) return false;
      }
      if (stockFilter === 'low' && item.totalQuantity > 5) return false;
      if (stockFilter === 'out' && item.totalQuantity !== 0) return false;
      return true;
    });
  }, [
    rows,
    platform,
    itemPlatformKeys,
    selectedConnectionIds,
    selectedLocationIds,
    query,
    stockFilter,
  ]);

  const sortedItems = React.useMemo(() => {
    const direction = sort.direction === 'asc' ? 1 : -1;
    return [...filteredItems].sort((a, b) => {
      if (sort.key === 'price') {
        return ((a.price ?? -1) - (b.price ?? -1)) * direction;
      }
      if (sort.key === 'quantity') {
        return (a.totalQuantity - b.totalQuantity) * direction;
      }
      const aValue = sort.key === 'sku' ? (a.sku ?? '') : a.title;
      const bValue = sort.key === 'sku' ? (b.sku ?? '') : b.title;
      return (
        aValue.localeCompare(bValue, undefined, {
          numeric: true,
          sensitivity: 'base',
        }) * direction
      );
    });
  }, [filteredItems, sort]);

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * rowsPerPage;
  const pageItems = sortedItems.slice(startIndex, startIndex + rowsPerPage);
  const showingFrom = sortedItems.length === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + rowsPerPage, sortedItems.length);

  const selectedVisibleItems = React.useMemo(
    () => sortedItems.filter((item) => selectedIds.has(item.id)),
    [selectedIds, sortedItems]
  );
  const selectedItems = React.useMemo(
    () => rows.filter((item) => selectedIds.has(item.id)),
    [rows, selectedIds]
  );

  const allPageItemsSelected =
    pageItems.length > 0 && pageItems.every((item) => selectedIds.has(item.id));
  const somePageItemsSelected = pageItems.some((item) =>
    selectedIds.has(item.id)
  );

  const togglePageSelection = (checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      pageItems.forEach((item) => {
        if (checked) next.add(item.id);
        else next.delete(item.id);
      });
      return next;
    });
  };

  const toggleSort = (key: NonNullable<ColumnDef['sortKey']>) => {
    setSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const exportCsv = () => {
    const source = selectedVisibleItems.length
      ? selectedVisibleItems
      : sortedItems;
    const escape = (value: string | number | undefined) =>
      `"${String(value ?? '').replaceAll('"', '""')}"`;
    const csv = [
      ['Name', 'SKU', 'Price', 'Quantity', 'Locations'],
      ...source.map((item) => [
        item.title,
        item.sku ?? '',
        item.price ?? '',
        item.totalQuantity,
        locationSummary(item),
      ]),
    ]
      .map((row) => row.map(escape).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `anorha-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(
      `Exported ${source.length} product${source.length === 1 ? '' : 's'}`
    );
  };

  const applyBulkPrice = async () => {
    const nextPrice = Number(bulkPrice);
    if (!Number.isFinite(nextPrice) || nextPrice < 0) {
      toast.error('Enter a valid price');
      return;
    }
    if (selectedItems.length === 0) return;

    setBulkSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Sign in again');
      const response = await fetch(
        apiUrl('/api/products/bulk-actions/execute'),
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            actions: selectedItems.map((item) => ({
              itemId: item.id,
              actionType: 'update_price',
              changes: [
                {
                  field: 'price',
                  from: String(item.price ?? ''),
                  to: String(nextPrice),
                },
              ],
            })),
          }),
        }
      );
      const body = (await response.json().catch(() => null)) as {
        results?: Array<{ itemId: string; success: boolean }>;
        message?: string;
        error?: string;
      } | null;
      if (!response.ok) throw new Error(readError(body, 'Could not update price'));

      const successfulIds = new Set(
        (body?.results ?? [])
          .filter((result) => result.success)
          .map((result) => result.itemId)
      );
      setRows((current) =>
        current.map((item) =>
          successfulIds.has(item.id) ? { ...item, price: nextPrice } : item
        )
      );
      setSelectedIds((current) => {
        const next = new Set(current);
        successfulIds.forEach((id) => next.delete(id));
        return next;
      });

      const failed = selectedItems.length - successfulIds.size;
      if (failed > 0) toast.error(`${failed} price updates failed`);
      else toast.success(`Updated ${successfulIds.size} prices`);
      setBulkPriceOpen(false);
      setBulkPrice('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update price');
    } finally {
      setBulkSaving(false);
    }
  };

  const locationSummary = React.useCallback(
    (item: InventoryItem) => {
      const names = item.locationIds
        .map((id) => locationMap[id]?.name)
        .filter(Boolean) as string[];
      if (names.length === 0) return 'No locations';
      if (names.length === 1) return names[0];
      return `${names[0]}, ${names[1]}${
        names.length > 2 ? ` +${names.length - 2}` : ''
      }`;
    },
    [locationMap]
  );

  const baseColumns: ColumnDef[] = React.useMemo(
    () => [
      {
        key: 'select',
        label: (
          <Checkbox
            aria-label="Select this page"
            checked={
              allPageItemsSelected || (somePageItemsSelected && 'indeterminate')
            }
            onCheckedChange={(checked) => togglePageSelection(checked === true)}
          />
        ),
        className: 'w-10 min-w-10 px-3',
        render: (item: InventoryItem) => (
          <Checkbox
            aria-label={`Select ${item.title}`}
            checked={selectedIds.has(item.id)}
            onCheckedChange={(checked) =>
              setSelectedIds((current) => {
                const next = new Set(current);
                if (checked === true) next.add(item.id);
                else next.delete(item.id);
                return next;
              })
            }
          />
        ),
      },
      {
        key: 'image',
        label: 'Image',
        className: 'w-16 min-w-16',
        render: (item: InventoryItem) => (
          <ProductImage src={item.imageUrl} alt={item.title} />
        ),
      },
      {
        key: 'name',
        label: 'Name',
        menuLabel: 'Name',
        className: 'min-w-[230px]',
        sortKey: 'title',
        render: (item: InventoryItem) => (
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1">
            <EditableCell
              value={item.title}
              ariaLabel={`Name for ${item.title}`}
              disabled={savingIds.has(item.id)}
              onCommit={(title) => saveItem(item.id, { title })}
            />
            <Button asChild size="icon" variant="ghost">
              <Link
                aria-label={`Open ${item.title}`}
                href={`/products/${item.id}`}
              >
                <ExternalLinkIcon />
              </Link>
            </Button>
          </div>
        ),
      },
      {
        key: 'sku',
        label: 'SKU',
        menuLabel: 'SKU',
        className: 'min-w-[150px]',
        sortKey: 'sku',
        render: (item: InventoryItem) => (
          <EditableCell
            value={item.sku ?? ''}
            ariaLabel={`SKU for ${item.title}`}
            disabled={savingIds.has(item.id)}
            onCommit={(sku) => saveItem(item.id, { sku })}
          />
        ),
      },
      {
        key: 'price',
        label: 'Price',
        menuLabel: 'Price',
        className: 'min-w-[130px]',
        sortKey: 'price',
        render: (item: InventoryItem) => (
          <EditableCell
            value={item.price === undefined ? '' : String(item.price)}
            type="number"
            ariaLabel={`Price for ${item.title}`}
            disabled={savingIds.has(item.id)}
            onCommit={(price) =>
              saveItem(item.id, {
                price: price.trim() === '' ? undefined : Number(price),
              })
            }
          />
        ),
      },
      {
        key: 'quantity',
        label: 'Quantity',
        menuLabel: 'Quantity',
        className: 'min-w-[110px]',
        sortKey: 'quantity',
        render: (item: InventoryItem) => {
          const stockLabel =
            item.totalQuantity === 0
              ? 'Out'
              : item.totalQuantity <= 5
                ? 'Low'
                : 'In stock';
          return (
            <span className="flex items-center gap-2 px-2">
              <span className="font-semibold tabular-nums">
                {item.totalQuantity}
              </span>
              <span
                className={
                  item.totalQuantity === 0
                    ? 'rounded-full bg-destructive/10 px-2 py-0.5 font-semibold text-[0.6875rem] text-destructive'
                    : item.totalQuantity <= 5
                      ? 'rounded-full bg-warning/12 px-2 py-0.5 font-semibold text-[0.6875rem] text-warning'
                      : 'rounded-full bg-success/10 px-2 py-0.5 font-semibold text-[0.6875rem] text-success'
                }
              >
                {stockLabel}
              </span>
            </span>
          );
        },
      },
      {
        key: 'channels',
        label: 'Channels',
        menuLabel: 'Channels',
        className: 'min-w-[180px]',
        render: (item: InventoryItem) => {
          const platforms = Array.from(itemPlatformKeys(item));
          if (platforms.length === 0) {
            return <span className="text-muted-foreground text-xs">Not listed</span>;
          }
          return (
            <span className="flex flex-wrap gap-1">
              {platforms.slice(0, 2).map((platformKey) => (
                <span
                  key={platformKey}
                  className="rounded-full border bg-muted/45 px-2 py-0.5 font-medium text-[0.6875rem] text-muted-foreground"
                >
                  {toDisplayLabel(platformKey)}
                </span>
              ))}
              {platforms.length > 2 ? (
                <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-[0.6875rem] text-muted-foreground">
                  +{platforms.length - 2}
                </span>
              ) : null}
            </span>
          );
        },
      },
      {
        key: 'locations',
        label: 'Locations',
        menuLabel: 'Locations',
        className: 'min-w-[180px]',
        render: (item: InventoryItem) => (
          <span className="text-muted-foreground text-xs">
            {locationSummary(item)}
          </span>
        ),
      },
      {
        key: 'weight',
        label: 'Weight',
        menuLabel: 'Weight',
        className: 'min-w-[140px]',
        render: (item: InventoryItem) =>
          formatWeight(item.weight, item.weightUnit),
      },
    ],
    [
      allPageItemsSelected,
      locationSummary,
      itemPlatformKeys,
      saveItem,
      savingIds,
      selectedIds,
      somePageItemsSelected,
    ]
  );

  const dynamicColumns: ColumnDef[] = React.useMemo(() => {
    if (platform === 'all') return [];
    const defs = PLATFORM_FIELD_DEFS[platform] ?? [];
    return defs.map((field) => ({
      key: `platform-${field.key}`,
      label: field.label,
      menuLabel: field.label,
      className: 'min-w-[220px]',
      render: (item: InventoryItem) => {
        const data = item.platformData?.[platform];
        const value = getValueAtPath(data, field.path);
        const rendered = field.formatter
          ? field.formatter(value)
          : formatPlatformValue(value);
        return <span className="text-k0-ink text-sm">{rendered}</span>;
      },
    }));
  }, [platform]);

  const allColumns = React.useMemo(
    () => [...baseColumns, ...dynamicColumns],
    [baseColumns, dynamicColumns]
  );

  const columns = React.useMemo(
    () =>
      allColumns.filter(
        (column) => column.key === 'select' || !hiddenColumnKeys.has(column.key)
      ),
    [allColumns, hiddenColumnKeys]
  );

  const inventoryUnits = React.useMemo(
    () => rows.reduce((total, item) => total + item.totalQuantity, 0),
    [rows]
  );
  const inventoryValue = React.useMemo(
    () =>
      rows.reduce(
        (total, item) => total + item.totalQuantity * (item.price ?? 0),
        0
      ),
    [rows]
  );
  const lowStockCount = React.useMemo(
    () =>
      rows.filter((item) => item.totalQuantity > 0 && item.totalQuantity <= 5)
        .length,
    [rows]
  );
  const outOfStockCount = React.useMemo(
    () => rows.filter((item) => item.totalQuantity === 0).length,
    [rows]
  );
  const hasActiveFilters =
    platform !== 'all' ||
    query.trim().length > 0 ||
    selectedConnectionIds.length > 0 ||
    selectedLocationIds.length > 0 ||
    stockFilter !== 'all';

  const clearFilters = () => {
    setPlatform('all');
    setQuery('');
    setSelectedConnectionIds([]);
    setSelectedLocationIds([]);
    setStockFilter('all');
  };

  return (
    <div className="flex flex-col gap-5">
      <section
        aria-label="Inventory summary"
        className="grid overflow-hidden rounded-[1.125rem] border bg-card sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="border-b px-4 py-3.5 sm:border-r lg:border-b-0">
          <p className="text-muted-foreground text-xs">Products</p>
          <p className="mt-1 font-bold text-lg tabular-nums">
            {rows.length.toLocaleString()}
          </p>
        </div>
        <div className="border-b px-4 py-3.5 lg:border-r lg:border-b-0">
          <p className="text-muted-foreground text-xs">Units on hand</p>
          <p className="mt-1 font-bold text-lg tabular-nums">
            {inventoryUnits.toLocaleString()}
          </p>
        </div>
        <div className="border-b px-4 py-3.5 sm:border-r sm:border-b-0">
          <p className="text-muted-foreground text-xs">Inventory value</p>
          <p className="mt-1 font-bold text-lg tabular-nums">
            {formatPrice(inventoryValue)}
          </p>
        </div>
        <div className="px-4 py-3.5">
          <p className="text-muted-foreground text-xs">Needs attention</p>
          <p className="mt-1 font-bold text-lg tabular-nums">
            {(lowStockCount + outOfStockCount).toLocaleString()}
          </p>
          <p className="mt-0.5 text-muted-foreground text-xs">
            {outOfStockCount} out, {lowStockCount} low
          </p>
        </div>
      </section>

      <Tabs value={platform} onValueChange={(value) => setPlatform(value)}>
        <TabsList className="h-auto max-w-full flex-wrap justify-start gap-1 rounded-2xl bg-muted/65 p-1.5">
          {platformOptions.map((option) => (
            <TabsTrigger
              key={option}
              value={option}
              className="h-9 rounded-xl px-3 font-semibold text-muted-foreground text-sm data-[state=active]:bg-card data-[state=active]:text-accent-foreground data-[state=active]:shadow-xs"
            >
              {toDisplayLabel(option)}{' '}
              <span className="text-muted-foreground/70 text-xs">
                ({counts[option] ?? 0})
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-3 rounded-[1.125rem] border bg-muted/25 p-3 md:p-4">
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-10 min-w-[210px] justify-between text-sm"
              >
                {connectionLabel}
                <ChevronDownIcon data-icon="inline-end" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72 p-0">
              <div className="border-k0-border border-b p-3">
                <Input
                  value={connectionSearch}
                  onChange={(e) => setConnectionSearch(e.target.value)}
                  placeholder="Search accounts..."
                />
              </div>
              <div className="max-h-64 overflow-y-auto">
                {visibleConnections.length === 0 ? (
                  <p className="px-3 py-2 text-k0-ink-2 text-sm">
                    No accounts found
                  </p>
                ) : (
                  visibleConnections.map((conn) => (
                    <DropdownMenuCheckboxItem
                      key={conn.id}
                      checked={selectedConnectionIds.includes(conn.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedConnectionIds((prev) => [
                            ...prev,
                            conn.id,
                          ]);
                        } else {
                          setSelectedConnectionIds((prev) =>
                            prev.filter((id) => id !== conn.id)
                          );
                        }
                      }}
                      className="cursor-pointer capitalize"
                    >
                      {conn.displayName}
                    </DropdownMenuCheckboxItem>
                  ))
                )}
              </div>
              <DropdownMenuSeparator />
              <div className="flex items-center justify-between px-3 py-2 text-sm">
                <button
                  type="button"
                  className="rounded-md px-1 font-semibold text-accent-foreground outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => setSelectedConnectionIds([])}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="rounded-md px-1 font-semibold text-accent-foreground outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() =>
                    setSelectedConnectionIds(
                      visibleConnections.map((c) => c.id)
                    )
                  }
                >
                  Select all
                </button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-10 min-w-[190px] justify-between text-sm"
              >
                {locationLabel}
                <ChevronDownIcon data-icon="inline-end" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 p-0">
              <div className="border-k0-border border-b p-3">
                <Input
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  placeholder="Search locations..."
                />
              </div>
              <div className="max-h-72 overflow-y-auto">
                {locationGroups.length === 0 ? (
                  <p className="px-3 py-2 text-k0-ink-2 text-sm">
                    No locations
                  </p>
                ) : (
                  locationGroups.map(([key, group]) => (
                    <div key={key} className="px-3 py-2">
                      <p className="mb-1 text-k0-ink-3 text-xs uppercase">
                        {group.connectionName}
                      </p>
                      {group.locations.map((loc) => (
                        <DropdownMenuCheckboxItem
                          key={loc.id}
                          checked={selectedLocationIds.includes(loc.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedLocationIds((prev) => [
                                ...prev,
                                loc.id,
                              ]);
                            } else {
                              setSelectedLocationIds((prev) =>
                                prev.filter((id) => id !== loc.id)
                              );
                            }
                          }}
                          className="cursor-pointer"
                        >
                          {loc.name}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </div>
                  ))
                )}
              </div>
              <DropdownMenuSeparator />
              <div className="flex items-center justify-between px-3 py-2 text-sm">
                <button
                  type="button"
                  className="rounded-md px-1 font-semibold text-accent-foreground outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => setSelectedLocationIds([])}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="rounded-md px-1 font-semibold text-accent-foreground outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() =>
                    setSelectedLocationIds(
                      filteredLocations.map((loc) => loc.id)
                    )
                  }
                >
                  Select all
                </button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex min-w-[260px] flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <SearchIcon className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
            <Input
              placeholder="Search products or SKU"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 min-h-10 rounded-lg border-transparent bg-muted/65 pl-10 focus-visible:border-ring"
            />
          </div>
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="h-10 min-h-10 w-[145px] rounded-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stock</SelectItem>
              <SelectItem value="low">Low stock (5 or less)</SelectItem>
              <SelectItem value="out">Out of stock</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 text-muted-foreground">
                Columns
                <ChevronDownIcon data-icon="inline-end" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {allColumns
                .filter((column) => column.key !== 'select')
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.key}
                    checked={!hiddenColumnKeys.has(column.key)}
                    onCheckedChange={(checked) =>
                      setHiddenColumnKeys((current) => {
                        const next = new Set(current);
                        if (checked) next.delete(column.key);
                        else next.add(column.key);
                        return next;
                      })
                    }
                  >
                    {column.menuLabel ?? column.label}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            className="h-10"
            onClick={exportCsv}
            disabled={sortedItems.length === 0}
          >
            <DownloadIcon data-icon="inline-start" />
            Export
          </Button>
          {hasActiveFilters ? (
            <Button
              variant="ghost"
              className="h-10 text-muted-foreground"
              onClick={clearFilters}
            >
              <XIcon data-icon="inline-start" />
              Clear
            </Button>
          ) : null}
        </div>
      </div>

      {selectedIds.size > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2">
          <span className="font-semibold text-sm">
            {selectedIds.size} product{selectedIds.size === 1 ? '' : 's'}{' '}
            selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setBulkPriceOpen(true)}
              size="sm"
              variant="outline"
            >
              Edit price
            </Button>
            {selectedIds.size < sortedItems.length ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setSelectedIds(new Set(sortedItems.map((item) => item.id)))
                }
              >
                Select all {sortedItems.length}
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear selection
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={bulkPriceOpen} onOpenChange={setBulkPriceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk price</DialogTitle>
            <DialogDescription>
              Set one price for {selectedItems.length} products.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="bulk-price">Price</Label>
            <Input
              autoFocus
              id="bulk-price"
              min={0}
              onChange={(event) => setBulkPrice(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void applyBulkPrice();
              }}
              placeholder="0.00"
              step="0.01"
              type="number"
              value={bulkPrice}
            />
          </div>
          <DialogFooter>
            <Button
              disabled={bulkSaving}
              onClick={() => setBulkPriceOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={bulkSaving} onClick={() => void applyBulkPrice()}>
              {bulkSaving ? (
                <LoaderCircleIcon className="animate-spin" data-icon="inline-start" />
              ) : null}
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="divide-y overflow-hidden rounded-[1.125rem] border bg-card md:hidden">
        {pageItems.length === 0 ? (
          <div className="flex min-h-44 flex-col items-center justify-center px-5 text-center">
            <p className="font-semibold text-sm">No products found</p>
            <p className="mt-1 text-muted-foreground text-xs">
              Try clearing a filter or searching for another SKU.
            </p>
            {hasActiveFilters ? (
              <Button className="mt-4" size="sm" variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null}
          </div>
        ) : (
          pageItems.map((item) => {
            const platforms = Array.from(itemPlatformKeys(item));
            return (
              <div
                key={item.id}
                className="flex items-start gap-3 px-4 py-4 data-[selected=true]:bg-primary/8"
                data-selected={selectedIds.has(item.id)}
              >
                <Checkbox
                  className="mt-3"
                  aria-label={`Select ${item.title}`}
                  checked={selectedIds.has(item.id)}
                  onCheckedChange={(checked) =>
                    setSelectedIds((current) => {
                      const next = new Set(current);
                      if (checked === true) next.add(item.id);
                      else next.delete(item.id);
                      return next;
                    })
                  }
                />
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-start gap-3 rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onClick={() => setSheetItem(item)}
                  aria-label={`Edit inventory for ${item.title}`}
                >
                  <ProductImage src={item.imageUrl} alt="" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-sm">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block truncate text-muted-foreground text-xs">
                      {item.sku || 'No SKU'} · {locationSummary(item)}
                    </span>
                    <span className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-sm tabular-nums">
                        {formatPrice(item.price)}
                      </span>
                      {platforms.length > 0 ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[0.6875rem] text-muted-foreground">
                          {platforms.slice(0, 2).map(toDisplayLabel).join(', ')}
                          {platforms.length > 2 ? ` +${platforms.length - 2}` : ''}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  <span
                    className={
                      item.totalQuantity === 0
                        ? 'rounded-full bg-destructive/10 px-2 py-1 font-semibold text-destructive text-xs tabular-nums'
                        : item.totalQuantity <= 5
                          ? 'rounded-full bg-warning/12 px-2 py-1 font-semibold text-warning text-xs tabular-nums'
                          : 'rounded-full bg-muted px-2 py-1 font-semibold text-muted-foreground text-xs tabular-nums'
                    }
                  >
                    {item.totalQuantity}
                  </span>
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="hidden overflow-hidden rounded-[1.125rem] border bg-card md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/45">
              <TableRow className="text-muted-foreground text-[0.6875rem] uppercase tracking-[0.06em] hover:bg-transparent">
                {columns.map((column) => (
                  <TableHead key={column.key} className={column.className}>
                    {column.sortKey ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.sortKey!)}
                        className="-ml-2 inline-flex h-8 items-center gap-1 rounded-md px-2 hover:bg-muted hover:text-foreground"
                      >
                        {column.label}
                        {sort.key === column.sortKey ? (
                          sort.direction === 'asc' ? (
                            <ArrowUpIcon className="size-3.5" />
                          ) : (
                            <ArrowDownIcon className="size-3.5" />
                          )
                        ) : (
                          <ArrowUpDownIcon className="size-3.5 opacity-45" />
                        )}
                      </button>
                    ) : (
                      column.label
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="py-14 text-center font-medium text-muted-foreground text-sm"
                  >
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((item) => (
                  <TableRow
                    key={item.id}
                    data-state={
                      selectedIds.has(item.id) ? 'selected' : undefined
                    }
                    onClick={() => setSheetItem(item)}
                    onKeyDown={(event) => {
                      if (event.target !== event.currentTarget) return;
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSheetItem(item);
                      }
                    }}
                    tabIndex={0}
                    className="h-16 cursor-pointer text-sm outline-none hover:bg-muted/35 focus-visible:bg-muted/45 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring data-[state=selected]:bg-primary/8"
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={`${item.id}-${column.key}`}
                        className={column.className}
                        onClick={
                          INTERACTIVE_CELL_KEYS.has(column.key)
                            ? (event) => event.stopPropagation()
                            : undefined
                        }
                        onKeyDown={
                          INTERACTIVE_CELL_KEYS.has(column.key)
                            ? (event) => event.stopPropagation()
                            : undefined
                        }
                      >
                        {column.render(item)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="font-medium text-muted-foreground text-sm">
          Showing {showingFrom} to {showingTo} of {sortedItems.length} products
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-medium text-muted-foreground text-sm">
            Rows per page
            <Select
              value={rowsPerPage.toString()}
              onValueChange={(value) => setRowsPerPage(Number(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 25, 50].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage === 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </Button>
            <div className="font-medium text-muted-foreground text-sm">
              Page {safePage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage === totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <PriceStockSheet
        item={sheetItem}
        open={sheetItem !== null}
        onOpenChange={(open) => {
          if (!open) setSheetItem(null);
        }}
        onSaved={applySheetSave}
      />
    </div>
  );
}

function getValueAtPath(data: Record<string, any> | undefined, path: string) {
  if (!data) return undefined;
  const normalizedPath = path.replace(/\[(\d+)\]/g, '.$1');
  const segments = normalizedPath.split('.').filter(Boolean);
  let current: any = data;
  for (const segment of segments) {
    if (current === null || current === undefined) return undefined;
    current = current[segment];
  }
  return current;
}

function formatPlatformValue(value: any) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) {
    const filtered = value.filter(
      (val) => val !== null && val !== undefined && val !== ''
    );
    if (filtered.length === 0) return '—';
    return filtered
      .map((entry) =>
        typeof entry === 'object' ? JSON.stringify(entry) : String(entry)
      )
      .join(', ');
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 0) return '—';
    return JSON.stringify(value);
  }
  return String(value);
}
