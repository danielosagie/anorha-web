import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Button } from '@repo/design-system/components/ui/button';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Progress } from '@repo/design-system/components/ui/progress';
import { Separator } from '@repo/design-system/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/design-system/components/ui/table';
import {
  CreditCardIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  DownloadIcon,
  ExternalLinkIcon,
  InfoIcon,
  TrendingUpIcon,
  CalendarIcon,
  DollarSignIcon
} from 'lucide-react';

export default async function BillingPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Manage your subscription, usage, and billing information
          </p>
        </div>

        <Button className="w-full md:w-auto" size="sm">
          <ExternalLinkIcon className="mr-2 size-4" />
          Manage Subscription
        </Button>
      </div>

      {/* Pro Student Plan Summary - Main Feature Card */}
      <Card className="border-2">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">Pro Student Plan Summary</CardTitle>
              <p className="text-sm text-muted-foreground">Sep 8, 2025 - Oct 8, 2025</p>
            </div>
            <Button variant="outline" size="sm" className="w-full md:w-auto">
              Manage Subscription
              <ExternalLinkIcon className="ml-2 size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Plan Items Table - Mobile Responsive */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="text-sm font-medium">Item</TableHead>
                    <TableHead className="text-sm font-medium text-right">Quantity</TableHead>
                    <TableHead className="text-sm font-medium text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-b">
                    <TableCell className="text-sm">
                      <div className="font-medium">gpt-5-high</div>
                      <div className="text-xs text-muted-foreground">75.9M tokens</div>
                    </TableCell>
                    <TableCell className="text-right text-sm font-mono">75.9M</TableCell>
                    <TableCell className="text-right text-sm font-medium text-green-600">$27.17</TableCell>
                  </TableRow>
                  <TableRow className="border-b">
                    <TableCell className="text-sm">
                      <div className="font-medium">claude-4-sonnet-thinking</div>
                      <div className="text-xs text-muted-foreground">32.4M tokens</div>
                    </TableCell>
                    <TableCell className="text-right text-sm font-mono">32.4M</TableCell>
                    <TableCell className="text-right text-sm font-medium text-green-600">$19.25</TableCell>
                  </TableRow>
                  <TableRow className="border-b">
                    <TableCell className="text-sm">
                      <div className="font-medium">Auto - Unlimited</div>
                      <div className="text-xs text-muted-foreground">3.3M tokens</div>
                    </TableCell>
                    <TableCell className="text-right text-sm font-mono">3.3M</TableCell>
                    <TableCell className="text-right text-sm font-medium">Free</TableCell>
                  </TableRow>
                  <TableRow className="border-b">
                    <TableCell className="text-sm">
                      <div className="font-medium">code-supernova-1-million</div>
                      <div className="text-xs text-muted-foreground">8.3M tokens</div>
                    </TableCell>
                    <TableCell className="text-right text-sm font-mono">8.3M</TableCell>
                    <TableCell className="text-right text-sm font-medium text-green-600">$0.00</TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/30">
                    <TableCell className="text-sm font-semibold">Total</TableCell>
                    <TableCell className="text-right text-sm font-mono font-semibold">119.9M</TableCell>
                    <TableCell className="text-right text-sm font-semibold text-green-600">$47.75</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Usage - Mobile Responsive Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUpIcon className="size-5" />
            Current Usage
          </CardTitle>
          <CardDescription>Your usage for the current billing period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Product Imports</span>
                <span className="font-mono text-muted-foreground">1,247 / 2,500</span>
              </div>
              <Progress value={50} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">AI Recognition</span>
                <span className="font-mono text-muted-foreground">834 / 1,000</span>
              </div>
              <Progress value={83} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Marketplace Syncs</span>
                <span className="font-mono text-muted-foreground">12 / 50</span>
              </div>
              <Progress value={24} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Data Generation</span>
                <span className="font-mono text-muted-foreground">456 / 500</span>
              </div>
              <Progress value={91} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="size-5" />
            September 2025 - Upcoming invoice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="text-2xl font-bold">$40.24</div>
              <div className="text-muted-foreground">$60.00</div>
            </div>

            <Separator />

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  token-based usage calls to non-max-gpt-5-high, totaling: $26.94. Input tokens: 1411138, Output tokens: 414053, Cache write tokens: 6467656, Cache read tokens: 6557373
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">$0.05</span>
                  <span className="text-muted-foreground">× 578</span>
                  <span className="font-medium">$26.94</span>
                </div>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  token-based usage calls to non-max-gpt-5-high, totaling: $13.30. Input tokens: 8570508, Output tokens: 194374, Cache write tokens: 0, Cache read tokens: 15592064
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">$0.08</span>
                  <span className="text-muted-foreground">× 157</span>
                  <span className="font-medium">$13.30</span>
                </div>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Mid-month usage paid for September 2025</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-red-600">-$40.24</span>
                  <span className="text-muted-foreground">× 1</span>
                  <span className="font-medium text-red-600">-$40.24</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <span className="font-medium">Subtotal:</span>
              <span className="font-medium">$0.00</span>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                You may have an unpaid invoice. Please check your billing settings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>Your billing history and payment records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col gap-3 p-4 border rounded-lg sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-medium">Sep 27, 2025</div>
                <div className="text-sm text-muted-foreground">Cursor Usage for September 2025 (Mid-Month Invoice)</div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">Open</Badge>
                <div className="text-right">
                  <div className="font-medium">0.00 USD</div>
                </div>
                <Button variant="ghost" size="sm">
                  <ExternalLinkIcon className="size-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-3 p-4 border rounded-lg sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-medium">Sep 05, 2025</div>
                <div className="text-sm text-muted-foreground">Cursor Usage for August 2025</div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-100 text-green-800">Paid</Badge>
                <div className="text-right">
                  <div className="font-medium">5.00 USD</div>
                </div>
                <Button variant="ghost" size="sm">
                  <ExternalLinkIcon className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}