import { internationalizationMiddleware } from '@repo/internationalization/middleware';
import type { NextMiddleware, NextRequest } from 'next/server';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json).*)'],
};

const middleware = ((request: NextRequest) => {
  return internationalizationMiddleware(request);
}) as unknown as NextMiddleware;

export default middleware;