import { currentUser } from '@repo/auth/server';
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

async function getBillingData() {
  const origin = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  // Normalize base URL to always end with /api
  let baseUrl = origin.endsWith('/') ? origin.slice(0, -1) : origin;
  if (!baseUrl.endsWith('/api')) baseUrl = `${baseUrl}/api`;

  try {
    const headers = await getAuthenticatedBackendHeaders();

    // Use the proxy routes that handle JWT token exchange
    const [summaryRes, invoicesRes, upcomingRes] = await Promise.all([
      fetch(`${baseUrl}/billing/summary`, { headers, cache: 'no-store' }).catch(() => null),
      fetch(`${baseUrl}/billing/invoices?limit=12`, { headers, cache: 'no-store' }).catch(() => null),
      fetch(`${baseUrl}/billing/upcoming`, { headers, cache: 'no-store' }).catch(() => null),
    ]);

    const summary = summaryRes?.ok ? await summaryRes.json() : null;
    const invoices = invoicesRes?.ok ? await invoicesRes.json() : null;
    const upcoming = upcomingRes?.ok ? await upcomingRes.json() : { upcoming: null };

    return { summary, invoices, upcoming } as const;
  } catch (error) {
    console.error('Failed to fetch billing data:', error);
    // Return null data instead of throwing to prevent page crash
    return { summary: null, invoices: null, upcoming: { upcoming: null } } as const;
  }
}

export default async function BillingPage() {
  const currentUserData = await currentUser();
  if (!currentUserData) {
    return <div>Please log in to view billing information.</div>;
  }

  const { summary, invoices, upcoming } = await getBillingData();
  const subscription = summary?.subscription || null;
  const hasActiveSubscription = subscription?.Status === 'active';

  return (
    <>

      <BillingClient
        summary={summary}
        invoices={invoices}
        upcoming={upcoming}
        hasActiveSubscription={hasActiveSubscription}
      />
    </>
  );
}