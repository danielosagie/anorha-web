import { getServerSupabaseClient } from '@/lib/supabase/server';

export interface DashboardData {
  revenue: {
    today: number;
    yesterday: number;
    mtd: number;
    trend: number;
  };
  orders: {
    total: number;
    trend: number;
    backlog: number;
  };
  inventory: {
    alertCount: number;
    lowStock: number;
    outOfStock: number;
  };
  sync: {
    status: 'synced' | 'syncing' | 'error';
    lastSync: Date;
    connectedChannels: number;
  };
  activity: Array<{
    id: string;
    type: 'sync' | 'order' | 'inventory' | 'error';
    message: string;
    timestamp: Date;
    status: 'success' | 'error' | 'warning';
  }>;
  usage: {
    imports: { used: number; total: number };
    aiScans: { used: number; total: number };
    syncs: { used: number; total: number };
  };
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
    const supabase = await getServerSupabaseClient();
    
    type RevenueOnlyOrderRow = { readonly TotalAmount: number | string };
    type InventoryAlertRow = { readonly Quantity: number };
    type UsageEventRow = { readonly FeatureKey: string; readonly Quantity: number };
    type ActivityLogRow = {
      readonly Id: number | string;
      readonly EventType: string;
      readonly Message: string;
      readonly Timestamp: string;
      readonly Status: string;
    };
    
    // Get today's date range
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Fetch revenue data from Orders
    const todayOrdersRes = await supabase
      .from('Orders')
      .select('TotalAmount')
      .eq('UserId', userId)
      .gte('OrderDate', todayStart.toISOString())
      .lt('OrderDate', today.toISOString());
    const todayOrders = (todayOrdersRes.data ?? null) as ReadonlyArray<RevenueOnlyOrderRow> | null;
    
    const yesterdayOrdersRes = await supabase
      .from('Orders')
      .select('TotalAmount')
      .eq('UserId', userId)
      .gte('OrderDate', yesterdayStart.toISOString())
      .lt('OrderDate', todayStart.toISOString());
    const yesterdayOrders = (yesterdayOrdersRes.data ?? null) as ReadonlyArray<RevenueOnlyOrderRow> | null;
    
    const mtdOrdersRes = await supabase
      .from('Orders')
      .select('TotalAmount')
      .eq('UserId', userId)
      .gte('OrderDate', monthStart.toISOString());
    const mtdOrders = (mtdOrdersRes.data ?? null) as ReadonlyArray<RevenueOnlyOrderRow> | null;
    
    // Calculate revenue
    const todayRevenue = todayOrders?.reduce((sum: number, order: RevenueOnlyOrderRow) => sum + Number(order.TotalAmount), 0) || 0;
    const yesterdayRevenue = yesterdayOrders?.reduce((sum: number, order: RevenueOnlyOrderRow) => sum + Number(order.TotalAmount), 0) || 0;
    const mtdRevenue = mtdOrders?.reduce((sum: number, order: RevenueOnlyOrderRow) => sum + Number(order.TotalAmount), 0) || 0;
    const revenueTrend = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;
    
    // Get orders count and trends
    const { count: todayOrderCount } = await supabase
      .from('Orders')
      .select('*', { count: 'exact', head: true })
      .eq('UserId', userId)
      .gte('OrderDate', todayStart.toISOString());
    
    const { count: yesterdayOrderCount } = await supabase
      .from('Orders')
      .select('*', { count: 'exact', head: true })
      .eq('UserId', userId)
      .gte('OrderDate', yesterdayStart.toISOString())
      .lt('OrderDate', todayStart.toISOString());
    
    const orderTrend = yesterdayOrderCount && yesterdayOrderCount > 0 
      ? ((todayOrderCount || 0) - yesterdayOrderCount) / yesterdayOrderCount * 100 
      : 0;
    
    // Get inventory alerts
    const inventoryAlertsRes = await supabase
      .from('InventoryLevels')
      .select(`
        *,
        ProductVariants!inner(UserId)
      `)
      .eq('ProductVariants.UserId', userId)
      .or('Quantity.eq.0,Quantity.lt.10');
    const inventoryAlerts = (inventoryAlertsRes.data ?? null) as ReadonlyArray<InventoryAlertRow> | null;
    
    const lowStock = inventoryAlerts?.filter((item: InventoryAlertRow) => item.Quantity > 0 && item.Quantity < 10).length || 0;
    const outOfStock = inventoryAlerts?.filter((item: InventoryAlertRow) => item.Quantity === 0).length || 0;
    
    // Get platform connections for sync status
    const { data: connections } = await supabase
      .from('PlatformConnections')
      .select('*')
      .eq('UserId', userId)
      .eq('IsEnabled', true);
    
    // Get recent activity
    const activityDataRes = await supabase
      .from('ActivityLogs')
      .select('*')
      .eq('UserId', userId)
      .order('Timestamp', { ascending: false })
      .limit(10);
    const activityData = (activityDataRes.data ?? null) as ReadonlyArray<ActivityLogRow> | null;
    
    // Get usage data
    const usageDataRes = await supabase
      .from('UsageEvents')
      .select('FeatureKey, Quantity')
      .eq('UserId', userId)
      .gte('OccurredAt', monthStart.toISOString());
    const usageData = (usageDataRes.data ?? null) as ReadonlyArray<UsageEventRow> | null;
    
    // Aggregate usage by feature
    const emptyUsage = { imports: { used: 0, total: 2500 }, aiScans: { used: 0, total: 1000 }, syncs: { used: 0, total: 50 } };
    const usage = usageData?.reduce(
      (acc: typeof emptyUsage, event: UsageEventRow) => {
        if (event.FeatureKey === 'import') {
          acc.imports.used += event.Quantity;
        } else if (
          event.FeatureKey === 'ai_quick_scan' ||
          event.FeatureKey === 'ai_recognize_match'
        ) {
          acc.aiScans.used += event.Quantity;
        } else if (event.FeatureKey === 'marketplace_sync') {
          acc.syncs.used += event.Quantity;
        }
        return acc;
      },
      { ...emptyUsage }
    ) || emptyUsage;
    
    return {
      revenue: {
        today: todayRevenue,
        yesterday: yesterdayRevenue,
        mtd: mtdRevenue,
        trend: revenueTrend
      },
      orders: {
        total: todayOrderCount || 0,
        trend: orderTrend,
        backlog: 0 // TODO: Calculate based on order status
      },
      inventory: {
        alertCount: (inventoryAlerts?.length || 0),
        lowStock,
        outOfStock
      },
      sync: {
        status: 'synced', // TODO: Determine from last sync status
        lastSync: new Date(),
        connectedChannels: connections?.length || 0
      },
      activity: activityData?.map((log: ActivityLogRow) => ({
        id: log.Id.toString(),
        type: log.EventType.toLowerCase() as any,
        message: log.Message,
        timestamp: new Date(log.Timestamp),
        status: log.Status.toLowerCase() as any
      })) || [],
      usage
    };
}
