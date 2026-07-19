import { getServerSupabaseClient } from '@/lib/supabase/server';
import {
  type CommerceScope,
  asRecord,
  getOrgConnections,
  resolveCommerceScope,
  toFiniteNumber,
} from './context';

export type ActivityCategory =
  | 'order'
  | 'inventory'
  | 'product'
  | 'sync'
  | 'error'
  | 'other';

export type ActivityRecord = {
  id: string;
  timestamp: string;
  eventType: string;
  category: ActivityCategory;
  title: string;
  subject: string;
  detail: string | null;
  platform: string | null;
  status: string;
  amount: number | null;
};

export type ActivityData = {
  events: ActivityRecord[];
  categories: ActivityCategory[];
  loadError: string | null;
};

type ActivityRow = {
  readonly Id: number | string;
  readonly Timestamp: string;
  readonly UserId: string | null;
  readonly PlatformConnectionId: string | null;
  readonly EventType: string;
  readonly Status: string;
  readonly Message: string;
  readonly Details: unknown;
  readonly ProductVariantId: string | null;
  readonly PlatformType: string | null;
};

type VariantRow = {
  readonly Id: string;
  readonly Title: string;
  readonly Sku: string;
};

const EXCLUDED_EVENT_TYPES = new Set([
  'DASHBOARD_INSIGHT_VIEWED',
  'DASHBOARD_VIEWED',
  'USER_VIEWED_DASHBOARD',
  'USER_VIEWED_PRODUCT',
  'USER_VIEWED_INVENTORY',
  'WEBHOOK_RECEIVED',
  'WEBHOOK_SYNC_SUCCESS',
  'WEBHOOK_SYNC_FAILED',
  'WEBHOOK_PROCESSED',
  'SHOPIFY_WEBHOOK_PRODUCTS_UPDATE',
  'SHOPIFY_WEBHOOK_PRODUCTS_CREATE',
  'SHOPIFY_WEBHOOK_PRODUCTS_DELETE',
  'SHOPIFY_WEBHOOK_INVENTORY_UPDATE',
  'SQUARE_WEBHOOK_RECEIVED',
  'SQUARE_WEBHOOK_PROCESSED',
  'SYNC_STARTED',
  'SYNC_COMPLETED',
  'SYNC_FAILED',
  'SYNC_RUNNING',
  'ACCESS_REQUEST',
  'ACCESS_GRANTED',
  'ACCESS_DENIED',
  'SCAN_STARTED',
  'SCAN_PROCESSING',
]);

function pickString(
  details: Readonly<Record<string, unknown>>,
  keys: readonly string[]
): string | null {
  for (const key of keys) {
    const value = details[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    if (typeof value === 'number') {
      return String(value);
    }
  }
  return null;
}

function pickNumber(
  details: Readonly<Record<string, unknown>>,
  keys: readonly string[]
): number | null {
  for (const key of keys) {
    const value = details[key];
    const parsed = toFiniteNumber(value);
    if (parsed !== 0 || value === 0 || value === '0') {
      return parsed;
    }
  }
  return null;
}

export function getActivityCategory(eventType: string): ActivityCategory {
  const type = eventType.toUpperCase();
  if (type.includes('ERROR') || type.includes('FAILED')) {
    return 'error';
  }
  if (type.includes('ORDER')) {
    return 'order';
  }
  if (type.includes('INVENTORY')) {
    return 'inventory';
  }
  if (type.includes('PRODUCT') || type.includes('CANONICAL_DRAFT')) {
    return 'product';
  }
  if (type.includes('SYNC') || type.includes('PUBLISH')) {
    return 'sync';
  }
  return 'other';
}

function eventTitle(
  eventType: string,
  details: Readonly<Record<string, unknown>>
): string {
  const type = eventType.toUpperCase();
  if (type.includes('INVENTORY_ADJUSTMENT')) {
    return 'Inventory adjustment';
  }
  if (type.includes('INVENTORY')) {
    return 'Inventory update';
  }
  if (
    type.includes('PRODUCT_PUBLISH_COMPLETED') ||
    type.includes('PRODUCT_PUBLISHED')
  ) {
    return 'Product published';
  }
  if (type.includes('PRODUCT_PUBLISH')) {
    return 'Publishing product';
  }
  if (type.includes('PRODUCT_UPDATED') || type.includes('CANONICAL_DRAFT')) {
    return 'Product updated';
  }
  if (type.includes('PRODUCT_CREATED')) {
    return 'Product created';
  }
  if (type.includes('ORDER')) {
    const orderNumber = pickString(details, [
      'orderNumber',
      'order_id',
      'name',
      'Order',
    ]);
    return orderNumber ? `Order #${orderNumber}` : 'Order update';
  }
  if (type.includes('SYNC')) {
    return 'Sync update';
  }
  if (type.includes('ERROR') || type.includes('FAILED')) {
    return 'Action failed';
  }
  return 'Activity';
}

function eventDetail(
  category: ActivityCategory,
  details: Readonly<Record<string, unknown>>,
  message: string
): string | null {
  if (category === 'inventory') {
    const delta = pickNumber(details, ['quantityDelta', 'quantity_delta']);
    const reason = pickString(details, ['reason', 'adjustment_reason']);
    const pieces: string[] = [];
    if (delta !== null && delta !== 0) {
      pieces.push(`${delta > 0 ? '+' : ''}${delta} units`);
    }
    if (reason) {
      pieces.push(reason);
    }
    if (pieces.length > 0) {
      return pieces.join(', ');
    }
  }
  return message.trim() || null;
}

export async function getActivityData(
  scope: CommerceScope,
  options: { category?: ActivityCategory; limit?: number } = {}
): Promise<ActivityData> {
  const supabase = await getServerSupabaseClient();
  const resolved = await resolveCommerceScope(supabase, scope);
  if (!resolved.dbOrgId) {
    return {
      events: [],
      categories: [],
      loadError: 'Workspace data is unavailable.',
    };
  }

  const requestedLimit = Math.min(200, Math.max(1, options.limit ?? 100));
  const connectionPromise = getOrgConnections(supabase, resolved.dbOrgId);
  const activityPromise = supabase
    .from('ActivityLogs')
    .select(
      'Id, Timestamp, UserId, PlatformConnectionId, EventType, Status, Message, Details, ProductVariantId, PlatformType'
    )
    .eq('OrgId', resolved.dbOrgId)
    .order('Timestamp', { ascending: false })
    .limit(Math.min(600, requestedLimit * 3));
  const [connectionResult, activityResult] = await Promise.all([
    connectionPromise,
    activityPromise,
  ]);

  if (activityResult.error) {
    return {
      events: [],
      categories: [],
      loadError: 'Activity could not load.',
    };
  }

  const rows = (activityResult.data ?? []) as unknown as readonly ActivityRow[];
  const meaningfulRows = rows.filter((row) => {
    const type = row.EventType.toUpperCase();
    return (
      !EXCLUDED_EVENT_TYPES.has(type) &&
      !(type.includes('WEBHOOK') && !type.includes('ERROR'))
    );
  });
  const mobileRows = meaningfulRows.filter((row) => {
    const category = getActivityCategory(row.EventType);
    return (
      category === 'order' || category === 'inventory' || category === 'product'
    );
  });
  const visibleRows = mobileRows.length > 0 ? mobileRows : meaningfulRows;
  const variantIds = Array.from(
    new Set(
      visibleRows
        .map((row) => row.ProductVariantId)
        .filter((id): id is string => Boolean(id))
    )
  );
  const variantResult =
    variantIds.length > 0
      ? await supabase
          .from('ProductVariants')
          .select('Id, Title, Sku')
          .in('Id', variantIds)
      : { data: [], error: null };
  const variants = (variantResult.data ??
    []) as unknown as readonly VariantRow[];
  const variantById = new Map(variants.map((variant) => [variant.Id, variant]));
  const connectionById = new Map(
    connectionResult.connections.map((connection) => [
      connection.id,
      connection,
    ])
  );

  const mapped = visibleRows.map((row): ActivityRecord => {
    const details = asRecord(row.Details);
    const category = getActivityCategory(row.EventType);
    const variant = row.ProductVariantId
      ? variantById.get(row.ProductVariantId)
      : undefined;
    const subject =
      variant?.Title ??
      pickString(details, ['title', 'productTitle', 'name']) ??
      row.Message;
    const detail = eventDetail(category, details, row.Message);
    return {
      id: String(row.Id),
      timestamp: row.Timestamp,
      eventType: row.EventType,
      category,
      title: eventTitle(row.EventType, details),
      subject,
      detail: detail === subject ? null : detail,
      platform:
        row.PlatformType ??
        (row.PlatformConnectionId
          ? (connectionById.get(row.PlatformConnectionId)?.platformType ?? null)
          : null),
      status: row.Status,
      amount: pickNumber(details, [
        'total',
        'amount',
        'orderTotal',
        'totalPrice',
        'total_price',
        'subtotal_price',
        'price',
        'grandTotal',
      ]),
    };
  });
  const categories = Array.from(new Set(mapped.map((event) => event.category)));
  const filtered = options.category
    ? mapped.filter((event) => event.category === options.category)
    : mapped;

  return {
    events: filtered.slice(0, requestedLimit),
    categories,
    loadError: connectionResult.error
      ? 'Some platform names are unavailable.'
      : null,
  };
}
