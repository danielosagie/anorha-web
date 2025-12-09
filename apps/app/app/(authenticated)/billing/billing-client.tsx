'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@repo/design-system/components/ui/card';
import { Progress } from '@repo/design-system/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/design-system/components/ui/table';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Button } from '@repo/design-system/components/ui/button';
import { TrendingUpIcon, CalendarIcon, ExternalLinkIcon, RefreshCwIcon, CreditCardIcon, AlertCircleIcon } from 'lucide-react';
import { BillingActions } from './billing-actions';
import { TierSelector } from './tier-selector';
import { PageWrapper } from '../components/page-wrapper';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

interface BillingClientProps {
  summary: any;
  invoices: any;
  upcoming: any;
  hasActiveSubscription: boolean;
  userRole?: 'owner' | 'employee' | 'partner' | 'org:admin';
  partnerPaymentMethod?: {
    hasPaymentMethod: boolean;
    lastFour?: string;
    brand?: string;
    expiresAt?: string;
  } | null;
}

export function BillingClient({
  summary: initialSummary,
  invoices: initialInvoices,
  upcoming: initialUpcoming,
  hasActiveSubscription: initialHasActiveSubscription,
  userRole,
  partnerPaymentMethod: initialPartnerPaymentMethod,
}: BillingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getToken } = useAuth();
  const [showTierSelector, setShowTierSelector] = useState(false);
  const [summary, setSummary] = useState(initialSummary);
  const [invoices, setInvoices] = useState(initialInvoices);
  const [upcoming, setUpcoming] = useState(initialUpcoming);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(initialHasActiveSubscription);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [partnerPaymentMethod, setPartnerPaymentMethod] = useState(initialPartnerPaymentMethod);
  const [isAddingPaymentMethod, setIsAddingPaymentMethod] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  
  // Check if user is a partner (needs their own payment method for AI scans)
  const isPartner = userRole === 'partner';

  // Normalizes any numeric-ish value to a finite number or a fallback
  const safeNumber = (value: any, fallback = 0) => {
    const num = typeof value === 'string' ? Number(value) : value;
    return Number.isFinite(num) ? num : fallback;
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  const planFromSummary =
    summary?.subscription?.CurrentPlan ||
    summary?.tier_name ||
    summary?.subscription?.current_plan;
  const subscriptionStatus =
    summary?.subscription?.Status || summary?.subscription?.status;
  const hasSummaryData = !!summary && typeof summary === 'object';

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

  // Surface portal error passed via query string from the API route
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      try {
        setActionError(decodeURIComponent(errorParam));
      } catch {
        setActionError(errorParam);
      }
    }
  }, [searchParams]);

  // Refresh billing data from API
  const refreshBillingData = async () => {
    setIsRefreshing(true);
    setActionError(null);
    try {
      // Use standard Clerk token (backend accepts it via ClerkTokenService)
      const token = await getToken();
      
      if (!token) {
        console.error('No auth token available');
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!baseUrl) {
        console.error('NEXT_PUBLIC_API_URL not set');
        return;
      }

      // Normalize URL
      let apiBase = baseUrl;
      if (apiBase.endsWith('/')) apiBase = apiBase.slice(0, -1);
      if (!apiBase.endsWith('/api')) apiBase = `${apiBase}/api`;

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const [summaryRes, invoicesRes, upcomingRes] = await Promise.all([
        fetch(`${apiBase}/billing/summary`, { headers, cache: 'no-store' }),
        fetch(`${apiBase}/billing/invoices?limit=12`, { headers, cache: 'no-store' }),
        fetch(`${apiBase}/billing/upcoming`, { headers, cache: 'no-store' }),
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

  const planName = (planFromSummary as 'Growth' | 'Teams' | undefined) || undefined;

  // AI usage - prefer credit counts with overage cost
  const aiScansUsed = safeNumber(summary?.ai_scans_used);
  const aiScansLimit = safeNumber(
    summary?.ai_scans_limit,
    planName === 'Teams' ? 80 : 40,
  );
  const aiCreditsUsed = safeNumber(summary?.ai_credits_used, aiScansUsed);
  const aiCreditsLimit = safeNumber(summary?.ai_credits_limit, aiScansLimit);
  const aiOverageCents = safeNumber(summary?.ai_credits_overage_cents, 0);
  const aiOverageDollars = aiOverageCents / 100;
  const aiUnitCents = safeNumber(
    summary?.ai_credit_unit_cents,
    planName === 'Teams' ? 15 : 20,
  );
  const onDemandUsed = safeNumber(summary?.on_demand_usage_this_month);
  const onDemandLimit = safeNumber(summary?.on_demand_limit, 0);

  const teamMembersCount = safeNumber(summary?.team_members_count);
  const teamMembersIncluded = safeNumber(summary?.team_members_included);
  const teamMembersExtra = Math.max(0, safeNumber(summary?.team_members_extra));
  const teamMembersCost = safeNumber(summary?.team_members_cost);
  const totalThisMonth = safeNumber(summary?.total);

  // Totals come straight from backend; on-demand hidden per request
  const displayedTeamMembersCost = teamMembersCost;
  const displayedTotal = totalThisMonth;
  const showOnDemandUsage = false; // Hide on-demand usage/limit per request

  const pricePerScan = aiUnitCents / 100;

  // Plan copy based on current tier
  let planTitle = 'No active plan';
  let planDescription =
    'Choose a plan to unlock live sync, AI scanning, and team features.';

  if (planName === 'Growth') {
    planTitle = 'Growth · $20/month';
    planDescription = `${teamMembersIncluded || 2} users/partners included, unlimited platforms & inventory, AI: ${aiScansLimit || 40} scans included then ${formatCurrency(pricePerScan)}/scan.`;
  } else if (planName === 'Teams') {
    planTitle = 'Teams · $60/month';
    planDescription = `${teamMembersIncluded || 5} users/partners (+$10/spot after), unlimited platforms & inventory, AI: ${aiScansLimit || 80} scans included then ${formatCurrency(pricePerScan)}/scan.`;
  }

  const featureUsage = summary?.usage || {};
  const featureEntries = Object.entries(featureUsage || {});
  const hasFeatureUsage = featureEntries.some(
    ([, value]: [string, any]) =>
      (value.totalQuantity || value.count || 0) > 0 || (value.totalCost || 0) > 0,
  );

  const hasAiUsage = aiCreditsUsed > 0 || aiScansUsed > 0;
  const hasOnDemandUsage = showOnDemandUsage && onDemandUsed > 0;
  const hasAnyUsage = hasAiUsage || hasOnDemandUsage || hasFeatureUsage;

  const handleTierSelected = (tier: any) => {
    // Redirect to Polar checkout with the selected product
    window.location.href = `/api/polar/checkout?products=${encodeURIComponent(tier.productId)}`;
  };

  // Open the managed subscription portal (Stripe or Polar) via backend route
  const handleManageSubscription = async () => {
    setActionError(null);
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'GET',
        redirect: 'manual',
        credentials: 'include',
      });

      // If backend returned a redirect, follow it client-side
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('Location');
        if (location) {
          window.location.href = location;
          return;
        }
      }

      // Some deployments may return JSON with { url }
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.url) {
          window.location.href = data.url;
          return;
        }
      }

      const text = await res.text();
      setActionError(text || 'Unable to open subscription portal.');
    } catch (error) {
      console.error('Failed to open portal:', error);
      setActionError('Unable to open subscription portal.');
    }
  };

  // Handle partner adding their payment method for per-usage AI scans
  const handleAddPartnerPaymentMethod = async () => {
    setIsAddingPaymentMethod(true);
    try {
      const token = await getToken();
      if (!token) {
        console.error('No auth token available');
        return;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!baseUrl) {
        console.error('NEXT_PUBLIC_API_URL not set');
        return;
      }

      let apiBase = baseUrl;
      if (apiBase.endsWith('/')) apiBase = apiBase.slice(0, -1);
      if (!apiBase.endsWith('/api')) apiBase = `${apiBase}/api`;

      // Create a Polar customer session for partner to add payment method
      const response = await fetch(`${apiBase}/billing/partner/payment-method`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.checkoutUrl) {
          // Redirect to Polar to add payment method
          window.location.href = data.checkoutUrl;
        }
      } else {
        console.error('Failed to create payment method session');
      }
    } catch (error) {
      console.error('Failed to add payment method:', error);
    } finally {
      setIsAddingPaymentMethod(false);
    }
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
              onManageSubscription={handleManageSubscription}
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

        {actionError && (
          <div className="mb-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <AlertCircleIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
        )}
        {!hasSummaryData && (
          <div className="mb-4 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
            Billing data is temporarily unavailable. Use Refresh to retry.
          </div>
        )}

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
                  <Badge variant={subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                    {subscriptionStatus === 'active' ? 'Active' : 'Inactive'}
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
                        {displayedTeamMembersCost > 0 ? `$${displayedTeamMembersCost.toFixed(2)}` : 'Included'}
                      </TableCell>
                    </TableRow>

                    {/* AI credits row (only if there was any AI usage or configured limit) */}
                    {hasAiUsage && (
                      <TableRow>
                        <TableCell>AI Credits Used</TableCell>
                        <TableCell className="text-right">
                          {aiCreditsUsed} / {aiCreditsLimit} credits
                        </TableCell>
                        <TableCell className="text-right">
                          {aiOverageDollars > 0 ? `$${aiOverageDollars.toFixed(2)}` : 'Included'}
                        </TableCell>
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
                        ${displayedTotal.toFixed(2)}
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
                {/*<TrendingUpIcon className="size-5" />*/}
                Current Usage
              </CardTitle>
              <CardDescription>Usage for the current billing period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {/* "AI Scans" progress bar */}
                <div>
                  <div className="flex justify-between items-baseline mb-1 text-xs">
                    <span className="font-semibold">AI Credits</span>
                    <span className="font-mono">
                      {aiCreditsUsed} / {aiCreditsLimit} credits
                      {aiOverageDollars > 0 && (
                        <span className="text-muted-foreground ml-2">(${aiOverageDollars.toFixed(2)} overage)</span>
                      )}
                    </span>
                  </div>
                  <Progress
                    value={aiCreditsLimit > 0 ? (aiCreditsUsed / aiCreditsLimit) * 100 : 0}
                    className="h-3 bg-yellow-500 bg-gray-200"
                    indicatorClassName="bg-yellow-500"
                  />
                </div>
                {/* On-Demand Usage progress bar (hidden per request) */}
                {showOnDemandUsage && (
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
                )}
                {/* Edit usage limit button */}
                <div>
                  <Button
                    variant="secondary"
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

          {/* Partner Payment Method Card - Only shown for partners */}
          {isPartner && (
            <Card className="shadow-none border-2 border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCardIcon className="size-5 text-yellow-600" />
                  Partner Payment Method
                </CardTitle>
                <CardDescription>
                  Add a payment method to enable per-usage AI scanning
                </CardDescription>
              </CardHeader>
              <CardContent>
                {partnerPaymentMethod?.hasPaymentMethod ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg border">
                        <CreditCardIcon className="size-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {partnerPaymentMethod.brand || 'Card'} •••• {partnerPaymentMethod.lastFour || '****'}
                        </p>
                        {partnerPaymentMethod.expiresAt && (
                          <p className="text-xs text-muted-foreground">
                            Expires {partnerPaymentMethod.expiresAt}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddPartnerPaymentMethod}
                      disabled={isAddingPaymentMethod}
                    >
                      {isAddingPaymentMethod ? 'Loading...' : 'Update'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-yellow-200">
                      <AlertCircleIcon className="size-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-800">No payment method on file</p>
                        <p className="text-muted-foreground">
                          As a partner, you can use the owner&apos;s AI credits for free. 
                          To use AI scanning beyond their limits, add your own payment method 
                          and you&apos;ll be charged $0.20 per scan.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleAddPartnerPaymentMethod}
                      disabled={isAddingPaymentMethod}
                      className="w-full bg-yellow-600 hover:bg-yellow-700"
                    >
                      {isAddingPaymentMethod ? 'Loading...' : 'Add Payment Method for AI Scans'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Upcoming Invoice */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {/*<CalendarIcon className="size-5" />*/}
                {upcoming?.upcoming ? 'Upcoming Invoice' : 'No Upcoming Invoice'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcoming?.upcoming ? (
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">
                    {(() => {
                      // Handle both number and price object formats
                      const total = upcoming.upcoming.total;
                      const amount = typeof total === 'object' 
                        ? (total?.price_amount || total?.amount || 0) / 100 
                        : (total || 0) / 100;
                      return amount.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
                    })()}
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
                        <div className="font-medium">{(() => {
                          // Handle both Unix timestamp (seconds) and ISO date string
                          const created = inv.created_at || inv.created;
                          if (!created) return 'N/A';
                          // If it's a small number, it's Unix seconds - convert to ms
                          const timestamp = typeof created === 'number' && created < 10000000000 
                            ? created * 1000 
                            : created;
                          return new Date(timestamp).toLocaleDateString();
                        })()}</div>
                        <div className="text-sm text-muted-foreground">{inv.number || 'Invoice'}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={inv.status === 'paid' ? 'bg-green-100 text-green-800' : undefined}>{inv.status || 'open'}</Badge>
                        <div className="text-right">
                          <div className="font-medium">
                            {(() => {
                              // Use total_amount (cents) if available, else total
                              const amount = inv.total_amount ?? inv.total ?? 0;
                              // Convert cents to dollars
                              return (amount / 100).toLocaleString(undefined, { 
                                style: 'currency', 
                                currency: inv.currency?.toUpperCase() || 'USD' 
                              });
                            })()}
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
