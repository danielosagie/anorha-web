import { env } from '@/env';
import { auth } from '@repo/auth/server';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { ConnectExtensionClient } from './connect-extension-client';

type ConnectExtensionPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    auto?: string | string[];
    extId?: string | string[];
  }>;
};

export const metadata: Metadata = {
  description: 'Connect the Anorha browser extension to Anorha Tray.',
  robots: {
    follow: false,
    index: false,
  },
  title: 'Connect extension | Anorha',
};

const extensionIdPattern = /^[a-p]{32}$/;

// This page mints a pairing grant and hands it to `extensionId`. Letting the URL
// choose that id meant ?extId=<attacker-extension> pointed a signed-in seller's
// grant at an extension the attacker controls, and a well-formed id proves
// nothing about who owns it. So ?extId is only honoured for an id this
// deployment was told to trust ahead of time:
//   - in development, any well-formed id, because local unpacked builds get a
//     new id on every load and there is no seller session worth stealing;
//   - in production, only ids named in ANORHA_CONNECT_EXTID_ALLOWLIST, so a
//     known dev build can be paired without re-opening the door to every id an
//     attacker can put in a link.
// The Web Store id stays the default whenever no override is honoured.
const allowAnyExtensionOverride = process.env.NODE_ENV !== 'production';
const extensionAllowlist = new Set(
  (env.ANORHA_CONNECT_EXTID_ALLOWLIST ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter((id) => extensionIdPattern.test(id))
);

function isTrustedExtensionId(extensionId: string): boolean {
  if (!extensionIdPattern.test(extensionId)) {
    return false;
  }

  return allowAnyExtensionOverride || extensionAllowlist.has(extensionId);
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function firstHeaderValue(value: string | null): string | undefined {
  return value?.split(',')[0]?.trim() || undefined;
}

/**
 * Clerk sends the seller back to `returnBackUrl` after sign-in, so it has to be
 * the origin they are actually on. NEXT_PUBLIC_WEB_URL is baked in at build
 * time and ships as http://localhost:3001, which sent production sign-ins to a
 * machine that isn't there. The forwarded host is the one value that is right
 * on production, on preview deployments, and in local dev at once; Vercel only
 * routes a request here when its host is a domain attached to this project, so
 * it cannot be pointed somewhere else. The canonical production URL is the
 * fallback, and localhost is only ever reached off-Vercel.
 */
async function resolveReturnOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const host = firstHeaderValue(
    requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')
  );

  if (host) {
    const protocol =
      firstHeaderValue(requestHeaders.get('x-forwarded-proto')) ??
      (host.startsWith('localhost') || host.startsWith('127.0.0.1')
        ? 'http'
        : 'https');

    return `${protocol}://${host}`;
  }

  return env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
    : env.NEXT_PUBLIC_WEB_URL;
}

export default async function ConnectExtensionPage({
  params,
  searchParams,
}: ConnectExtensionPageProps) {
  const [{ locale }, query, session] = await Promise.all([
    params,
    searchParams,
    auth(),
  ]);
  const auto = firstValue(query.auto);
  const requestedExtension = firstValue(query.extId);
  const extensionOverride =
    requestedExtension && isTrustedExtensionId(requestedExtension)
      ? requestedExtension
      : undefined;

  if (requestedExtension && !extensionOverride) {
    // A refused id is otherwise invisible: the page silently pairs the Web
    // Store build and the dev build never hears back. Name the budget and the
    // ask so the fix is "add this id to the allowlist", not "stare at a page".
    console.warn(
      `[connect-extension] Refused ?extId=${requestedExtension}: not in ANORHA_CONNECT_EXTID_ALLOWLIST (${extensionAllowlist.size} id(s) allowed).`
    );
  }

  const { redirectToSignIn, userId } = session;

  if (!userId) {
    const returnUrl = new URL(
      `/${locale}/connect-extension`,
      await resolveReturnOrigin()
    );

    if (auto) {
      returnUrl.searchParams.set('auto', auto);
    }

    if (extensionOverride) {
      returnUrl.searchParams.set('extId', extensionOverride);
    }

    return redirectToSignIn({ returnBackUrl: returnUrl.toString() });
  }

  const extensionId = extensionOverride ?? env.NEXT_PUBLIC_ANORHA_EXTENSION_ID;
  const storeUrl = env.NEXT_PUBLIC_ANORHA_EXTENSION_ID
    ? `https://chromewebstore.google.com/detail/${env.NEXT_PUBLIC_ANORHA_EXTENSION_ID}`
    : undefined;

  return (
    <ConnectExtensionClient
      autoConnect={auto === '1'}
      extensionId={extensionId}
      storeUrl={storeUrl}
    />
  );
}
