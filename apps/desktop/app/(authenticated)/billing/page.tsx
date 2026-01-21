import { currentUser, auth } from '@repo/auth/server';
import { BillingClient } from './billing-client';
import { Header } from '../components/header';
import { getAuthenticatedBackendHeaders } from '../../api/billing/_utils';
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

async function getBillingData(userRole?: string) {
  const origin = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  // Normalize base URL to always end with /api
  let baseUrl = origin.endsWith('/') ? origin.slice(0, -1) : origin;
  if (!baseUrl.endsWith('/api')) baseUrl = `${baseUrl}/api`;

  console.log('[BillingPage] getBillingData starting, baseUrl:', baseUrl);

  try {
    const headers = await getAuthenticatedBackendHeaders();
    console.log('[BillingPage] Got auth headers, fetching billing data...');

    // Use the proxy routes that handle JWT token exchange
    const [summaryRes, invoicesRes, upcomingRes, partnerPaymentRes] = await Promise.all([
      fetch(`${baseUrl}/billing/summary`, { headers, cache: 'no-store' }).catch((e) => {
        console.error('[BillingPage] Summary fetch error:', e);
        return null;
      }),
      fetch(`${baseUrl}/billing/invoices?limit=12`, { headers, cache: 'no-store' }).catch((e) => {
        console.error('[BillingPage] Invoices fetch error:', e);
        return null;
      }),
      fetch(`${baseUrl}/billing/upcoming`, { headers, cache: 'no-store' }).catch((e) => {
        console.error('[BillingPage] Upcoming fetch error:', e);
        return null;
      }),
      // Only fetch partner payment method if user is a partner
      userRole === 'partner'
        ? fetch(`${baseUrl}/billing/partner/payment-method`, { headers, cache: 'no-store' }).catch((e) => {
          console.error('[BillingPage] Partner payment fetch error:', e);
          return null;
        })
        : Promise.resolve(null),
    ]);

    console.log('[BillingPage] Fetch results - summary:', summaryRes?.status, 'invoices:', invoicesRes?.status, 'upcoming:', upcomingRes?.status);

    const summary = summaryRes?.ok ? await summaryRes.json() : null;
    const invoices = invoicesRes?.ok ? await invoicesRes.json() : null;
    const upcoming = upcomingRes?.ok ? await upcomingRes.json() : { upcoming: null };
    const partnerPaymentMethod = partnerPaymentRes?.ok ? await partnerPaymentRes.json() : null;

    console.log('[BillingPage] Parsed data - summary:', !!summary, 'invoices:', !!invoices, 'upcoming:', !!upcoming?.upcoming);

    return { summary, invoices, upcoming, partnerPaymentMethod } as const;
  } catch (error) {
    console.error('[BillingPage] Failed to fetch billing data:', error);
    // Return null data instead of throwing to prevent page crash
    return { summary: null, invoices: null, upcoming: { upcoming: null }, partnerPaymentMethod: null } as const;
  }
}

export default async function BillingPage() {
  const currentUserData = await currentUser();
  if (!currentUserData) {
    return <div>Please log in to view billing information.</div>;
  }

  // Get user role from Clerk organization membership
  const { orgRole } = await auth();
  // Normalize role to match expected types
  let userRole: 'owner' | 'employee' | 'partner' | 'org:admin' | undefined;
  if (orgRole === 'org:admin') {
    userRole = 'org:admin';
  } else if (orgRole === 'org:member') {
    // Check if this member is a partner via metadata or default to employee
    const orgMetadata = currentUserData.publicMetadata as { role?: string } | undefined;
    userRole = orgMetadata?.role === 'partner' ? 'partner' : 'employee';
  }

  const { summary, invoices, upcoming, partnerPaymentMethod } = await getBillingData(userRole);
  const subscription = summary?.subscription || null;
  const hasActiveSubscription = subscription?.Status === 'active';

  return (
    <>

      <BillingClient
        summary={summary}
        invoices={invoices}
        upcoming={upcoming}
        hasActiveSubscription={hasActiveSubscription}
        userRole={userRole}
        partnerPaymentMethod={partnerPaymentMethod}
      />
    </>
  );
}