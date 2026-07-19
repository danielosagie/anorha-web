import { env } from '@/env';
import { auth } from '@repo/auth/server';
import type { Metadata } from 'next';
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
const chromeWebStoreHome =
  'https://chromewebstore.google.com/category/extensions';

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
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
  const extensionOverride = firstValue(query.extId);
  const { redirectToSignIn, userId } = session;

  if (!userId) {
    const returnUrl = new URL(
      `/${locale}/connect-extension`,
      env.NEXT_PUBLIC_WEB_URL
    );

    if (auto) {
      returnUrl.searchParams.set('auto', auto);
    }

    if (extensionOverride) {
      returnUrl.searchParams.set('extId', extensionOverride);
    }

    return redirectToSignIn({ returnBackUrl: returnUrl.toString() });
  }

  const extensionId =
    extensionOverride && extensionIdPattern.test(extensionOverride)
      ? extensionOverride
      : env.NEXT_PUBLIC_ANORHA_EXTENSION_ID;
  const storeUrl = env.NEXT_PUBLIC_ANORHA_EXTENSION_ID
    ? `https://chromewebstore.google.com/detail/${env.NEXT_PUBLIC_ANORHA_EXTENSION_ID}`
    : chromeWebStoreHome;

  return (
    <ConnectExtensionClient
      autoConnect={auto === '1'}
      extensionId={extensionId}
      storeUrl={storeUrl}
    />
  );
}
