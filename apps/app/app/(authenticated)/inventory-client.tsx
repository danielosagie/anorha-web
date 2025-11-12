'use client';

import React from 'react';
import {
  Tabs,
  TabsContent,
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
import { ChevronDownIcon } from 'lucide-react';
import Image from 'next/image';

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
  onShopify?: boolean;
  onSquare?: boolean;
  onClover?: boolean;
  onAmazon?: boolean;
  hasShopifyMapping?: boolean;
};

type Location = {
  id: string;
  name: string;
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

function platformMatches(item: InventoryItem, platform: string) {
  if (platform === 'all') return true;
  const p = platform.toLowerCase();
  if (p === 'shopify') return !!item.onShopify;
  if (p === 'square') return !!item.onSquare;
  if (p === 'clover') return !!item.onClover;
  if (p === 'amazon') return !!item.onAmazon;
  return true;
}

function getPlatformTabsCount(items: InventoryItem[]) {
  const counts = {
    all: items.length,
    square: items.filter((i) => i.onSquare).length,
    shopify: items.filter((i) => i.onShopify).length,
    clover: items.filter((i) => i.onClover).length,
    amazon: items.filter((i) => i.onAmazon).length,
  };
  return counts;
}

function ProductImage({ src, alt }: { src?: string; alt: string }) {
  if (!src) {
    return <div className="size-10 rounded bg-gray-100" />;
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
}: {
  items: InventoryItem[];
  locations: Location[];
}) {
  const [platform, setPlatform] = React.useState<
    'all' | 'square' | 'shopify' | 'clover' | 'amazon'
  >('all');
  const [query, setQuery] = React.useState('');
  const [selectedLocationIds, setSelectedLocationIds] = React.useState<string[]>([]);

  const counts = React.useMemo(() => getPlatformTabsCount(items), [items]);

  const filtered = React.useMemo(() => {
    const byPlatformAndQuery = items
      .filter((i) => platformMatches(i, platform))
      .filter((i) =>
        query
          ? i.title?.toLowerCase().includes(query.toLowerCase()) ||
            (i.sku ?? '').toLowerCase().includes(query.toLowerCase())
          : true
      );
    if (selectedLocationIds.length === 0) return byPlatformAndQuery;
    return byPlatformAndQuery.filter((i) =>
      i.locationIds.some((id) => selectedLocationIds.includes(id))
    );
  }, [items, platform, query, selectedLocationIds]);

  return (
    <div className="space-y-4 p-6">
      {/* Platform Tabs */}
      <Tabs value={platform} onValueChange={(v: string) => setPlatform(v as any)}>
        <TabsList className="grid w-full grid-cols-5 bg-white border-b border-gray-200 rounded-none h-auto gap-0">
          <TabsTrigger
            value="all"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-b-[#34A853] data-[state=active]:bg-transparent data-[state=active]:text-[#34A853] data-[state=active]:shadow-none"
          >
            All ({counts.all})
          </TabsTrigger>
          <TabsTrigger
            value="square"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-b-[#34A853] data-[state=active]:bg-transparent data-[state=active]:text-[#34A853] data-[state=active]:shadow-none"
          >
            Square ({counts.square})
          </TabsTrigger>
          <TabsTrigger
            value="shopify"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-b-[#34A853] data-[state=active]:bg-transparent data-[state=active]:text-[#34A853] data-[state=active]:shadow-none"
          >
            Shopify ({counts.shopify})
          </TabsTrigger>
          <TabsTrigger
            value="clover"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-b-[#34A853] data-[state=active]:bg-transparent data-[state=active]:text-[#34A853] data-[state=active]:shadow-none"
          >
            Clover ({counts.clover})
          </TabsTrigger>
          <TabsTrigger
            value="amazon"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-b-[#34A853] data-[state=active]:bg-transparent data-[state=active]:text-[#34A853] data-[state=active]:shadow-none"
          >
            Amazon ({counts.amazon})
          </TabsTrigger>
        </TabsList>
        <TabsContent value={platform} className="mt-0" />
      </Tabs>

      {/* Search and Location Filter */}
      <div className="flex gap-3">
        <Input
          placeholder="Search by name or SKU..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-white border border-gray-200 rounded-md"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border border-gray-200">
              Location {selectedLocationIds.length > 0 && `(${selectedLocationIds.length})`}
              <ChevronDownIcon className="ml-2 size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white border border-gray-200 shadow-lg rounded-md">
            <DropdownMenuLabel>Filter by Location</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-200" />
            {locations.map((loc) => (
              <DropdownMenuCheckboxItem
                key={loc.id}
                checked={selectedLocationIds.includes(loc.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedLocationIds([...selectedLocationIds, loc.id]);
                  } else {
                    setSelectedLocationIds(
                      selectedLocationIds.filter((id) => id !== loc.id)
                    );
                  }
                }}
                className="cursor-pointer"
              >
                {loc.name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Inventory Table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50 border-b border-gray-200">
            <TableRow className="hover:bg-gray-50">
              <TableHead className="text-xs font-semibold text-gray-700 pl-6">
                Image
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-700">
                Name
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-700">SKU</TableHead>
              <TableHead className="text-xs font-semibold text-gray-700 text-right">
                Price
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-700 text-right">
                Qty
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-700">
                Weight
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-700">
                Matching Product
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <TableCell className="pl-6">
                    <ProductImage src={item.imageUrl} alt={item.title} />
                  </TableCell>
                  <TableCell className="font-medium text-gray-900 max-w-xs truncate">
                    {item.title}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{item.sku || '—'}</TableCell>
                  <TableCell className="text-sm text-gray-900 text-right">
                    {formatPrice(item.price)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-900 text-right font-medium">
                    {item.totalQuantity}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatWeight(item.weight, item.weightUnit)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.hasShopifyMapping ? (
                      <span className="px-2 py-1 rounded bg-green-50 text-green-700 font-medium text-xs">
                        Linked
                      </span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-gray-600 hover:text-[#34A853]"
                      >
                        Set Matching Product
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

