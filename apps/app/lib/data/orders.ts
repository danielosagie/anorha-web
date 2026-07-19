import { getServerSupabaseClient } from '@/lib/supabase/server';
import {
  type CommerceScope,
  getOrgConnections,
  resolveCommerceScope,
  toFiniteNumber,
} from './context';

export type OrderLineItem = {
  id: string;
  productVariantId: string | null;
  sku: string;
  title: string;
  quantity: number;
  price: number;
  total: number;
};

export type OrderRecord = {
  id: string;
  orderNumber: string;
  platformOrderId: string;
  status: string;
  currency: string;
  totalAmount: number;
  customerEmail: string | null;
  orderDate: string;
  platform: string;
  platformName: string;
  itemCount: number | null;
  items: OrderLineItem[];
};

export type OrderFilters = {
  status?: string;
  platform?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
};

export type OrdersData = {
  orders: OrderRecord[];
  total: number;
  page: number;
  pageSize: number;
  platforms: string[];
  statuses: string[];
  itemsAvailable: boolean;
  loadError: string | null;
};

type OrderRow = {
  readonly Id: string;
  readonly PlatformConnectionId: string;
  readonly PlatformOrderId: string;
  readonly OrderNumber: string | null;
  readonly Status: string;
  readonly Currency: string;
  readonly TotalAmount: number | string;
  readonly CustomerEmail: string | null;
  readonly OrderDate: string;
};

type OrderItemRow = {
  readonly Id: string;
  readonly OrderId: string;
  readonly ProductVariantId: string | null;
  readonly Sku: string;
  readonly Title: string;
  readonly Quantity: number;
  readonly Price: number | string;
};

type StatusRow = { readonly Status: string };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function nextUtcDate(date: string): string | null {
  if (!DATE_PATTERN.test(date)) {
    return null;
  }
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  parsed.setUTCDate(parsed.getUTCDate() + 1);
  return parsed.toISOString();
}

function mapItems(rows: readonly OrderItemRow[]): Map<string, OrderLineItem[]> {
  const itemsByOrder = new Map<string, OrderLineItem[]>();
  for (const row of rows) {
    const price = toFiniteNumber(row.Price);
    const item: OrderLineItem = {
      id: row.Id,
      productVariantId: row.ProductVariantId,
      sku: row.Sku,
      title: row.Title,
      quantity: row.Quantity,
      price,
      total: price * row.Quantity,
    };
    const existing = itemsByOrder.get(row.OrderId) ?? [];
    existing.push(item);
    itemsByOrder.set(row.OrderId, existing);
  }
  return itemsByOrder;
}

export async function getOrders(
  scope: CommerceScope,
  filters: OrderFilters = {}
): Promise<OrdersData> {
  const supabase = await getServerSupabaseClient();
  const resolved = await resolveCommerceScope(supabase, scope);
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 25));

  if (!resolved.dbOrgId) {
    return {
      orders: [],
      total: 0,
      page,
      pageSize,
      platforms: [],
      statuses: [],
      itemsAvailable: true,
      loadError: 'Workspace data is unavailable.',
    };
  }

  const connectionResult = await getOrgConnections(supabase, resolved.dbOrgId);
  if (connectionResult.error) {
    return {
      orders: [],
      total: 0,
      page,
      pageSize,
      platforms: [],
      statuses: [],
      itemsAvailable: true,
      loadError: 'Orders could not load.',
    };
  }

  const connections = connectionResult.connections;
  const platforms = Array.from(
    new Set(
      connections.map((connection) => connection.platformType.toLowerCase())
    )
  ).sort();
  const filteredConnections = filters.platform
    ? connections.filter(
        (connection) =>
          connection.platformType.toLowerCase() ===
          filters.platform?.toLowerCase()
      )
    : connections;
  const allConnectionIds = connections.map((connection) => connection.id);
  const connectionIds = filteredConnections.map((connection) => connection.id);

  if (allConnectionIds.length === 0 || connectionIds.length === 0) {
    return {
      orders: [],
      total: 0,
      page,
      pageSize,
      platforms,
      statuses: [],
      itemsAvailable: true,
      loadError: null,
    };
  }

  const statusPromise = supabase
    .from('Orders')
    .select('Status')
    .in('PlatformConnectionId', allConnectionIds)
    .limit(1000);

  let orderQuery = supabase
    .from('Orders')
    .select(
      'Id, PlatformConnectionId, PlatformOrderId, OrderNumber, Status, Currency, TotalAmount, CustomerEmail, OrderDate',
      { count: 'exact' }
    )
    .in('PlatformConnectionId', connectionIds)
    .order('OrderDate', { ascending: false });

  if (filters.status) {
    orderQuery = orderQuery.eq('Status', filters.status);
  }
  if (filters.startDate && DATE_PATTERN.test(filters.startDate)) {
    orderQuery = orderQuery.gte(
      'OrderDate',
      `${filters.startDate}T00:00:00.000Z`
    );
  }
  if (filters.endDate) {
    const exclusiveEnd = nextUtcDate(filters.endDate);
    if (exclusiveEnd) {
      orderQuery = orderQuery.lt('OrderDate', exclusiveEnd);
    }
  }

  const from = (page - 1) * pageSize;
  const [ordersResult, statusesResult] = await Promise.all([
    orderQuery.range(from, from + pageSize - 1),
    statusPromise,
  ]);

  if (ordersResult.error) {
    return {
      orders: [],
      total: 0,
      page,
      pageSize,
      platforms,
      statuses: [],
      itemsAvailable: true,
      loadError: 'Orders could not load.',
    };
  }

  const rows = (ordersResult.data ?? []) as unknown as readonly OrderRow[];
  const statusRows = (statusesResult.data ??
    []) as unknown as readonly StatusRow[];
  const statuses = Array.from(
    new Set(statusRows.map((row) => row.Status).filter(Boolean))
  ).sort();
  const orderIds = rows.map((row) => row.Id);
  const itemsResult =
    orderIds.length > 0
      ? await supabase
          .from('OrderItems')
          .select('Id, OrderId, ProductVariantId, Sku, Title, Quantity, Price')
          .in('OrderId', orderIds)
      : { data: [], error: null };
  const itemRows = (itemsResult.data ??
    []) as unknown as readonly OrderItemRow[];
  const itemsByOrder = mapItems(itemRows);
  const connectionById = new Map(
    connections.map((connection) => [connection.id, connection])
  );

  return {
    orders: rows.map((row) => {
      const items = itemsByOrder.get(row.Id) ?? [];
      const connection = connectionById.get(row.PlatformConnectionId);
      return {
        id: row.Id,
        orderNumber: row.OrderNumber ?? row.PlatformOrderId,
        platformOrderId: row.PlatformOrderId,
        status: row.Status,
        currency: row.Currency,
        totalAmount: toFiniteNumber(row.TotalAmount),
        customerEmail: row.CustomerEmail,
        orderDate: row.OrderDate,
        platform: connection?.platformType ?? 'Unknown',
        platformName: connection?.displayName ?? 'Unknown',
        itemCount: itemsResult.error
          ? null
          : items.reduce((sum, item) => sum + item.quantity, 0),
        items,
      };
    }),
    total: ordersResult.count ?? rows.length,
    page,
    pageSize,
    platforms,
    statuses,
    itemsAvailable: !itemsResult.error,
    loadError: null,
  };
}

export async function getOrder(
  scope: CommerceScope,
  orderId: string
): Promise<{ order: OrderRecord | null; loadError: string | null }> {
  const supabase = await getServerSupabaseClient();
  const resolved = await resolveCommerceScope(supabase, scope);
  if (!resolved.dbOrgId) {
    return { order: null, loadError: 'Workspace data is unavailable.' };
  }

  const connectionResult = await getOrgConnections(supabase, resolved.dbOrgId);
  const connectionIds = connectionResult.connections.map(
    (connection) => connection.id
  );
  if (connectionResult.error || connectionIds.length === 0) {
    return {
      order: null,
      loadError: connectionResult.error ? 'Order could not load.' : null,
    };
  }

  const result = await supabase
    .from('Orders')
    .select(
      'Id, PlatformConnectionId, PlatformOrderId, OrderNumber, Status, Currency, TotalAmount, CustomerEmail, OrderDate'
    )
    .eq('Id', orderId)
    .in('PlatformConnectionId', connectionIds)
    .maybeSingle();

  if (result.error) {
    return { order: null, loadError: 'Order could not load.' };
  }

  const row = result.data as unknown as OrderRow | null;
  if (!row) {
    return { order: null, loadError: null };
  }

  const itemsResult = await supabase
    .from('OrderItems')
    .select('Id, OrderId, ProductVariantId, Sku, Title, Quantity, Price')
    .eq('OrderId', row.Id)
    .order('Title', { ascending: true });
  const itemRows = (itemsResult.data ??
    []) as unknown as readonly OrderItemRow[];
  const items = mapItems(itemRows).get(row.Id) ?? [];
  const connection = connectionResult.connections.find(
    (item) => item.id === row.PlatformConnectionId
  );

  return {
    order: {
      id: row.Id,
      orderNumber: row.OrderNumber ?? row.PlatformOrderId,
      platformOrderId: row.PlatformOrderId,
      status: row.Status,
      currency: row.Currency,
      totalAmount: toFiniteNumber(row.TotalAmount),
      customerEmail: row.CustomerEmail,
      orderDate: row.OrderDate,
      platform: connection?.platformType ?? 'Unknown',
      platformName: connection?.displayName ?? 'Unknown',
      itemCount: itemsResult.error
        ? null
        : items.reduce((sum, item) => sum + item.quantity, 0),
      items,
    },
    loadError: itemsResult.error ? 'Line items could not load.' : null,
  };
}
