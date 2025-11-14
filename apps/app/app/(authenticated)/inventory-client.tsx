'use client';

import React from 'react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@repo/design-system/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/design-system/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/design-system/components/ui/dropdown-menu';
import { Input } from '@repo/design-system/components/ui/input';
import { Button } from '@repo/design-system/components/ui/button';
import { ChevronDownIcon, SearchIcon } from 'lucide-react';
import Image from 'next/image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/design-system/components/ui/select';

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
    { key: 'description', label: 'Description', path: 'object.itemData.description' },
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
    { key: 'category', label: 'Category Suggestion', path: 'categorySuggestion' },
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
  className?: string;
  render: (item: InventoryItem) => React.ReactNode;
};

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
      <div className="size-10 rounded border border-gray-200 bg-gray-50" />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      className="size-10 rounded object-cover"
      width={40}
      height={40}
    />
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
  const [platform, setPlatform] = React.useState<string>('all');
  const [query, setQuery] = React.useState('');
  const [selectedConnectionIds, setSelectedConnectionIds] =
    React.useState<string[]>([]);
  const [selectedLocationIds, setSelectedLocationIds] = React.useState<string[]>(
    []
  );
  const [connectionSearch, setConnectionSearch] = React.useState('');
  const [locationSearch, setLocationSearch] = React.useState('');
  const [rowsPerPage, setRowsPerPage] = React.useState(25);
  const [page, setPage] = React.useState(1);

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
      if (items.some((item) => item[flag])) {
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
  }, [connections, items]);

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
  }, [platform, query, selectedConnectionIds, selectedLocationIds, rowsPerPage]);

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

  const counts = React.useMemo(() => {
    const result: Record<string, number> = { all: items.length };
    items.forEach((item) => {
      const keys = itemPlatformKeys(item);
      keys.forEach((key) => {
        result[key] = (result[key] ?? 0) + 1;
      });
    });
    return result;
  }, [items, itemPlatformKeys]);

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
        return loc.connectionId && selectedConnectionIds.includes(loc.connectionId);
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
    return items.filter((item) => {
      if (platform !== 'all') {
        const keys = itemPlatformKeys(item);
        if (!keys.has(platform)) return false;
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
      return true;
    });
  }, [
    items,
    platform,
    itemPlatformKeys,
    selectedConnectionIds,
    selectedLocationIds,
    query,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * rowsPerPage;
  const pageItems = filteredItems.slice(startIndex, startIndex + rowsPerPage);
  const showingFrom = filteredItems.length === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + rowsPerPage, filteredItems.length);

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
        key: 'drag',
        label: '',
        className: 'w-10',
        render: () => <span className="text-gray-300">⋮⋮</span>,
      },
      {
        key: 'image',
        label: 'Image',
        className: 'min-w-[80px]',
        render: (item: InventoryItem) => (
          <ProductImage src={item.imageUrl} alt={item.title} />
        ),
      },
      {
        key: 'name',
        label: 'Name',
        className: 'min-w-[240px]',
        render: (item: InventoryItem) => (
          <div>
            <div className="font-semibold text-gray-900">{item.title}</div>
            <div className="text-xs text-gray-500">
              {item.sku || 'No SKU'} · {locationSummary(item)}
            </div>
          </div>
        ),
      },
      {
        key: 'price',
        label: 'Price',
        className: 'min-w-[140px]',
        render: (item: InventoryItem) => (
          <span className="font-medium text-gray-900">
            {formatPrice(item.price)}
          </span>
        ),
      },
      {
        key: 'quantity',
        label: 'Quantity',
        className: 'min-w-[120px]',
        render: (item: InventoryItem) => (
          <span className="font-semibold text-gray-900">{item.totalQuantity}</span>
        ),
      },
      {
        key: 'weight',
        label: 'Weight',
        className: 'min-w-[140px]',
        render: (item: InventoryItem) => formatWeight(item.weight, item.weightUnit),
      },
      {
        key: 'matching',
        label: 'Matching Product',
        className: 'min-w-[200px]',
        render: (item: InventoryItem) =>
          item.hasShopifyMapping ? (
            <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
              Linked
            </span>
          ) : (
            <Button variant="ghost" size="sm" className="text-[#34A853]">
              Set Matching Product
            </Button>
          ),
      },
    ],
    [locationSummary]
  );

  const dynamicColumns: ColumnDef[] = React.useMemo(() => {
    if (platform === 'all') return [];
    const defs = PLATFORM_FIELD_DEFS[platform] ?? [];
    return defs.map((field) => ({
      key: `platform-${field.key}`,
      label: field.label,
      className: 'min-w-[220px]',
      render: (item: InventoryItem) => {
        const data = item.platformData?.[platform];
        const value = getValueAtPath(data, field.path);
        const rendered = field.formatter
          ? field.formatter(value)
          : formatPlatformValue(value);
        return <span className="text-sm text-gray-700">{rendered}</span>;
      },
    }));
  }, [platform]);

  const columns = React.useMemo(
    () => [...baseColumns, ...dynamicColumns],
    [baseColumns, dynamicColumns]
  );

  return (
    <div className="space-y-5">
      <Tabs value={platform} onValueChange={(value) => setPlatform(value)}>
        <TabsList className="flex flex-wrap gap-2 border-b border-gray-200 bg-transparent p-0">
          {platformOptions.map((option) => (
            <TabsTrigger
              key={option}
              value={option}
              className="rounded-full px-4 py-2 text-sm font-medium text-gray-600 data-[state=active]:bg-[#34A853]/10 data-[state=active]:text-[#34A853]"
            >
              {toDisplayLabel(option)}{' '}
              <span className="ml-1 text-xs text-gray-400">
                ({counts[option] ?? 0})
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-3 lg:items-start lg:justify-start">
        <div className="flex flex-wrap gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="min-w-[220px] justify-between text-sm"
              >
                {connectionLabel}
                <ChevronDownIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72 p-0">
              <div className="border-b border-gray-100 p-3">
                <Input
                  value={connectionSearch}
                  onChange={(e) => setConnectionSearch(e.target.value)}
                  placeholder="Search accounts..."
                />
              </div>
              <div className="max-h-64 overflow-y-auto">
                {visibleConnections.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-gray-500">
                    No accounts found
                  </p>
                ) : (
                  visibleConnections.map((conn) => (
                    <DropdownMenuCheckboxItem
                      key={conn.id}
                      checked={selectedConnectionIds.includes(conn.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedConnectionIds((prev) => [...prev, conn.id]);
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
                    setSelectedConnectionIds(visibleConnections.map((c) => c.id))
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
                className="min-w-[200px] justify-between text-sm"
              >
                {locationLabel}
                <ChevronDownIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 p-0">
              <div className="border-b border-gray-100 p-3">
                <Input
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  placeholder="Search locations..."
                />
              </div>
              <div className="max-h-72 overflow-y-auto">
                {locationGroups.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-gray-500">No locations</p>
                ) : (
                  locationGroups.map(([key, group]) => (
                    <div key={key} className="px-3 py-2">
                      <p className="mb-1 text-xs uppercase text-gray-400">
                        {group.connectionName}
                      </p>
                      {group.locations.map((loc) => (
                        <DropdownMenuCheckboxItem
                          key={loc.id}
                          checked={selectedLocationIds.includes(loc.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedLocationIds((prev) => [...prev, loc.id]);
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
                    setSelectedLocationIds(filteredLocations.map((loc) => loc.id))
                  }
                >
                  Select all
                </button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-1 min-w-[260px] items-center justify-end gap-2">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search for product"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="border-dashed text-gray-600">
            Columns
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow className="text-xs uppercase tracking-wide text-gray-500">
                {columns.map((column) => (
                  <TableHead key={column.key} className={column.className}>
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-12 text-center text-sm text-gray-500"
                  >
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className="text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {columns.map((column) => (
                      <TableCell key={`${item.id}-${column.key}`} className={column.className}>
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
        <div className="text-sm text-gray-500">
          Showing {showingFrom} to {showingTo} of {filteredItems.length} products
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
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
            <div className="text-sm text-gray-600">
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
    const filtered = value.filter((val) => val !== null && val !== undefined && val !== '');
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