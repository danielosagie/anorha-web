import { currentUser } from '@repo/auth/server';
import { notFound } from 'next/navigation';
import { getServerSupabaseClient } from '@/lib/supabase/server';
import { Button } from '@repo/design-system/components/ui/button';
import {
  ScanIcon,
  PlusIcon,
  UploadIcon,
  DownloadIcon,
} from 'lucide-react';
import { InventoryClient } from '../inventory-client';
import { PageWrapper } from '../components/page-wrapper';

function toPlatformKey(name?: string | null) {
  return (name ?? 'unknown').toLowerCase();
}

async function fetchInventoryData(userId: string) {
  const supabase = await getServerSupabaseClient();

  const { data: variants } = await supabase
    .from('ProductVariants')
    .select(
      'Id, Title, Sku, Price, Weight, WeightUnit, PrimaryImageUrl, OnShopify, OnSquare, OnClover, OnAmazon'
    )
    .eq('UserId', userId)
    .limit(500);

  const variantIds = (variants ?? []).map((v: any) => v.Id);

  const [{ data: connections }, { data: locations }] = await Promise.all([
    supabase
      .from('PlatformConnections')
      .select('Id, PlatformType, DisplayName, IsEnabled, Status')
      .eq('UserId', userId),
    supabase
      .from('PlatformLocations')
      .select('PlatformLocationId, Name, PlatformConnectionId')
      .eq('UserId', userId),
  ]);

  let images: any[] | null = [];
  let levels: any[] | null = [];
  let mappings: any[] | null = [];

  if (variantIds.length > 0) {
    const [
      { data: imagesData },
      { data: levelsData },
      { data: mappingsData },
    ] = await Promise.all([
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
        .select(
          'ProductVariantId, PlatformConnectionId, IsEnabled, PlatformSpecificData'
        )
        .in('ProductVariantId', variantIds),
    ]);

    images = imagesData;
    levels = levelsData;
    mappings = mappingsData;
  }

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
  const connectionIdsByVariant: Record<string, Set<string>> = {};
  const platformDataByVariant: Record<
    string,
    Record<string, Record<string, any>>
  > = {};
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
    if (!connectionIdsByVariant[m.ProductVariantId]) {
      connectionIdsByVariant[m.ProductVariantId] = new Set<string>();
    }
    if (m.PlatformConnectionId) {
      connectionIdsByVariant[m.ProductVariantId]!.add(m.PlatformConnectionId);
    }
    if (!platformDataByVariant[m.ProductVariantId]) {
      platformDataByVariant[m.ProductVariantId] = {};
    }
    if (conn?.PlatformType) {
      const platformKey = toPlatformKey(conn.PlatformType);
      platformDataByVariant[m.ProductVariantId][platformKey] =
        (m.PlatformSpecificData as Record<string, any>) ?? {};
    }
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
    connectionIds: Array.from(connectionIdsByVariant[v.Id] ?? new Set<string>()),
    platformData: platformDataByVariant[v.Id] ?? {},
    onShopify: v.OnShopify,
    onSquare: v.OnSquare,
    onClover: v.OnClover,
    onAmazon: v.OnAmazon,
    hasShopifyMapping: !!hasShopifyMapByVariant[v.Id],
  }));

  const locs = (locations ?? []).map((l: any) => {
    const parentConnection = connectionById[l.PlatformConnectionId ?? ''];
    return {
      id: l.PlatformLocationId,
      name: l.Name ?? 'Unnamed Location',
      connectionId: l.PlatformConnectionId ?? null,
      connectionName:
        parentConnection?.DisplayName ??
        parentConnection?.PlatformType ??
        'Connection',
      platformType: parentConnection?.PlatformType ?? 'Unknown',
    };
  });

  const connectionList = (connections ?? []).map((c: any) => ({
    id: c.Id,
    platformType: c.PlatformType ?? 'Unknown',
    displayName: c.DisplayName || c.PlatformType || 'Connection',
    isEnabled: c.IsEnabled ?? true,
    status: c.Status ?? null,
  }));

  return { items, locations: locs, connections: connectionList };
}

export const InventoryContent = async () => {
  const user = await currentUser();
  if (!user) notFound();

  const { items, locations, connections } = await fetchInventoryData(user.id);

  return (
    <div
      className="flex flex-1 flex-col p-2 min-h-[100vh]"
      style={{ backgroundColor: '#FEF4DD' }}
    >
      <PageWrapper>
        <div className="flex flex-col gap-3 border-b border-gray-200 pb-4 mb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
            <p className="text-gray-600">
              Manage inventory across all your platforms
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              className="border-[#34A853] text-[#34A853] hover:bg-[#34A853]/10"
            >
              <ScanIcon className="mr-2 size-4" />
              Scan Inventory
            </Button>
            <Button
              size="sm"
              className="bg-[#34A853] hover:bg-[#2d8f48] text-white border border-[#34A853]"
            >
              <PlusIcon className="mr-2 size-4" />
              Add Product
            </Button>
            <Button variant="outline" size="sm" className="text-gray-700">
              <UploadIcon className="mr-2 size-4" />
              Import
            </Button>
            <Button variant="outline" size="sm" className="text-gray-700">
              <DownloadIcon className="mr-2 size-4" />
              Export
            </Button>
          </div>
        </div>
        <InventoryClient
          items={items}
          locations={locations}
          connections={connections}
        />
      </PageWrapper>
    </div>
  );
}


