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
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Top Section - Main Metric & Date Range */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="text-4xl font-bold text-gray-900">$47,405.84</div>
            <p className="text-sm text-gray-600">Your total sales from the last 12 months</p>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUpIcon className="size-4 text-green-600" />
              <span className="text-green-600 font-medium">+$391.20</span>
              <span className="text-gray-600">vs. previous year</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-9">
              <CalendarIcon className="mr-2 size-4" />
              Jan 1 2024 - Present
            </Button>
          </div>
        </div>

        {/* Main Chart & Sidebar */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Main Chart */}
          <div className="lg:col-span-2">
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <DashboardChart />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Channel Performance */}
          <div>
            <Card className="border border-gray-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">Total Sales By Channel</CardTitle>
                    <p className="text-sm text-gray-600">January - Dec 2024</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Channel Bars */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-3 rounded-sm bg-yellow-400"></div>
                      <span className="text-sm font-medium">Clover</span>
                    </div>
                    <span className="text-sm font-mono">186</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-3 rounded-sm bg-teal-500"></div>
                      <span className="text-sm font-medium">Shopify</span>
                    </div>
                    <span className="text-sm font-mono">305</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-teal-500 h-2 rounded-full" style={{ width: '42%' }}></div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-3 rounded-sm bg-red-500"></div>
                      <span className="text-sm font-medium">Amazon</span>
                    </div>
                    <span className="text-sm font-mono">237</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '32%' }}></div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-3 rounded-sm bg-gray-400"></div>
                      <span className="text-sm font-medium">Square</span>
                    </div>
                    <span className="text-sm font-mono">73</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gray-400 h-2 rounded-full" style={{ width: '10%' }}></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUpIcon className="size-4 text-green-600" />
                    <span className="text-green-600 font-medium">Trending up by 5.2%</span>
                    <span className="text-gray-600">this year</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Showing sales by channel for the last 12 months
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Section - Tables */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Order Summary */}
          <div className="lg:col-span-2">
            <Card className="border border-gray-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">Order Summary</CardTitle>
                    <p className="text-sm text-gray-600">Review your recent order's status</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <div className="relative">
                    <FilterIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Filter inventory transactions..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <Button variant="outline" size="sm" className="h-9">
                    All
                  </Button>
                  <Button variant="outline" size="sm" className="h-9">
                    Shopify
                  </Button>
                  <Button variant="outline" size="sm" className="h-9">
                    Clover
                  </Button>
                  <Button variant="outline" size="sm" className="h-9">
                    Square
                  </Button>
                  <Button variant="outline" size="sm" className="h-9">
                    ACSM
                  </Button>
                  <Button variant="outline" size="sm" className="h-9">
                    <MoreHorizontalIcon className="size-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-200">
                      <TableHead className="text-xs font-medium text-gray-500">Order ID</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500">Sales</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500">Status</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500">Stock</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500">Platform</TableHead>
                      <TableHead className="text-xs font-medium text-gray-500">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-b border-gray-100">
                      <TableCell className="font-mono text-sm">#1188</TableCell>
                      <TableCell className="font-medium">$159.94</TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-800">In Transit</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">54 (-1)</TableCell>
                      <TableCell className="text-sm">Square</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontalIcon className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-b border-gray-100">
                      <TableCell className="font-mono text-sm">#1187</TableCell>
                      <TableCell className="font-medium">$342.26</TableCell>
                      <TableCell>
                        <Badge className="bg-red-100 text-red-800">Returned</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">12 (-2)</TableCell>
                      <TableCell className="text-sm">Amazon</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontalIcon className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-b border-gray-100">
                      <TableCell className="font-mono text-sm">#1186</TableCell>
                      <TableCell className="font-medium">$15.36</TableCell>
                      <TableCell>
                        <Badge className="bg-gray-100 text-gray-800">Off-Loaded</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">0 (-3)</TableCell>
                      <TableCell className="text-sm">Clover</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontalIcon className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-b border-gray-100">
                      <TableCell className="font-mono text-sm">#1185</TableCell>
                      <TableCell className="font-medium">$64.01</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">Delivered</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">17 (-1)</TableCell>
                      <TableCell className="text-sm">Shopify</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontalIcon className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-sm">#1184</TableCell>
                      <TableCell className="font-medium">$95.24</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">Delivered</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">31 (-10)</TableCell>
                      <TableCell className="text-sm">Shopify</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontalIcon className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Show 5 rows</span>
                    <span>•</span>
                    <span>5 of 15 row(s) selected.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">Previous</Button>
                    <Button variant="outline" size="sm">Next</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Integrations */}
          <div>
            <Card className="border border-gray-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">Integrations</CardTitle>
                  </div>
                  <Button size="sm">
                    <PlusIcon className="mr-2 size-4" />
                    New
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  You currently have <span className="font-medium">445 unique</span> items in your inventory.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Platform Cards */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded bg-green-100 flex items-center justify-center">
                        <span className="text-green-600 font-bold text-sm">S</span>
                      </div>
                      <div>
                        <div className="font-medium text-sm">Shopify</div>
                        <div className="text-xs text-gray-500">Account ID</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">40 Items</div>
                      <div className="text-xs text-gray-500">on Shopify</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded bg-orange-100 flex items-center justify-center">
                        <span className="text-orange-600 font-bold text-sm">A</span>
                      </div>
                      <div>
                        <div className="font-medium text-sm">ACSM - Shopify</div>
                        <div className="text-xs text-gray-500">Account ID</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">40 Items</div>
                      <div className="text-xs text-gray-500">on ACSM</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-600 font-bold text-sm">SQ</span>
                      </div>
                      <div>
                        <div className="font-medium text-sm">Square</div>
                        <div className="text-xs text-gray-500">Account ID</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">7 Items</div>
                      <div className="text-xs text-gray-500">on Square</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded bg-green-100 flex items-center justify-center">
                        <span className="text-green-600 font-bold text-sm">C</span>
                      </div>
                      <div>
                        <div className="font-medium text-sm">Clover</div>
                        <div className="text-xs text-gray-500">Account ID</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">50 Items</div>
                      <div className="text-xs text-gray-500">on Clover</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded bg-orange-100 flex items-center justify-center">
                        <span className="text-orange-600 font-bold text-sm">A</span>
                      </div>
                      <div>
                        <div className="font-medium text-sm">Amazon 1</div>
                        <div className="text-xs text-gray-500">J1410F6</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">68 Items</div>
                      <div className="text-xs text-gray-500">on Amazon</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded bg-orange-100 flex items-center justify-center">
                        <span className="text-orange-600 font-bold text-sm">A</span>
                      </div>
                      <div>
                        <div className="font-medium text-sm">Amazon 2</div>
                        <div className="text-xs text-gray-500">419FM1</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Button variant="outline" size="sm" className="text-xs">
                        Finish Setup
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="text-sm text-gray-600">6 of 12 accounts shown</span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">Previous</Button>
                    <Button variant="outline" size="sm">Next</Button>
                  </div>
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
