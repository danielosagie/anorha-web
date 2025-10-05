import { env } from '@/env';
import { auth, currentUser } from '@repo/auth/server';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { AvatarStack } from './components/avatar-stack';
import { Cursors } from './components/cursors';
import { Header } from './components/header';
import { DashboardChart } from './components/dashboard-chart';
import { CollaborationWrapper } from './components/collaboration-wrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Button } from '@repo/design-system/components/ui/button';
import { Progress } from '@repo/design-system/components/ui/progress';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Separator } from '@repo/design-system/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/design-system/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/design-system/components/ui/table';
import { getDashboardData } from '@/lib/data/dashboard';
import { formatCurrency, formatNumber, formatPercent, formatDistanceToNow } from '@/lib/utils/format';
import {
  ArrowUpRightIcon,
  PackageIcon,
  ShoppingCartIcon,
  RefreshCwIcon,
  PlusIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  UploadIcon,
  ScanIcon,
  Settings2Icon,
  TrendingUpIcon,
  TrendingDownIcon,
  CreditCardIcon,
  CalendarIcon,
  MoreHorizontalIcon,
  FilterIcon
} from 'lucide-react';

// Components are now handled in separate client components

export const metadata: Metadata = {
  title: 'Anorha Dashboard',
  description: 'Your operational control center.',
};

const App = async () => {
  const user = await currentUser();
  if (!user) {
    notFound();
  }

  // Fetch live dashboard data
  const data = await getDashboardData(user.id);
  const pages: { id: number; name: string }[] = [];
  const orgId = 'temp-org';

  return (
    <>
      <Header pages={['Dashboard']} page="Overview">
        {env.LIVEBLOCKS_SECRET && (
          <CollaborationWrapper orgId={orgId}>
            <AvatarStack />
            <Cursors />
          </CollaborationWrapper>
        )}
      </Header>
      <div className="flex flex-1 flex-col gap-8 p-8 pt-0">
        {/* KPI Grid - Clean, focused metrics */}
        <div className="grid gap-6 md:grid-cols-4">
          {/* Revenue - Primary focus */}
          <Card className="border-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <div className={`rounded-full p-2 ${
                data.revenue.trend >= 0
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-red-100 dark:bg-red-900/30'
              }`}>
                {data.revenue.trend >= 0 ? (
                  <TrendingUpIcon className="size-4 text-green-600" />
                ) : (
                  <TrendingDownIcon className="size-4 text-red-600" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(data.revenue.today)}
              </div>
              <p className="text-sm text-muted-foreground">
                Today • {formatPercent(data.revenue.trend)} vs yesterday
              </p>
              <div className="mt-3 text-sm font-medium text-muted-foreground">
                MTD: {formatCurrency(data.revenue.mtd)}
              </div>
            </CardContent>
          </Card>

          {/* Orders - Secondary metric */}
          <Card className="border-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
              <ShoppingCartIcon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatNumber(data.orders.total)}
              </div>
              <p className="text-sm text-muted-foreground">
                Last 24h • {formatPercent(data.orders.trend)}
              </p>
              {data.orders.backlog > 0 && (
                <Badge variant="secondary" className="mt-3 text-xs">
                  {data.orders.backlog} pending
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Inventory - Status indicator */}
          <Card className={`border-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm ${
            data.inventory.alertCount > 0 ? 'ring-2 ring-amber-200 dark:ring-amber-800' : ''
          }`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Inventory</CardTitle>
              {data.inventory.alertCount > 0 ? (
                <AlertTriangleIcon className="size-4 text-amber-600" />
              ) : (
                <CheckCircleIcon className="size-4 text-green-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${
                data.inventory.alertCount > 0 ? 'text-amber-600' : 'text-green-600'
              }`}>
                {data.inventory.alertCount > 0 ? data.inventory.alertCount : '✓'}
              </div>
              <p className="text-sm text-muted-foreground">
                {data.inventory.alertCount > 0
                  ? 'Items need attention'
                  : 'All in stock'
                }
              </p>
              {data.inventory.alertCount > 0 && (
                <div className="mt-3 text-xs text-amber-600">
                  {data.inventory.lowStock} low • {data.inventory.outOfStock} out
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sync Status - Health indicator */}
          <Card className={`border-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm ${
            data.sync.status !== 'synced' ? 'ring-2 ring-red-200 dark:ring-red-800' : ''
          }`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Sync Health</CardTitle>
              <div className={`size-2 rounded-full ${
                data.sync.status === 'synced' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {data.sync.status === 'synced' ? 'All Synced' : 'Issues'}
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(data.sync.lastSync)}
              </p>
              <div className="mt-3 text-xs text-muted-foreground">
                {data.sync.connectedChannels} channels
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Focused workflow */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Primary workflow */}
          <div className="lg:col-span-2 space-y-8">
            {/* Revenue Chart - Key insight */}
            <Card className="border-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Daily revenue over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <DashboardChart />
              </CardContent>
            </Card>

            {/* Quick Actions - Core workflows */}
            <Card className="border-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Essential tasks for your business</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button className="justify-start h-auto p-4">
                    <div className="text-left">
                      <div className="font-medium">Import Products</div>
                      <div className="text-sm text-muted-foreground">Upload CSV or scan items</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto p-4">
                    <div className="text-left">
                      <div className="font-medium">Sync Channels</div>
                      <div className="text-sm text-muted-foreground">Update inventory across platforms</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto p-4">
                    <div className="text-left">
                      <div className="font-medium">View Analytics</div>
                      <div className="text-sm text-muted-foreground">Detailed performance insights</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto p-4">
                    <div className="text-left">
                      <div className="font-medium">Manage Billing</div>
                      <div className="text-sm text-muted-foreground">Subscription and usage</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Status & Usage */}
          <div className="space-y-8">
            {/* Usage Overview - Essential info */}
            <Card className="border-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCardIcon className="size-5" />
                  Usage Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Imports</span>
                    <span className="text-sm font-mono">
                      {formatNumber(data.usage.imports.used)} / {formatNumber(data.usage.imports.total)}
                    </span>
                  </div>
                  <Progress
                    value={(data.usage.imports.used / data.usage.imports.total) * 100}
                    className="h-2"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">AI Scans</span>
                    <span className="text-sm font-mono">
                      {formatNumber(data.usage.aiScans.used)} / {formatNumber(data.usage.aiScans.total)}
                    </span>
                  </div>
                  <Progress
                    value={(data.usage.aiScans.used / data.usage.aiScans.total) * 100}
                    className="h-2"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Syncs</span>
                    <span className="text-sm font-mono">
                      {formatNumber(data.usage.syncs.used)} / {formatNumber(data.usage.syncs.total)}
                    </span>
                  </div>
                  <Progress
                    value={(data.usage.syncs.used / data.usage.syncs.total) * 100}
                    className="h-2"
                  />
                </div>

                <Button variant="outline" className="w-full" size="sm">
                  View Billing
                </Button>
              </CardContent>
            </Card>

            {/* Status Summary - Quick health check */}
            <Card className="border-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`size-2 rounded-full ${
                      data.sync.status === 'synced' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm">Sync Health</span>
                  </div>
                  <span className="text-sm font-medium">
                    {data.sync.status === 'synced' ? 'Good' : 'Issues'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Inventory Alerts</span>
                  <span className={`text-sm font-medium ${
                    data.inventory.alertCount > 0 ? 'text-amber-600' : 'text-green-600'
                  }`}>
                    {data.inventory.alertCount > 0 ? data.inventory.alertCount : 'None'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Connected Channels</span>
                  <span className="text-sm font-medium">
                    {data.sync.connectedChannels}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </>
  );
};

export default App;