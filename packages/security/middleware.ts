import {
  type NoseconeOptions,
  defaults,
  withVercelToolbar,
} from '@nosecone/next';
export { createMiddleware as noseconeMiddleware } from '@nosecone/next';

// Nosecone security headers configuration
// https://docs.arcjet.com/nosecone/quick-start
export const noseconeOptions: NoseconeOptions = {
  ...defaults,
  // CSP stays off HERE because nosecone only emits the enforcing header, and its
  // defaults (connect-src 'self', frame-src 'none') would block Clerk, Supabase,
  // and analytics the moment they shipped. The policy below is served in
  // report-only mode instead, which is the measurement that has to come before
  // enforcing anything.
  contentSecurityPolicy: false,
};

export const noseconeOptionsWithToolbar: NoseconeOptions =
  withVercelToolbar(noseconeOptions);

// The marketing site serves third-party media and embeds, and require-corp
// blocks any cross-origin resource that does not opt in with CORP headers. The
// rest of the defaults carry no such cost, so the landing app takes everything
// except that one.
export const noseconeOptionsPublicSite: NoseconeOptions = {
  ...noseconeOptions,
  crossOriginEmbedderPolicy: false,
};

function originOf(value: string | undefined): string[] {
  if (!value) {
    return [];
  }
  try {
    return [new URL(value).origin];
  } catch {
    return [];
  }
}

/**
 * Report-only CSP.
 *
 * Every origin this app talks to is configured, not hardcoded, so a hand-written
 * allowlist would be a guess and an enforcing guess is a white screen. Serving
 * it report-only turns the guess into data: violations show up in the console
 * (and at any report endpoint) without breaking a single page.
 *
 * Promote to the enforcing `Content-Security-Policy` header once a real browser
 * pass over the app and the landing site comes back with no violations.
 */
export function contentSecurityPolicyReportOnly(): string {
  const vendorOrigins = [
    ...originOf(process.env.NEXT_PUBLIC_API_URL),
    ...originOf(process.env.NEXT_PUBLIC_WEB_URL),
    ...originOf(process.env.NEXT_PUBLIC_SUPABASE_URL),
    ...originOf(process.env.NEXT_PUBLIC_CLERK_FRONTEND_API),
    ...originOf(process.env.NEXT_PUBLIC_POSTHOG_HOST),
    ...originOf(process.env.NEXT_PUBLIC_CONVEX_URL),
    'https://*.clerk.accounts.dev',
    'https://*.liveblocks.io',
    'wss://*.liveblocks.io',
  ];

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'base-uri': ["'none'"],
    'object-src': ["'none'"],
    'frame-ancestors': ["'none'"],
    'form-action': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'blob:', 'data:', 'https:'],
    'font-src': ["'self'", 'data:'],
    'media-src': ["'self'", 'blob:', 'https:'],
    'worker-src': ["'self'", 'blob:'],
    'frame-src': ["'self'", 'https:'],
    'connect-src': ["'self'", ...new Set(vendorOrigins)],
  };

  return Object.entries(directives)
    .map(([directive, values]) => `${directive} ${values.join(' ')}`)
    .join('; ');
}
