import { getServerSupabaseClient } from '@/lib/supabase/server';
import {
  type CommerceScope,
  type ServerSupabaseClient,
  getOrgConnections,
  resolveCommerceScope,
  toFiniteNumber,
} from './context';

export type AnalyticsRange = '7d' | '30d' | '90d' | '1y';

export type AnalyticsData = {
  range: AnalyticsRange;
  metrics: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    trends: {
      revenue: number | null;
      orders: number | null;
      average: number | null;
    };
  };
  revenueByDay: Array<{ date: string; revenue: number; orders: number }>;
  channelPerformance: Array<{
    channel: string;
    revenue: number;
    percentage: number;
    orders: number;
  }>;
  topProducts: Array<{
    id: string;
    title: string;
    sku: string;
    revenue: number;
    units: number;
  }>;
  orderItemsAvailable: boolean;
  loadError: string | null;
};

type AnalyticsOrderRow = {
  readonly Id: string;
  readonly PlatformConnectionId: string;
  readonly TotalAmount: number | string;
  readonly OrderDate: string;
};

type AnalyticsItemRow = {
  readonly OrderId: string;
  readonly ProductVariantId: string | null;
  readonly Title: string;
  readonly Sku: string;
  readonly Price: number | string;
  readonly Quantity: number;
};

const PAGE_SIZE = 1000;

function rangeDays(range: AnalyticsRange): number {
  if (range === '7d') {
    return 7;
  }
  if (range === '30d') {
    return 30;
  }
  if (range === '90d') {
    return 90;
  }
  return 365;
}

async function fetchOrders(
  supabase: ServerSupabaseClient,
  connectionIds: string[],
  start: Date,
  end: Date
): Promise<{ rows: AnalyticsOrderRow[]; error: string | null }> {
  const rows: AnalyticsOrderRow[] = [];
  let offset = 0;
  while (true) {
    const result = await supabase
      .from('Orders')
      .select('Id, PlatformConnectionId, TotalAmount, OrderDate')
      .in('PlatformConnectionId', connectionIds)
      .gte('OrderDate', start.toISOString())
      .lt('OrderDate', end.toISOString())
      .order('OrderDate', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (result.error) {
      return { rows: [], error: result.error.message };
    }
    const page = (result.data ?? []) as unknown as AnalyticsOrderRow[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) {
      break;
    }
    offset += PAGE_SIZE;
  }
  return { rows, error: null };
}

async function fetchItems(
  supabase: ServerSupabaseClient,
  orderIds: string[]
): Promise<{ rows: AnalyticsItemRow[]; error: string | null }> {
  const rows: AnalyticsItemRow[] = [];
  for (let index = 0; index < orderIds.length; index += 100) {
    const ids = orderIds.slice(index, index + 100);
    const result = await supabase
      .from('OrderItems')
      .select('OrderId, ProductVariantId, Title, Sku, Price, Quantity')
      .in('OrderId', ids);
    if (result.error) {
      return { rows: [], error: result.error.message };
    }
    rows.push(
      ...((result.data ?? []) as unknown as readonly AnalyticsItemRow[])
    );
  }
  return { rows, error: null };
}

function trend(current: number, previous: number): number | null {
  return previous > 0 ? ((current - previous) / previous) * 100 : null;
}

export async function getAnalyticsData(
  scope: CommerceScope,
  range: AnalyticsRange = '30d'
): Promise<AnalyticsData> {
  const empty: AnalyticsData = {
    range,
    metrics: {
      totalRevenue: 0,
      totalOrders: 0,
      avgOrderValue: 0,
      trends: { revenue: null, orders: null, average: null },
    },
    revenueByDay: [],
    channelPerformance: [],
    topProducts: [],
    orderItemsAvailable: true,
    loadError: null,
  };
  const supabase = await getServerSupabaseClient();
  const resolved = await resolveCommerceScope(supabase, scope);
  if (!resolved.dbOrgId) {
    return { ...empty, loadError: 'Workspace data is unavailable.' };
  }

  const connectionResult = await getOrgConnections(supabase, resolved.dbOrgId);
  const connectionIds = connectionResult.connections.map(
    (connection) => connection.id
  );
  if (connectionResult.error) {
    return { ...empty, loadError: 'Analytics could not load.' };
  }
  if (connectionIds.length === 0) {
    return empty;
  }

  const days = rangeDays(range);
  const end = new Date();
  const start = new Date(end.getTime() - days * 86_400_000);
  const previousStart = new Date(start.getTime() - days * 86_400_000);
  const [currentResult, previousResult] = await Promise.all([
    fetchOrders(supabase, connectionIds, start, end),
    fetchOrders(supabase, connectionIds, previousStart, start),
  ]);
  if (currentResult.error || previousResult.error) {
    return { ...empty, loadError: 'Analytics could not load.' };
  }

  const currentOrders = currentResult.rows;
  const previousOrders = previousResult.rows;
  const totalRevenue = currentOrders.reduce(
    (sum, order) => sum + toFiniteNumber(order.TotalAmount),
    0
  );
  const previousRevenue = previousOrders.reduce(
    (sum, order) => sum + toFiniteNumber(order.TotalAmount),
    0
  );
  const totalOrders = currentOrders.length;
  const previousCount = previousOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const previousAverage =
    previousCount > 0 ? previousRevenue / previousCount : 0;

  const dayMap = new Map<string, { revenue: number; orders: number }>();
  for (const order of currentOrders) {
    const date = order.OrderDate.slice(0, 10);
    const current = dayMap.get(date) ?? { revenue: 0, orders: 0 };
    current.revenue += toFiniteNumber(order.TotalAmount);
    current.orders += 1;
    dayMap.set(date, current);
  }
  const revenueByDay: AnalyticsData['revenueByDay'] = [];
  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(end.getTime() - index * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const day = dayMap.get(date) ?? { revenue: 0, orders: 0 };
    revenueByDay.push({ date, ...day });
  }

  const connectionById = new Map(
    connectionResult.connections.map((connection) => [
      connection.id,
      connection,
    ])
  );
  const channelMap = new Map<string, { revenue: number; orders: number }>();
  for (const order of currentOrders) {
    const channel =
      connectionById.get(order.PlatformConnectionId)?.platformType ?? 'Unknown';
    const current = channelMap.get(channel) ?? { revenue: 0, orders: 0 };
    current.revenue += toFiniteNumber(order.TotalAmount);
    current.orders += 1;
    channelMap.set(channel, current);
  }
  const channelPerformance = Array.from(channelMap.entries())
    .map(([channel, values]) => ({
      channel,
      ...values,
      percentage: totalRevenue > 0 ? (values.revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const itemsResult = await fetchItems(
    supabase,
    currentOrders.map((order) => order.Id)
  );
  const productMap = new Map<
    string,
    { id: string; title: string; sku: string; revenue: number; units: number }
  >();
  if (!itemsResult.error) {
    for (const item of itemsResult.rows) {
      const id = item.ProductVariantId ?? `${item.Sku}:${item.Title}`;
      const current = productMap.get(id) ?? {
        id,
        title: item.Title,
        sku: item.Sku,
        revenue: 0,
        units: 0,
      };
      current.revenue += toFiniteNumber(item.Price) * item.Quantity;
      current.units += item.Quantity;
      productMap.set(id, current);
    }
  }

  return {
    range,
    metrics: {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      trends: {
        revenue: trend(totalRevenue, previousRevenue),
        orders: trend(totalOrders, previousCount),
        average: trend(avgOrderValue, previousAverage),
      },
    },
    revenueByDay,
    channelPerformance,
    topProducts: Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8),
    orderItemsAvailable: !itemsResult.error,
    loadError: null,
  };
}
