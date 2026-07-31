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

// The landing site was serving no security headers at all: no HSTS, no
// nosniff, nothing stopping it being framed. It is the most-visited surface and
// the one signed-out sellers land on, so it gets the same treatment as the app.
async function withSecurityHeaders(response: Response): Promise<Response> {
  const headers = await securityHeaders();

  headers.headers.forEach((value, key) => {
    response.headers.set(key, value);
  });

  response.headers.set(
    'Content-Security-Policy-Report-Only',
    contentSecurityPolicyReportOnly()
  );

  return response;
}

const middleware = authMiddleware(async (_auth, request) => {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return withSecurityHeaders(NextResponse.next());
  }

  return withSecurityHeaders(internationalizationMiddleware(request));
}) as unknown as NextMiddleware;

export default middleware;
