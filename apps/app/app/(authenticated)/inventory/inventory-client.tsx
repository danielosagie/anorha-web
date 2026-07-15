'use client';

import { Button } from '@repo/design-system/components/ui/button';
import { Checkbox } from '@repo/design-system/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/design-system/components/ui/dropdown-menu';
import { Input } from '@repo/design-system/components/ui/input';
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
  LoaderCircleIcon,
  SearchIcon,
} from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import { toast } from 'sonner';

type InventoryItem = {
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

type Connection = {
  id: string;
  displayName: string;
  platformType: string;
  isEnabled: boolean;
  status?: string | null;
};

const DEFAULT_PLATFORM_ORDER = ['square', 'shopify', 'clover', 'amazon'];
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
    return <div className="size-9 rounded-lg border bg-muted" />;
  }
  return (
    <Image
      src={src}
      alt={alt}
      className="size-9 rounded-lg border object-cover"
      width={36}
      height={36}
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

  React.useEffect(() => setRows(items), [items]);

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
          <EditableCell
            value={item.title}
            ariaLabel={`Name for ${item.title}`}
            disabled={savingIds.has(item.id)}
            onCommit={(title) => saveItem(item.id, { title })}
          />
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
        render: (item: InventoryItem) => (
          <span className="px-2 font-semibold tabular-nums">
            {item.totalQuantity}
          </span>
        ),
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
        return <span className="text-gray-700 text-sm">{rendered}</span>;
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

  return (
    <div className="flex flex-col gap-5">
      <Tabs value={platform} onValueChange={(value) => setPlatform(value)}>
        <TabsList className="h-auto max-w-full flex-wrap justify-start gap-1 rounded-2xl bg-muted/70 p-1.5">
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

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3">
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
              <div className="border-gray-100 border-b p-3">
                <Input
                  value={connectionSearch}
                  onChange={(e) => setConnectionSearch(e.target.value)}
                  placeholder="Search accounts..."
                />
              </div>
              <div className="max-h-64 overflow-y-auto">
                {visibleConnections.length === 0 ? (
                  <p className="px-3 py-2 text-gray-500 text-sm">
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
                  className="text-[#34A853]"
                  onClick={() => setSelectedConnectionIds([])}
                >
                  Clear
                </button>
                <button
                  className="text-[#34A853]"
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
              <div className="border-gray-100 border-b p-3">
                <Input
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  placeholder="Search locations..."
                />
              </div>
              <div className="max-h-72 overflow-y-auto">
                {locationGroups.length === 0 ? (
                  <p className="px-3 py-2 text-gray-500 text-sm">
                    No locations
                  </p>
                ) : (
                  locationGroups.map(([key, group]) => (
                    <div key={key} className="px-3 py-2">
                      <p className="mb-1 text-gray-400 text-xs uppercase">
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
                  className="text-[#34A853]"
                  onClick={() => setSelectedLocationIds([])}
                >
                  Clear
                </button>
                <button
                  className="text-[#34A853]"
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
              placeholder="Search name or SKU"
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
        </div>
      </div>

      {selectedIds.size > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2">
          <span className="font-semibold text-sm">
            {selectedIds.size} product{selectedIds.size === 1 ? '' : 's'}{' '}
            selected
          </span>
          <div className="flex items-center gap-2">
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

      <div className="overflow-hidden rounded-xl border bg-card">
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
                    className="h-12 text-sm hover:bg-muted/35 data-[state=selected]:bg-primary/8"
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={`${item.id}-${column.key}`}
                        className={column.className}
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
