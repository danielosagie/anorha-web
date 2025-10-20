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
import { currentUser } from '@repo/auth/server';
import { BillingActions } from './billing-actions';
import { Header } from '../components/header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Billing | Anorha',
  description: 'Manage your subscription, usage, and billing information',
  icons: {
    icon: '/favicon.ico',
    apple: '/logo.png',
  },
  manifest: '/manifest.json',
};

async function getBillingData() {
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  // Use the proxy routes that handle JWT token exchange
  const [summaryRes, invoicesRes, upcomingRes] = await Promise.all([
    fetch(`${origin}/api/billing/summary`, { cache: 'no-store' }),
    fetch(`${origin}/api/billing/invoices?limit=12`, { cache: 'no-store' }),
    fetch(`${origin}/api/billing/upcoming`, { cache: 'no-store' }),
  ]);
  
  if (!summaryRes.ok) {
    console.error('Failed to fetch billing summary:', await summaryRes.text());
    throw new Error('Failed to fetch billing summary');
  }
  if (!invoicesRes.ok) {
    console.error('Failed to fetch invoices:', await invoicesRes.text());
    throw new Error('Failed to fetch invoices');
  }
  if (!upcomingRes.ok) {
    console.error('Failed to fetch upcoming invoice:', await upcomingRes.text());
    // Don't throw for upcoming invoice as it might not exist
  }
  
  const [summary, invoices, upcoming] = await Promise.all([
    summaryRes.json(),
    invoicesRes.json(),
    upcomingRes.ok ? upcomingRes.json() : Promise.resolve({ upcoming: null }),
  ]);
  return { summary, invoices, upcoming } as const;
}

export default async function BillingPage() {
  const user = await currentUser();
  if (!user) {
    return <div>Please log in to view billing information.</div>;
  }

  const { summary, invoices, upcoming } = await getBillingData();
  const subscription = summary?.subscription || null;
  const usage = summary?.usage || {} as Record<string, number>;
  const paymentProvider = subscription?.PolarCustomerId ? 'polar' : 'stripe';
  const hasActiveSubscription = subscription?.Status === 'active';

  return (
    <>
      <Header pages={['Dashboard']} page="Billing">
        <BillingActions 
          paymentProvider={paymentProvider} 
          hasActiveSubscription={hasActiveSubscription}
        />
      </Header>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Manage your subscription, usage, and billing information
          </p>
        </div>
      </div>  
      
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">

      {/* Growth Plan Summary - Main Feature Card (Match provided image UI) */}
      <Card className="border-2 shadow-none">
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-semibold mb-0">
                {subscription?.CurrentPlan || 'Growth Plan'}
              </CardTitle>
              <p className="text-xs mt-1 text-muted-foreground">
                Unlimited team members, unlimited syncs and edits.<br />$7.10 / budget for product scanning
              </p>
            </div>
            <div className="flex flex-col gap-3 items-end">
              <span className="text-xs text-muted-foreground">
                {subscription?.CurrentPeriodEnd
                  ? new Date(subscription.CurrentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'No active subscription'}
              </span>
              <Badge variant={subscription?.Status === 'active' ? 'default' : 'secondary'}>
                {subscription?.Status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="border-b">
                  <TableHead className="w-1/4 font-semibold text-muted-foreground">Items</TableHead>
                  <TableHead className="w-1/4 text-right font-semibold text-muted-foreground">Usage</TableHead>
                  <TableHead className="w-1/4 text-right font-semibold text-muted-foreground">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Products</TableCell>
                  <TableCell className="text-right">47 <span className="text-muted-foreground">unlimited</span></TableCell>
                  <TableCell className="text-right text-green-700">Included</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Syncs/Edits Events</TableCell>
                  <TableCell className="text-right">144 <span className="text-muted-foreground">events</span></TableCell>
                  <TableCell className="text-right text-green-700">Included</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Platforms Connected</TableCell>
                  <TableCell className="text-right">2 <span className="text-muted-foreground">(Shopify, Square)</span></TableCell>
                  <TableCell className="text-right text-green-700">Included</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Team Members</TableCell>
                  <TableCell className="text-right">1 / <span className="text-muted-foreground">1</span></TableCell>
                  <TableCell className="text-right text-green-700">Free</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>AI Credit Budget</TableCell>
                  <TableCell className="text-right">{summary?.ai_credits_used || '5.8'} / {summary?.ai_credits_limit || '7.00'} <span className="text-muted-foreground">used</span></TableCell>
                  <TableCell className="text-right">
                    ${Number(summary?.ai_credits_used || 5.8).toFixed(2)}
                  </TableCell>
                </TableRow>
                <TableRow className="border-t">
                  <TableCell className="font-semibold">Total</TableCell>
                  <TableCell />
                  <TableCell className="text-right font-semibold ">
                    ${Number(summary?.total || 5.8).toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Current Usage - Match image's two usage bars style */}
      <Card className="shadow-none mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUpIcon className="size-5" />
            Current Usage
          </CardTitle>
          <CardDescription>Usage for the current billing period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* "AI Credits" progress bar */}
            <div>
              <div className="flex justify-between items-baseline mb-1 text-xs">
                <span className="font-semibold">AI Credits</span>
                <span className="font-mono">{summary?.ai_credits_used || 17} / {summary?.ai_credits_limit || 23}</span>
              </div>
              <Progress
                value={((summary?.ai_credits_used || 17) / (summary?.ai_credits_limit || 23)) * 100}
                className="h-3 bg-yellow-500 bg-gray-200"
                indicatorClassName="bg-yellow-500"
              />
            </div>
            {/* On-Demand Usage progress bar */}
            <div>
              <div className="flex justify-between items-baseline mb-1 text-xs">
                <span className="font-semibold">On-Demand Usage This Month</span>
                <span className="font-mono">{summary?.on_demand_usage_this_month || 50} / {summary?.on_demand_limit || 80}</span>
              </div>
              <Progress
                value={((summary?.on_demand_usage_this_month || 50) / (summary?.on_demand_limit || 80)) * 100}
                className="h-3 bg-gray-200"
                indicatorClassName="bg-gray-400"
              />
            </div>
            {/* Edit usage limit button */}
            <div>
              <Button
                variant="default"
                size="sm"
                className="rounded-md bg-gray-50 border font-normal text-xs py-1 hover:bg-gray-100"
                disabled
              >
                Edit Limit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Invoice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="size-5" />
            {upcoming?.upcoming ? 'Upcoming Invoice' : 'No Upcoming Invoice'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming?.upcoming ? (
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {(upcoming.upcoming.total || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
              </div>
              <div className="text-muted-foreground">
                Due {new Date(upcoming.upcoming.due_date || Date.now()).toLocaleDateString()}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">You have no upcoming invoice.</div>
          )}
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
            {(invoices?.invoices || []).map((inv: any) => (
              <div key={inv.id} className="flex flex-col gap-3 p-4 border rounded-lg sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-medium">{new Date(inv.created || Date.now()).toLocaleDateString()}</div>
                  <div className="text-sm text-muted-foreground">{inv.number || 'Invoice'}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={inv.status === 'paid' ? 'bg-green-100 text-green-800' : undefined}>{inv.status || 'open'}</Badge>
                  <div className="text-right">
                    <div className="font-medium">{((inv.total || 0)/100).toLocaleString(undefined, { style: 'currency', currency: inv.currency?.toUpperCase() || 'USD' })}</div>
                  </div>
                  {inv.hosted_invoice_url && (
                    <Button asChild variant="ghost" size="sm">
                      <a href={inv.hosted_invoice_url} target="_blank" rel="noreferrer">
                        <ExternalLinkIcon className="size-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {(!invoices || (invoices?.invoices || []).length === 0) && (
              <div className="text-muted-foreground">No invoices found.</div>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  );
}