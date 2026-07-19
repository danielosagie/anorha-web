import { getServerSupabaseClient } from '@/lib/supabase/server';
import { type ActivityRecord, getActivityData } from './activity';
import {
  type CommerceScope,
  getOrgConnections,
  resolveCommerceScope,
  toFiniteNumber,
} from './context';
import { type OrderRecord, getOrders } from './orders';

export type DashboardData = {
  revenue: number;
  orderCount: number;
  inventoryValue: number;
  inventoryUnits: number;
  recentOrders: OrderRecord[];
  recentActivity: ActivityRecord[];
  loadError: string | null;
};

type AmountRow = { readonly TotalAmount: number | string };
type InventoryRow = {
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
      inventoryValue: 0,
      inventoryUnits: 0,
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

  const monthlyOrdersPromise =
    connectionIds.length > 0
      ? supabase
          .from('Orders')
          .select('TotalAmount')
          .in('PlatformConnectionId', connectionIds)
          .gte('OrderDate', monthStart.toISOString())
      : Promise.resolve({ data: [], error: null });
  const inventoryPromise = supabase
    .from('InventoryLevels')
    .select('Quantity, ProductVariants!inner(Price)')
    .eq('OrgId', resolved.dbOrgId);
  const recentOrdersPromise = getOrders(scope, { pageSize: 5 });
  const recentActivityPromise = getActivityData(scope, { limit: 5 });

  const [monthlyOrdersResult, inventoryResult, recentOrders, recentActivity] =
    await Promise.all([
      monthlyOrdersPromise,
      inventoryPromise,
      recentOrdersPromise,
      recentActivityPromise,
    ]);

  const orderRows = (monthlyOrdersResult.data ??
    []) as unknown as readonly AmountRow[];
  const inventoryRows = (inventoryResult.data ??
    []) as unknown as readonly InventoryRow[];
  let inventoryValue = 0;
  let inventoryUnits = 0;
  for (const row of inventoryRows) {
    const variant = Array.isArray(row.ProductVariants)
      ? row.ProductVariants[0]
      : row.ProductVariants;
    inventoryUnits += row.Quantity;
    inventoryValue += row.Quantity * toFiniteNumber(variant?.Price);
  }

  const hasError =
    Boolean(connectionResult.error) ||
    Boolean(monthlyOrdersResult.error) ||
    Boolean(inventoryResult.error) ||
    Boolean(recentOrders.loadError) ||
    Boolean(recentActivity.loadError);

  return {
    revenue: orderRows.reduce(
      (sum, order) => sum + toFiniteNumber(order.TotalAmount),
      0
    ),
    orderCount: orderRows.length,
    inventoryValue,
    inventoryUnits,
    recentOrders: recentOrders.orders,
    recentActivity: recentActivity.events,
    loadError: hasError ? 'Some data could not load.' : null,
  };
}
