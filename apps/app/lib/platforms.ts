import type { StaticImageData } from 'next/image';
import amazonLogo from '@/app/assets/amazon.svg';
import cloverLogo from '@/app/assets/clover.svg';
import depopLogo from '@/app/assets/depop.svg';
import ebayLogo from '@/app/assets/ebay.svg';
import facebookLogo from '@/app/assets/facebook.svg';
import shopifyLogo from '@/app/assets/shopify.svg';
import squareLogo from '@/app/assets/square.svg';
import whatnotLogo from '@/app/assets/whatnot.svg';

export type PlatformKey =
  | 'shopify'
  | 'square'
  | 'clover'
  | 'ebay'
  | 'facebook'
  | 'amazon'
  | 'whatnot'
  | 'depop';

export type PlatformStatus = 'ga' | 'planned';

export type PlatformDefinition = {
  key: PlatformKey;
  name: string;
  logo: StaticImageData;
  loginPath: string | null;
  connectMode: 'oauth' | 'shopify-domain' | null;
  status: PlatformStatus;
  extraParams?: Readonly<Record<string, string>>;
};

export const platforms: readonly PlatformDefinition[] = [
  {
    key: 'shopify',
    name: 'Shopify',
    logo: shopifyLogo,
    loginPath: '/api/auth/shopify/initiate-store-picker',
    connectMode: 'shopify-domain',
    status: 'ga',
  },
  {
    key: 'square',
    name: 'Square',
    logo: squareLogo,
    loginPath: '/api/auth/square/login',
    connectMode: 'oauth',
    status: 'ga',
  },
  {
    key: 'clover',
    name: 'Clover',
    logo: cloverLogo,
    loginPath: '/api/auth/clover/login',
    connectMode: 'oauth',
    status: 'ga',
  },
  {
    key: 'ebay',
    name: 'eBay',
    logo: ebayLogo,
    loginPath: '/api/auth/ebay/login',
    connectMode: 'oauth',
    status: 'ga',
  },
  {
    key: 'facebook',
    name: 'Facebook',
    logo: facebookLogo,
    loginPath: '/api/auth/facebook/login',
    connectMode: 'oauth',
    status: 'ga',
    extraParams: { mode: 'personal_marketplace' },
  },
  {
    key: 'amazon',
    name: 'Amazon',
    logo: amazonLogo,
    loginPath: null,
    connectMode: null,
    status: 'planned',
  },
  {
    key: 'whatnot',
    name: 'Whatnot',
    logo: whatnotLogo,
    loginPath: null,
    connectMode: null,
    status: 'planned',
  },
  {
    key: 'depop',
    name: 'Depop',
    logo: depopLogo,
    loginPath: null,
    connectMode: null,
    status: 'planned',
  },
] as const;

const platformIndex = new Map(
  platforms.map((platform) => [platform.key, platform])
);

export function getPlatform(
  raw?: string | null
): PlatformDefinition | undefined {
  if (!raw) {
    return undefined;
  }

  const normalized = raw.toLowerCase().trim();
  const exact = platformIndex.get(normalized as PlatformKey);
  if (exact) {
    return exact;
  }

  return platforms.find((platform) => normalized.includes(platform.key));
}
