import { env } from '@/env';
import { withToolbar } from '@repo/feature-flags/lib/toolbar';
import { config, withAnalyzer } from '@repo/next-config';
import { withLogging, withSentry } from '@repo/observability/next-config';
import type { NextConfig } from 'next';

let nextConfig: NextConfig = withToolbar(withLogging(config));

nextConfig.images?.remotePatterns?.push({
  protocol: 'https',
  hostname: 'assets.basehub.com',
});

const redirects: NextConfig['redirects'] = async () => [
  {
    source: '/legal',
    destination: '/legal/privacy',
    permanent: true,
  },
  {
    source: '/privacy',
    destination: '/legal/privacy',
    permanent: true,
  },
  {
    source: '/terms',
    destination: '/legal/terms',
    permanent: true,
  },
  {
    source: '/delete-account',
    destination: '/legal/account-deletion',
    permanent: true,
  },
  {
    source: '/account-deletion',
    destination: '/legal/account-deletion',
    permanent: true,
  },
  {
    source: '/data-deletion',
    destination: '/legal/account-deletion',
    permanent: true,
  },
  {
    source: '/data-safety',
    destination: '/legal/data-safety',
    permanent: true,
  },
  {
    source: '/support',
    destination: '/legal/support',
    permanent: true,
  },
];

nextConfig.redirects = redirects;

if (env.VERCEL) {
  nextConfig = withSentry(nextConfig);
}

if (env.ANALYZE === 'true') {
  nextConfig = withAnalyzer(nextConfig);
}

export default nextConfig;
