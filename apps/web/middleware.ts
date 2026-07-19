import { authMiddleware } from '@repo/auth/middleware';
import { internationalizationMiddleware } from '@repo/internationalization/middleware';
import type { NextMiddleware } from 'next/server';
import { NextResponse } from 'next/server';

export const config = {
  // Clerk must see API requests so server routes can read the active session.
  // Static assets do not need either Clerk or locale handling.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|logo.png|assets|\\.well-known|ingest).*)',
  ],
};

const middleware = authMiddleware((_auth, request) => {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  return internationalizationMiddleware(request);
}) as unknown as NextMiddleware;

export default middleware;
