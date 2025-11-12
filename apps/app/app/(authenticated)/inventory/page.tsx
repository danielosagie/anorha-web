import { currentUser } from '@repo/auth/server';
import { notFound } from 'next/navigation';
import { getServerSupabaseClient } from '@/lib/supabase/server';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import { Button } from '@repo/design-system/components/ui/button';
import {
  ScanIcon,
  PlusIcon,
  UploadIcon,
  DownloadIcon,
} from 'lucide-react';
import { InventoryClient } from '../inventory-client';
import { PageWrapper } from '../components/page-wrapper';

async function fetchInventoryData(userId: string) {
  const supabase = await getServerSupabaseClient();

  const { data: variants } = await supabase
    .from('ProductVariants')
    .select('Id, Title, Sku, Price, Weight, WeightUnit, PrimaryImageUrl, OnShopify, OnSquare, OnClover, OnAmazon')
    .eq('UserId', userId)
    .limit(500);

  const variantIds = (variants ?? []).map((v: any) => v.Id);

  const [{ data: images }, { data: levels }, { data: mappings }, { data: connections }, { data: locations }] =
    await Promise.all([
      supabase
        .from('ProductImages')
        .select('ProductVariantId, ImageUrl, Position')
        .in('ProductVariantId', variantIds),
      supabase
        .from('InventoryLevels')
        .select('ProductVariantId, Quantity, PlatformLocationId')
        .in('ProductVariantId', variantIds),
      supabase
        .from('PlatformProductMappings')
        .select('ProductVariantId, PlatformConnectionId, IsEnabled')
        .in('ProductVariantId', variantIds),
      supabase
        .from('PlatformConnections')
        .select('Id, PlatformType')
        .eq('UserId', userId),
      supabase
        .from('PlatformLocations')
        .select('PlatformLocationId, Name')
        .eq('UserId', userId),
    ]);

  const connectionById: Record<string, any> = {};
  (connections ?? []).forEach((c: any) => (connectionById[c.Id] = c));

  const firstImageByVariant: Record<string, string | undefined> = {};
  (images ?? [])
    .sort((a: any, b: any) => (a.Position ?? 0) - (b.Position ?? 0))
    .forEach((img: any) => {
      if (!firstImageByVariant[img.ProductVariantId]) {
        firstImageByVariant[img.ProductVariantId] = img.ImageUrl;
      }
    });

  const quantityByVariant: Record<string, number> = {};
  const locationIdsByVariant: Record<string, Set<string>> = {};
  (levels ?? []).forEach((lvl: any) => {
    quantityByVariant[lvl.ProductVariantId] =
      (quantityByVariant[lvl.ProductVariantId] ?? 0) + (lvl.Quantity ?? 0);
    if (!locationIdsByVariant[lvl.ProductVariantId]) {
      locationIdsByVariant[lvl.ProductVariantId] = new Set<string>();
    }
    if (lvl.PlatformLocationId) {
      locationIdsByVariant[lvl.ProductVariantId]!.add(String(lvl.PlatformLocationId));
    }
  });

  const hasShopifyMapByVariant: Record<string, boolean> = {};
  (mappings ?? []).forEach((m: any) => {
    const conn = connectionById[m.PlatformConnectionId];
    if (m.IsEnabled && conn?.PlatformType?.toLowerCase().includes('shopify')) {
      hasShopifyMapByVariant[m.ProductVariantId] = true;
    }
  });

  const items = (variants ?? []).map((v: any) => ({
    id: v.Id,
    title: v.Title ?? '',
    sku: v.Sku ?? undefined,
    price: v.Price ?? undefined,
    weight: v.Weight ?? undefined,
    weightUnit: v.WeightUnit ?? undefined,
    imageUrl: v.PrimaryImageUrl || firstImageByVariant[v.Id],
    totalQuantity: quantityByVariant[v.Id] ?? 0,
    locationIds: Array.from(locationIdsByVariant[v.Id] ?? new Set<string>()),
    onShopify: v.OnShopify,
    onSquare: v.OnSquare,
    onClover: v.OnClover,
    onAmazon: v.OnAmazon,
    hasShopifyMapping: !!hasShopifyMapByVariant[v.Id],
  }));

  const locs = (locations ?? []).map((l: any) => ({
    id: l.PlatformLocationId,
    name: l.Name ?? 'Unnamed Location',
  }));

  return { items, locations: locs };
}

export default async function InventoryPage() {
  const user = await currentUser();
  if (!user) notFound();

  const { items, locations } = await fetchInventoryData(user.id);

  return (
    <div className="flex flex-1 flex-col p-2 min-h-[100vh]" style={{ backgroundColor: '#FEF4DD' }}>
      <PageWrapper title="Inventory" description="Manage inventory across all your platforms">
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <Button variant="outline" size="sm">
            <ScanIcon className="mr-2 size-4" />
            Scan Inventory
          </Button>
          <Button size="sm" style={{ backgroundColor: '#34A853', color: 'white' }}>
            <PlusIcon className="mr-2 size-4" />
            Add Product
          </Button>
          <Button variant="outline" size="sm">
            <UploadIcon className="mr-2 size-4" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <DownloadIcon className="mr-2 size-4" />
            Export
          </Button>
        </div>
        <InventoryClient items={items} locations={locations} />
      </PageWrapper>
    </div>
  );
}
