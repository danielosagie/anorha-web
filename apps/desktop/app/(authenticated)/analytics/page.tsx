import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Button } from '@repo/design-system/components/ui/button';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/design-system/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/design-system/components/ui/select';
import { Progress } from '@repo/design-system/components/ui/progress';
import {
  CalendarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  DollarSignIcon,
  ShoppingCartIcon,
  UsersIcon,
  PackageIcon,
  BarChart3Icon,
  DownloadIcon,
  FilterIcon,
  RefreshCwIcon
} from 'lucide-react';
import { AnalyticsChart } from './components/analytics-chart';

export default async function AnalyticsPage() {
  return (
    <div className="flex flex-1 flex-col gap-8 p-8">
      {/* Page Header - Clean and focused */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Performance insights and trends
          </p>
        </div>

        {/* Essential Controls */}
        <div className="flex items-center gap-2">
          <Select defaultValue="30d">
            <SelectTrigger className="w-32">
              <CalendarIcon className="mr-2 size-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon">
            <DownloadIcon className="size-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics - Clean and focused */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSignIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$89,432</div>
            <div className="flex items-center text-sm">
              <TrendingUpIcon className="mr-1 size-3 text-green-600" />
              <span className="text-green-600">+23.1%</span>
              <span className="text-muted-foreground ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCartIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">2,847</div>
            <div className="flex items-center text-sm">
              <TrendingUpIcon className="mr-1 size-3 text-green-600" />
              <span className="text-green-600">+12.5%</span>
              <span className="text-muted-foreground ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <BarChart3Icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$31.42</div>
            <div className="flex items-center text-sm">
              <TrendingUpIcon className="mr-1 size-3 text-green-600" />
              <span className="text-green-600">+8.7%</span>
              <span className="text-muted-foreground ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <PackageIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1,247</div>
            <div className="flex items-center text-sm">
              <TrendingDownIcon className="mr-1 size-3 text-red-600" />
              <span className="text-red-600">-2.1%</span>
              <span className="text-muted-foreground ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts - Essential insights */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Revenue Trend - Primary chart */}
        <Card className="lg:col-span-2 border-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Daily revenue over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyticsChart />
          </CardContent>
        </Card>

        {/* Channel Performance - Key breakdown */}
        <Card className="border-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Top Channels</CardTitle>
            <CardDescription>Revenue by sales channel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Shopify</span>
                <span className="font-medium">$45,231</span>
              </div>
              <Progress value={51} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Square</span>
                <span className="font-medium">$28,901</span>
              </div>
              <Progress value={32} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Facebook</span>
                <span className="font-medium">$10,847</span>
              </div>
              <Progress value={12} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Marketplace</span>
                <span className="font-medium">$4,453</span>
              </div>
              <Progress value={5} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Insights - Most important data */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Top Products - Performance leaders */}
        <Card className="border-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Best performing products by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded bg-muted"></div>
                  <div>
                    <div className="font-medium">Wireless Headphones</div>
                    <div className="text-sm text-muted-foreground">SKU: WH-001</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">$12,847</div>
                  <div className="text-sm text-muted-foreground">247 units</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded bg-muted"></div>
                  <div>
                    <div className="font-medium">Smart Watch</div>
                    <div className="text-sm text-muted-foreground">SKU: SW-002</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">$9,234</div>
                  <div className="text-sm text-muted-foreground">183 units</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded bg-muted"></div>
                  <div>
                    <div className="font-medium">Phone Case</div>
                    <div className="text-sm text-muted-foreground">SKU: PC-003</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">$7,891</div>
                  <div className="text-sm text-muted-foreground">321 units</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Insights - Actionable data */}
        <Card className="border-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
            <CardDescription>Important trends and changes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <TrendingUpIcon className="size-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium">Revenue Growth</div>
                  <div className="text-sm text-muted-foreground">+23.1% vs last month</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <TrendingDownIcon className="size-5 text-red-600 mt-0.5" />
                <div>
                  <div className="font-medium">Product Count Decline</div>
                  <div className="text-sm text-muted-foreground">-2.1% active products</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <PackageIcon className="size-5 text-amber-600 mt-0.5" />
                <div>
                  <div className="font-medium">Inventory Alert</div>
                  <div className="text-sm text-muted-foreground">24 items need attention</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}