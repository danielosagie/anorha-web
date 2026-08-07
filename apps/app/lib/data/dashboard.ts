import { getServerSupabaseClient } from '@/lib/supabase/server';
import { type ActivityRecord, getActivityData } from './activity';
import {
  type CommerceScope,
  type PlatformConnection,
  getOrgConnections,
  resolveCommerceScope,
  toFiniteNumber,
} from './context';
import { type OrderRecord, getOrders } from './orders';

const LABEL_SEPARATOR = /[\s_-]+/;

export type DashboardData = {
  revenue: number;
  orderCount: number;
  salesLastTwelveMonths: number;
  revenueChangePercent: number | null;
  inventoryValue: number;
  inventoryUnits: number;
  monthlyRevenue: Array<{
    month: string;
    label: string;
    revenue: number;
  }>;
  channelRevenue: Array<{
    platform: string;
    label: string;
    revenue: number;
    orders: number;
  }>;
  connections: Array<{
    id: string;
    platform: string;
    name: string;
    productCount: number;
  }>;
  recentOrders: OrderRecord[];
  recentActivity: ActivityRecord[];
  loadError: string | null;
};

type AmountRow = {
  readonly TotalAmount: number | string;
  readonly OrderDate: string;
  readonly PlatformConnectionId: string;
};
type InventoryRow = {
  readonly ProductVariantId: string;
  readonly PlatformConnectionId: string | null;
  readonly Quantity: number;
  readonly ProductVariants:
    | { readonly Price: number | string }
    | ReadonlyArray<{ readonly Price: number | string }>
    | null;
};

export async function getDashboardData(
  scope: CommerceScope
): Promise<DashboardData> {
  const supabase = await getServerSupabaseClient();
  const resolved = await resolveCommerceScope(supabase, scope);
  if (!resolved.dbOrgId) {
    return {
      revenue: 0,
      orderCount: 0,
      salesLastTwelveMonths: 0,
      revenueChangePercent: null,
      inventoryValue: 0,
      inventoryUnits: 0,
      monthlyRevenue: buildMonthBuckets(new Date()),
      channelRevenue: [],
      connections: [],
      recentOrders: [],
      recentActivity: [],
      loadError: 'Workspace data is unavailable.',
    };
  }

  const connectionResult = await getOrgConnections(supabase, resolved.dbOrgId);
  const connectionIds = connectionResult.connections.map(
    (connection) => connection.id
  );
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const periodStart = new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() - 11, 1)
  );

  const periodOrdersPromise =
    connectionIds.length > 0
      ? supabase
          .from('Orders')
          .select('TotalAmount, OrderDate, PlatformConnectionId')
          .in('PlatformConnectionId', connectionIds)
          .gte('OrderDate', periodStart.toISOString())
      : Promise.resolve({ data: [], error: null });
  const inventoryPromise = supabase
    .from('InventoryLevels')
    .select(
      'ProductVariantId, PlatformConnectionId, Quantity, ProductVariants!inner(Price)'
    )
    .eq('OrgId', resolved.dbOrgId);
  const recentOrdersPromise = getOrders(scope, { pageSize: 5 });
  const recentActivityPromise = getActivityData(scope, { limit: 5 });

  const [periodOrdersResult, inventoryResult, recentOrders, recentActivity] =
    await Promise.all([
      periodOrdersPromise,
      inventoryPromise,
      recentOrdersPromise,
      recentActivityPromise,
    ]);

  const orderRows = (periodOrdersResult.data ??
    []) as unknown as readonly AmountRow[];
  const inventoryRows = (inventoryResult.data ??
    []) as unknown as readonly InventoryRow[];
  const inventorySummary = summarizeInventory(inventoryRows);
  const salesSummary = summarizeSales(
    orderRows,
    connectionResult.connections,
    monthStart
  );

  const hasError =
    Boolean(connectionResult.error) ||
    Boolean(periodOrdersResult.error) ||
    Boolean(inventoryResult.error) ||
    Boolean(recentOrders.loadError) ||
    Boolean(recentActivity.loadError);

  return {
    revenue: salesSummary.revenue,
    orderCount: salesSummary.orderCount,
    salesLastTwelveMonths: salesSummary.monthlyRevenue.reduce(
      (sum, month) => sum + month.revenue,
      0
    ),
    revenueChangePercent: salesSummary.revenueChangePercent,
    inventoryValue: inventorySummary.inventoryValue,
    inventoryUnits: inventorySummary.inventoryUnits,
    monthlyRevenue: salesSummary.monthlyRevenue,
    channelRevenue: salesSummary.channelRevenue,
    connections: connectionResult.connections.map((connection) => ({
      id: connection.id,
      platform: connection.platformType,
      name: connection.displayName,
      productCount:
        inventorySummary.productIdsByConnection.get(connection.id)?.size ?? 0,
    })),
    recentOrders: recentOrders.orders,
    recentActivity: recentActivity.events,
    loadError: hasError ? 'Some data could not load.' : null,
  };
}

function summarizeInventory(rows: readonly InventoryRow[]) {
  let inventoryValue = 0;
  let inventoryUnits = 0;
  const productIdsByConnection = new Map<string, Set<string>>();

  for (const row of rows) {
    const variant = Array.isArray(row.ProductVariants)
      ? row.ProductVariants[0]
      : row.ProductVariants;
    inventoryUnits += row.Quantity;
    inventoryValue += row.Quantity * toFiniteNumber(variant?.Price);
    if (row.PlatformConnectionId) {
      const productIds =
        productIdsByConnection.get(row.PlatformConnectionId) ??
        new Set<string>();
      productIds.add(row.ProductVariantId);
      productIdsByConnection.set(row.PlatformConnectionId, productIds);
    }
  }

  return { inventoryValue, inventoryUnits, productIdsByConnection };
}

function summarizeSales(
  rows: readonly AmountRow[],
  connections: readonly PlatformConnection[],
  monthStart: Date
) {
  const monthlyRevenue = buildMonthBuckets(monthStart);
  const monthByKey = new Map(
    monthlyRevenue.map((month) => [month.month, month])
  );
  const connectionById = new Map(
    connections.map((connection) => [connection.id, connection])
  );
  const channelByPlatform = new Map<
    string,
    { platform: string; label: string; revenue: number; orders: number }
  >();
  const previousMonthStart = new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() - 1, 1)
  );
  let revenue = 0;
  let orderCount = 0;
  let previousMonthRevenue = 0;

  for (const order of rows) {
    const orderDate = new Date(order.OrderDate);
    const amount = toFiniteNumber(order.TotalAmount);
    const bucket = monthByKey.get(monthKeyFor(orderDate));
    if (bucket) {
      bucket.revenue += amount;
    }

    if (orderDate >= monthStart) {
      revenue += amount;
      orderCount += 1;
    } else if (orderDate >= previousMonthStart) {
      previousMonthRevenue += amount;
    }

    const connection = connectionById.get(order.PlatformConnectionId);
    const platform = connection?.platformType.toLowerCase() ?? 'other';
    const channel = channelByPlatform.get(platform) ?? {
      platform,
      label: toDisplayLabel(connection?.platformType ?? 'Other'),
      revenue: 0,
      orders: 0,
    };
    channel.revenue += amount;
    channel.orders += 1;
    channelByPlatform.set(platform, channel);
  }

  return {
    revenue,
    orderCount,
    monthlyRevenue,
    revenueChangePercent:
      previousMonthRevenue > 0
        ? ((revenue - previousMonthRevenue) / previousMonthRevenue) * 100
        : null,
    channelRevenue: Array.from(channelByPlatform.values()).sort(
      (a, b) => b.revenue - a.revenue
    ),
  };
}

function monthKeyFor(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function buildMonthBuckets(anchor: Date): DashboardData['monthlyRevenue'] {
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(
      Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - 11 + index, 1)
    );
    return {
      month: monthKeyFor(date),
      label: formatter.format(date),
      revenue: 0,
    };
  });
}

function toDisplayLabel(value: string): string {
  return value
    .split(LABEL_SEPARATOR)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}
