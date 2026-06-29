import { internationalizationMiddleware } from '@repo/internationalization/middleware';
import type { NextMiddleware, NextRequest } from 'next/server';

export const config = {
  // exclude api routes and static assets from i18n middleware
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|logo.png|assets|\.well-known|ingest).*)',
  ],
};

const middleware = ((request: NextRequest) => {
  return internationalizationMiddleware(request);
}) as unknown as NextMiddleware;

export default middleware;