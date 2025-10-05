import { getServerSupabaseClient } from '@/lib/supabase/server';

export interface AnalyticsData {
  metrics: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    activeProducts: number;
    trends: {
      revenue: number;
      orders: number;
      aov: number;
      products: number;
    };
  };
  revenueByDay: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
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
    imageUrl?: string;
  }>;
  inventoryInsights: {
    stockHealth: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
    turnoverAnalysis: {
      fastMoving: number;
      normal: number;
      slowMoving: number;
    };
  };
  geographicInsights: {
    topMarket: string;
    growthMarket: string;
    international: number;
  };
  insights: Array<{
    type: 'positive' | 'negative' | 'neutral';
    title: string;
    description: string;
    metric?: string;
  }>;
}

export async function getAnalyticsData(userId: string, dateRange: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<AnalyticsData> {
    const supabase = await getServerSupabaseClient();
    
    // Calculate date ranges
    const now = new Date();
    const daysBack = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    const previousStartDate = new Date(startDate.getTime() - daysBack * 24 * 60 * 60 * 1000);
    
    // Get current period orders
    const { data: currentOrders } = await supabase
      .from('Orders')
      .select(`
        *,
        OrderItems(*, ProductVariants(*, Products(*)))
      `)
      .eq('UserId', userId)
      .gte('OrderDate', startDate.toISOString())
      .order('OrderDate', { ascending: true });
    
    // Get previous period orders for comparison
    const { data: previousOrders } = await supabase
      .from('Orders')
      .select('TotalAmount')
      .eq('UserId', userId)
      .gte('OrderDate', previousStartDate.toISOString())
      .lt('OrderDate', startDate.toISOString());
    
    // Calculate metrics
    const totalRevenue = currentOrders?.reduce((sum, order) => sum + Number(order.TotalAmount), 0) || 0;
    const totalOrders = currentOrders?.length || 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const prevRevenue = previousOrders?.reduce((sum, order) => sum + Number(order.TotalAmount), 0) || 0;
    const prevOrders = previousOrders?.length || 0;
    const prevAov = prevOrders > 0 ? prevRevenue / prevOrders : 0;
    
    // Calculate trends
    const revenueTrend = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const ordersTrend = prevOrders > 0 ? ((totalOrders - prevOrders) / prevOrders) * 100 : 0;
    const aovTrend = prevAov > 0 ? ((avgOrderValue - prevAov) / prevAov) * 100 : 0;
    
    // Group revenue by day
    const revenueByDay = currentOrders?.reduce((acc, order) => {
      const date = order.OrderDate.split('T')[0];
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.revenue += Number(order.TotalAmount);
        existing.orders += 1;
      } else {
        acc.push({
          date,
          revenue: Number(order.TotalAmount),
          orders: 1
        });
      }
      return acc;
    }, [] as Array<{ date: string; revenue: number; orders: number }>) || [];
    
    // Get platform connections for channel analysis
    const { data: connections } = await supabase
      .from('PlatformConnections')
      .select('*')
      .eq('UserId', userId);
    
    // Analyze channel performance (simplified)
    const channelPerformance = connections?.map(conn => ({
      channel: conn.PlatformType,
      revenue: totalRevenue * Math.random(), // TODO: Real channel-specific revenue
      percentage: Math.random() * 100,
      orders: Math.floor(totalOrders * Math.random())
    })) || [];
    
    // Get top products
    const productSales = currentOrders?.flatMap(order => 
      order.OrderItems?.map(item => ({
        productId: item.ProductVariantId,
        title: item.Title,
        sku: item.Sku,
        revenue: Number(item.Price) * item.Quantity,
        units: item.Quantity
      })) || []
    ) || [];
    
    const topProducts = Object.values(
      productSales.reduce((acc, item) => {
        if (acc[item.productId]) {
          acc[item.productId].revenue += item.revenue;
          acc[item.productId].units += item.units;
        } else {
          acc[item.productId] = {
            id: item.productId,
            title: item.title,
            sku: item.sku,
            revenue: item.revenue,
            units: item.units
          };
        }
        return acc;
      }, {} as Record<string, any>)
    ).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    
    // Get inventory data
    const { data: inventoryData } = await supabase
      .from('InventoryLevels')
      .select(`
        *,
        ProductVariants!inner(UserId)
      `)
      .eq('ProductVariants.UserId', userId);
    
    const totalProducts = inventoryData?.length || 0;
    const inStock = inventoryData?.filter(item => item.Quantity > 10).length || 0;
    const lowStock = inventoryData?.filter(item => item.Quantity > 0 && item.Quantity <= 10).length || 0;
    const outOfStock = inventoryData?.filter(item => item.Quantity === 0).length || 0;
    const stockHealth = totalProducts > 0 ? (inStock / totalProducts) * 100 : 0;
    
    // Generate insights
    const insights = [
      {
        type: revenueTrend > 0 ? 'positive' : 'negative' as const,
        title: revenueTrend > 0 ? 'Revenue Growth' : 'Revenue Decline',
        description: `Revenue ${revenueTrend > 0 ? 'increased' : 'decreased'} by ${Math.abs(revenueTrend).toFixed(1)}% vs previous period`,
        metric: `${revenueTrend > 0 ? '+' : ''}${revenueTrend.toFixed(1)}%`
      },
      {
        type: lowStock + outOfStock > 0 ? 'negative' : 'positive' as const,
        title: 'Inventory Status',
        description: `${lowStock + outOfStock} products need attention`,
        metric: `${stockHealth.toFixed(0)}% healthy`
      }
    ];
    
    return {
      metrics: {
        totalRevenue,
        totalOrders,
        avgOrderValue,
        activeProducts: totalProducts,
        trends: {
          revenue: revenueTrend,
          orders: ordersTrend,
          aov: aovTrend,
          products: 0 // TODO: Calculate product growth
        }
      },
      revenueByDay,
      channelPerformance,
      topProducts,
      inventoryInsights: {
        stockHealth,
        inStock,
        lowStock,
        outOfStock,
        turnoverAnalysis: {
          fastMoving: Math.floor(totalProducts * 0.3),
          normal: Math.floor(totalProducts * 0.6),
          slowMoving: Math.floor(totalProducts * 0.1)
        }
      },
      geographicInsights: {
        topMarket: 'California',
        growthMarket: 'Texas',
        international: 12
      },
      insights
    };
}
