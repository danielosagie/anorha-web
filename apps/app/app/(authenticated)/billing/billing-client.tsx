'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@repo/design-system/components/ui/card';
import { Progress } from '@repo/design-system/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/design-system/components/ui/table';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Button } from '@repo/design-system/components/ui/button';
import { TrendingUpIcon, CalendarIcon, ExternalLinkIcon, RefreshCwIcon } from 'lucide-react';
import { BillingActions } from './billing-actions';
import { TierSelector } from './tier-selector';
import { PageWrapper } from '../components/page-wrapper';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface BillingClientProps {
  summary: any;
  invoices: any;
  upcoming: any;
  hasActiveSubscription: boolean;
}

export function BillingClient({
  summary: initialSummary,
  invoices: initialInvoices,
  upcoming: initialUpcoming,
  hasActiveSubscription: initialHasActiveSubscription,
}: BillingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showTierSelector, setShowTierSelector] = useState(false);
  const [summary, setSummary] = useState(initialSummary);
  const [invoices, setInvoices] = useState(initialInvoices);
  const [upcoming, setUpcoming] = useState(initialUpcoming);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(initialHasActiveSubscription);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh when returning from checkout (wait 2s for webhooks to process)
  useEffect(() => {
    const checkoutId = searchParams.get('checkout_id');
    if (checkoutId) {
      // Wait for Polar webhooks to process subscription
      const timer = setTimeout(() => {
        refreshBillingData();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Refresh billing data from API
  const refreshBillingData = async () => {
    setIsRefreshing(true);
    try {
      const origin = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const [summaryRes, invoicesRes, upcomingRes] = await Promise.all([
        fetch(`${origin}/api/billing/summary`, { cache: 'no-store' }),
        fetch(`${origin}/api/billing/invoices?limit=12`, { cache: 'no-store' }),
        fetch(`${origin}/api/billing/upcoming`, { cache: 'no-store' }),
      ]);

      if (summaryRes.ok) {
        const newSummary = await summaryRes.json();
        setSummary(newSummary);
        const newHasActiveSub = newSummary?.subscription?.Status === 'active';
        setHasActiveSubscription(newHasActiveSub);
      }

      if (invoicesRes.ok) {
        const newInvoices = await invoicesRes.json();
        setInvoices(newInvoices);
      }

      if (upcomingRes.ok) {
        const newUpcoming = await upcomingRes.json();
        setUpcoming(newUpcoming);
      }
    } catch (error) {
      console.error('Failed to refresh billing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const planName = (summary?.subscription?.CurrentPlan as 'Growth' | 'Teams' | undefined) || undefined;

  // Plan copy based on current tier
  let planTitle = 'No active plan';
  let planDescription =
    'Choose a plan to unlock live sync, AI scanning, and team features.';

  if (planName === 'Growth') {
    planTitle = 'Growth · $20/month';
    planDescription =
      '2 users/partners, unlimited platforms & inventory, AI: 40 scans included then $0.20 per scan.';
  } else if (planName === 'Teams') {
    planTitle = 'Teams · $60/month';
    planDescription =
      '5 users/partners (+$10/spot after), unlimited platforms & inventory, AI: 80 scans included then $0.15 per scan.';
  }

  const aiUsed = summary?.ai_credits_used ?? 0;
  const aiLimit = summary?.ai_credits_limit ?? 0;
  const onDemandUsed = summary?.on_demand_usage_this_month ?? 0;
  const onDemandLimit = summary?.on_demand_limit ?? 0;

  const teamMembersCount = summary?.team_members_count ?? 0;
  const teamMembersIncluded = summary?.team_members_included ?? 0;
  const teamMembersExtra = summary?.team_members_extra ?? 0;
  const teamMembersCost = summary?.team_members_cost ?? 0;

  const featureUsage = summary?.usage || {};
  const featureEntries = Object.entries(featureUsage || {});
  const hasFeatureUsage = featureEntries.some(
    ([, value]: [string, any]) =>
      (value.totalQuantity || value.count || 0) > 0 || (value.totalCost || 0) > 0,
  );

  const hasAiUsage = aiUsed > 0;
  const hasOnDemandUsage = onDemandUsed > 0;
  const hasAnyUsage = hasAiUsage || hasOnDemandUsage || hasFeatureUsage;

  const handleTierSelected = (tier: any) => {
    // Redirect to Polar checkout with the selected product
    window.location.href = `/api/polar/checkout?products=${encodeURIComponent(tier.productId)}`;
  };

  if (showTierSelector) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4" style={{ backgroundColor: '#FEF4DD' }}>
        <div className="w-full">
          <TierSelector 
            onSelectTier={handleTierSelected}
            onClose={() => setShowTierSelector(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-2 min-h-[100vh]" style={{ backgroundColor: '#FEF4DD' }}>
      <PageWrapper title="Billing" description="Manage your subscription, usage, and billing information">
        {/* Actions & Refresh Button */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex-1">
            <BillingActions
              hasActiveSubscription={hasActiveSubscription}
              onSubscribeClick={() => setShowTierSelector(true)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshBillingData}
            disabled={isRefreshing}
            className="gap-2"
            title="Refresh billing data"
          >
            <RefreshCwIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        <div className="flex flex-1 flex-col gap-6">
          {/* Main Plan Summary Card */}
          <Card className="border-2 shadow-none">
            <CardHeader className="pb-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <CardTitle className="text-lg font-semibold mb-0">
                    {planTitle}
                  </CardTitle>
                  <p className="text-xs mt-1 text-muted-foreground">
                    {planDescription}
                  </p>
                </div>
                <div className="flex flex-col gap-3 items-end">
                  <span className="text-xs text-muted-foreground">
                    {summary?.subscription?.CurrentPeriodEnd
                      ? new Date(summary.subscription.CurrentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'No active subscription'}
                  </span>
                  <Badge variant={summary?.subscription?.Status === 'active' ? 'default' : 'secondary'}>
                    {summary?.subscription?.Status === 'active' ? 'Active' : 'Inactive'}
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
                    {/* Team members row (always shown, backed by DB) */}
                    <TableRow>
                      <TableCell>Team members</TableCell>
                      <TableCell className="text-right">
                        {teamMembersCount}{' '}
                        {teamMembersIncluded
                          ? (
                              <span className="text-muted-foreground">
                                / {teamMembersIncluded} included
                                {teamMembersExtra > 0 ? ` (+${teamMembersExtra} extra)` : ''}
                              </span>
                            )
                          : null}
                      </TableCell>
                      <TableCell className="text-right">
                        {teamMembersCost > 0 ? `$${teamMembersCost.toFixed(2)}` : 'Included'}
                      </TableCell>
                    </TableRow>

                    {/* AI credits row (only if there was any AI usage or configured limit) */}
                    {hasAiUsage && (
                      <TableRow>
                        <TableCell>AI Credits Used</TableCell>
                        <TableCell className="text-right">
                          ${aiUsed.toFixed(2)}{' '}
                          {aiLimit ? (
                            <span className="text-muted-foreground">/ ${aiLimit.toFixed(2)}</span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right">${aiUsed.toFixed(2)}</TableCell>
                      </TableRow>
                    )}

                    {/* Import/Sync row (only if any usage) */}
                    {hasOnDemandUsage && (
                      <TableRow>
                        <TableCell>Import/Sync Operations</TableCell>
                        <TableCell className="text-right">
                          {onDemandUsed}{' '}
                          <span className="text-muted-foreground">
                            / {onDemandLimit || 'unlimited'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-green-700">Included</TableCell>
                      </TableRow>
                    )}

                    {/* Per-feature usage rows (only if we have any) */}
                    {hasFeatureUsage &&
                      featureEntries.slice(0, 3).map(([key, value]: [string, any]) => (
                        <TableRow key={key}>
                          <TableCell className="text-sm">
                            {key.replace(/_/g, ' ').charAt(0).toUpperCase() +
                              key.replace(/_/g, ' ').slice(1)}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {value.totalQuantity || value.count || 0}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            ${((value.totalCost || 0) / 100).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}

                    {/* Fallback row only when there is truly no usage this month */}
                    {!hasAnyUsage && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No usage this month
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow className="border-t">
                      <TableCell className="font-semibold">Total This Month</TableCell>
                      <TableCell />
                      <TableCell className="text-right font-semibold">
                        ${Number(summary?.total || 0).toFixed(2)}
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
                    <span className="font-mono">
                      ${aiUsed.toFixed(2)}
                      {aiLimit ? ` / $${aiLimit.toFixed(2)}` : ''}
                    </span>
                  </div>
                  <Progress
                    value={aiLimit > 0 ? (aiUsed / aiLimit) * 100 : 0}
                    className="h-3 bg-yellow-500 bg-gray-200"
                    indicatorClassName="bg-yellow-500"
                  />
                </div>
                {/* On-Demand Usage progress bar */}
                <div>
                  <div className="flex justify-between items-baseline mb-1 text-xs">
                    <span className="font-semibold">On-Demand Usage This Month</span>
                    <span className="font-mono">
                      {onDemandUsed} / {onDemandLimit || 'unlimited'}
                    </span>
                  </div>
                  <Progress
                    value={
                      onDemandLimit && onDemandLimit > 0
                        ? (onDemandUsed / onDemandLimit) * 100
                        : 0
                    }
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
              {invoices?.invoices && invoices.invoices.length > 0 ? (
                <div className="space-y-4">
                  {invoices.invoices.map((inv: any) => (
                    <div key={inv.id} className="flex flex-col gap-3 p-4 border rounded-lg sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-medium">{new Date(inv.created || inv.created_at || Date.now()).toLocaleDateString()}</div>
                        <div className="text-sm text-muted-foreground">{inv.number || 'Invoice'}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={inv.status === 'paid' ? 'bg-green-100 text-green-800' : undefined}>{inv.status || 'open'}</Badge>
                        <div className="text-right">
                          <div className="font-medium">
                            {((inv.total || 0) / (inv.total > 100 ? 100 : 1)).toLocaleString(undefined, { 
                              style: 'currency', 
                              currency: inv.currency?.toUpperCase() || 'USD' 
                            })}
                          </div>
                        </div>
                        {(inv.hosted_invoice_url || inv.hosted_url || inv.url) && (
                          <Button asChild variant="ghost" size="sm">
                            <a href={inv.hosted_invoice_url || inv.hosted_url || inv.url} target="_blank" rel="noreferrer">
                              <ExternalLinkIcon className="size-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground text-center py-6">No invoices found.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageWrapper>
    </div>
  );
}
