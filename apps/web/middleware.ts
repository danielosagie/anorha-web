import { authMiddleware } from '@repo/auth/middleware';
import { internationalizationMiddleware } from '@repo/internationalization/middleware';
import {
  contentSecurityPolicyReportOnly,
  noseconeMiddleware,
  noseconeOptionsPublicSite,
} from '@repo/security/middleware';
import type { NextMiddleware } from 'next/server';
import { NextResponse } from 'next/server';

export const config = {
  // Clerk must see API requests so server routes can read the active session.
  // Static assets do not need either Clerk or locale handling.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|logo.png|assets|\\.well-known|ingest).*)',
  ],
};

const securityHeaders = noseconeMiddleware(noseconeOptionsPublicSite);

function isPublicIntakePath(pathname: string): boolean {
  if (pathname.startsWith('/api/x/')) {
    return true;
  }
  const segments = pathname.split('/').filter(Boolean);
  return segments[0] === 'x' || segments[1] === 'x';
}

// The landing site was serving no security headers at all: no HSTS, no
// nosniff, nothing stopping it being framed. It is the most-visited surface and
// the one signed-out sellers land on, so it gets the same treatment as the app.
async function withSecurityHeaders(
  response: Response,
  pathname: string
): Promise<Response> {
  const headers = await securityHeaders();

  headers.headers.forEach((value, key) => {
    response.headers.set(key, value);
  });

  response.headers.set(
    'Content-Security-Policy-Report-Only',
    contentSecurityPolicyReportOnly()
  );

  if (pathname.includes('/x/')) {
    response.headers.set('Referrer-Policy', 'no-referrer');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return response;
}

const authenticatedMiddleware = authMiddleware((_auth, request) => {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return withSecurityHeaders(NextResponse.next(), request.nextUrl.pathname);
  }

  return withSecurityHeaders(
    internationalizationMiddleware(request),
    request.nextUrl.pathname
  );
}) as unknown as NextMiddleware;

const middleware: NextMiddleware = (request, event) => {
  if (!isPublicIntakePath(request.nextUrl.pathname)) {
    return authenticatedMiddleware(request, event);
  }

  if (request.nextUrl.pathname.startsWith('/api/')) {
    return withSecurityHeaders(NextResponse.next(), request.nextUrl.pathname);
  }

  return withSecurityHeaders(
    internationalizationMiddleware(request),
    request.nextUrl.pathname
  );
};

export default middleware;
