import { getServerSupabaseClient } from '@/lib/supabase/server';
import { currentUser } from '@repo/auth/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageWrapper } from '../../components/page-wrapper';
import type {
  InventoryLevel,
  PlatformConnection,
  PlatformMapping,
  ProductDetailData,
  ProductImage,
  ProductVariant,
} from '../contract';
import { ProductDetailClient } from './product-detail-client';

export const metadata: Metadata = {
  title: 'Product | Anorha',
};

type VariantRow = {
  Id: string;
  ProductId: string;
  Title: string | null;
  Description: string | null;
  Sku: string | null;
  Price: number | string | null;
  CompareAtPrice: number | string | null;
  Condition: string | null;
  VariantType: string | null;
};

type ImageRow = {
  Id: string;
  ProductVariantId: string;
  ImageUrl: string;
  AltText: string | null;
  Position: number | null;
};

type InventoryRow = {
  Id: string;
  ProductVariantId: string;
  PlatformConnectionId: string | null;
  PlatformLocationId: string | null;
  Quantity: number | null;
};

type ConnectionRow = {
  Id: string;
  PlatformType: string | null;
  DisplayName: string | null;
  IsEnabled: boolean | null;
  Status: string | null;
};

type MappingRow = {
  Id: string;
  ProductVariantId: string;
  PlatformConnectionId: string;
  PlatformProductId: string | null;
  IsEnabled: boolean | null;
  SyncStatus: string | null;
  SyncErrorMessage: string | null;
  PlatformSpecificData: Record<string, unknown> | null;
  LastSyncedAt: string | null;
};

type LocationRow = {
  PlatformLocationId: string;
  Name: string | null;
};

function numberValue(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function getProduct(
  id: string,
  userId: string
): Promise<ProductDetailData> {
  const supabase = await getServerSupabaseClient();
  const { data: activeRaw } = await supabase
    .from('ProductVariants')
    .select(
      'Id, ProductId, Title, Description, Sku, Price, CompareAtPrice, Condition, VariantType'
    )
    .eq('Id', id)
    .eq('UserId', userId)
    .maybeSingle();

  const active = activeRaw as VariantRow | null;
  if (!active) {
    notFound();
  }

  const [{ data: variantRows }, { data: connectionRows }] = await Promise.all([
    supabase
      .from('ProductVariants')
      .select(
        'Id, ProductId, Title, Description, Sku, Price, CompareAtPrice, Condition, VariantType'
      )
      .eq('ProductId', active.ProductId)
      .eq('UserId', userId)
      .order('CreatedAt', { ascending: true }),
    supabase
      .from('PlatformConnections')
      .select('Id, PlatformType, DisplayName, IsEnabled, Status')
      .eq('UserId', userId),
  ]);

  const variantsRaw = (variantRows ?? []) as VariantRow[];
  const variantIds = variantsRaw.map((variant) => variant.Id);

  let imageRows: ImageRow[] = [];
  let inventoryRows: InventoryRow[] = [];
  let mappingRows: MappingRow[] = [];
  let locationRows: LocationRow[] = [];

  if (variantIds.length > 0) {
    const [imagesResult, inventoryResult, mappingsResult, locationsResult] =
      await Promise.all([
        supabase
          .from('ProductImages')
          .select('Id, ProductVariantId, ImageUrl, AltText, Position')
          .in('ProductVariantId', variantIds)
          .order('Position', { ascending: true }),
        supabase
          .from('InventoryLevels')
          .select(
            'Id, ProductVariantId, PlatformConnectionId, PlatformLocationId, Quantity'
          )
          .in('ProductVariantId', variantIds),
        supabase
          .from('PlatformProductMappings')
          .select(
            'Id, ProductVariantId, PlatformConnectionId, PlatformProductId, IsEnabled, SyncStatus, SyncErrorMessage, PlatformSpecificData, LastSyncedAt'
          )
          .in('ProductVariantId', variantIds),
        supabase
          .from('PlatformLocations')
          .select('PlatformLocationId, Name')
          .eq('UserId', userId),
      ]);

    imageRows = (imagesResult.data ?? []) as ImageRow[];
    inventoryRows = (inventoryResult.data ?? []) as InventoryRow[];
    mappingRows = (mappingsResult.data ?? []) as MappingRow[];
    locationRows = (locationsResult.data ?? []) as LocationRow[];
  }

  const locationNames = new Map(
    locationRows.map((location) => [
      location.PlatformLocationId,
      location.Name || 'Location',
    ])
  );

  const variants: ProductVariant[] = variantsRaw.map((variant) => ({
    id: variant.Id,
    productId: variant.ProductId,
    title: variant.Title || 'Untitled',
    description: variant.Description || '',
    sku: variant.Sku || '',
    price: numberValue(variant.Price),
    compareAtPrice:
      variant.CompareAtPrice === null
        ? null
        : numberValue(variant.CompareAtPrice),
    condition: variant.Condition || 'used',
    variantType: variant.VariantType,
  }));

  const images: ProductImage[] = imageRows.map((image) => ({
    id: image.Id,
    variantId: image.ProductVariantId,
    url: image.ImageUrl,
    alt: image.AltText || 'Product photo',
    position: image.Position ?? 0,
  }));

  const inventory: InventoryLevel[] = inventoryRows.map((level) => ({
    id: level.Id,
    variantId: level.ProductVariantId,
    connectionId: level.PlatformConnectionId,
    locationId: level.PlatformLocationId,
    locationName: level.PlatformLocationId
      ? locationNames.get(level.PlatformLocationId) || 'Location'
      : 'Default',
    quantity: level.Quantity ?? 0,
  }));

  const connections: PlatformConnection[] = (
    (connectionRows ?? []) as ConnectionRow[]
  ).map((connection) => ({
    id: connection.Id,
    platformType: connection.PlatformType || 'unknown',
    displayName:
      connection.DisplayName || connection.PlatformType || 'Connection',
    isEnabled: connection.IsEnabled ?? true,
    status: connection.Status,
  }));

  const mappings: PlatformMapping[] = mappingRows.map((mapping) => ({
    id: mapping.Id,
    variantId: mapping.ProductVariantId,
    connectionId: mapping.PlatformConnectionId,
    platformProductId: mapping.PlatformProductId || '',
    isEnabled: mapping.IsEnabled ?? true,
    syncStatus: mapping.SyncStatus,
    syncError: mapping.SyncErrorMessage,
    platformData: mapping.PlatformSpecificData || {},
    lastSyncedAt: mapping.LastSyncedAt,
  }));

  return {
    activeVariantId: active.Id,
    productId: active.ProductId,
    variants,
    images,
    inventory,
    connections,
    mappings,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  if (!user) {
    notFound();
  }

  const { id } = await params;
  const product = await getProduct(id, user.id);

  return (
    <PageWrapper title="Product" description="Edit, stock, and publish.">
      <ProductDetailClient product={product} />
    </PageWrapper>
  );
}
