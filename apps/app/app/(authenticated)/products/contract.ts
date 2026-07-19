export type ProductVariant = {
  id: string;
  productId: string;
  title: string;
  description: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  condition: string;
  variantType: string | null;
};

export type ProductImage = {
  id: string;
  variantId: string;
  url: string;
  alt: string;
  position: number;
};

export type InventoryLevel = {
  id: string;
  variantId: string;
  connectionId: string | null;
  locationId: string | null;
  locationName: string;
  quantity: number;
};

export type PlatformConnection = {
  id: string;
  platformType: string;
  displayName: string;
  isEnabled: boolean;
  status: string | null;
};

export type PlatformMapping = {
  id: string;
  variantId: string;
  connectionId: string;
  platformProductId: string;
  isEnabled: boolean;
  syncStatus: string | null;
  syncError: string | null;
  platformData: Record<string, unknown>;
  lastSyncedAt: string | null;
};

export type ProductDetailData = {
  activeVariantId: string;
  productId: string;
  variants: ProductVariant[];
  images: ProductImage[];
  inventory: InventoryLevel[];
  connections: PlatformConnection[];
  mappings: PlatformMapping[];
};

export type GeneratedPlatformDetails = {
  title?: string;
  description?: string;
  price?: number | string;
  condition?: string;
  [key: string]: unknown;
};

export type GenerateJobResult = {
  productIndex: number;
  productId?: string;
  variantId?: string;
  platforms: Record<string, GeneratedPlatformDetails>;
  sourceImageUrl: string;
  error?: string;
};

export type GenerateJobStatus = {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  currentStage?: string;
  progress?: {
    totalProducts: number;
    completedProducts: number;
    failedProducts: number;
    stagePercentage: number;
  };
  results?: GenerateJobResult[];
  error?: string;
};

export type PublishResult = {
  platform: string;
  connectionId: string;
  success: boolean;
  error?: string;
  reauthRequired?: boolean;
};

export type PublishResponse = {
  message?: string;
  results?: PublishResult[];
};

const TRAILING_SLASHES = /\/+$/;
const API_SUFFIX = /\/api$/;
const PLATFORM_LABELS: Record<string, string> = {
  clover: 'Clover',
  ebay: 'eBay',
  facebook: 'Facebook',
  shopify: 'Shopify',
  square: 'Square',
  whatnot: 'Whatnot',
};

export function apiUrl(path: string) {
  const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333')
    .replace(TRAILING_SLASHES, '')
    .replace(API_SUFFIX, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function platformKey(value: string) {
  return value.trim().toLowerCase();
}

export function platformLabel(value: string) {
  const key = platformKey(value);
  return PLATFORM_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

export function readError(value: unknown, fallback: string) {
  if (!value || typeof value !== 'object') {
    return fallback;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.message === 'string') {
    return record.message;
  }
  if (typeof record.error === 'string') {
    return record.error;
  }
  return fallback;
}
