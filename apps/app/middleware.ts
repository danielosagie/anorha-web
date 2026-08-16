import { authMiddleware } from '@repo/auth/middleware';
import {
  contentSecurityPolicyReportOnly,
  noseconeMiddleware,
  noseconeOptions,
  noseconeOptionsWithToolbar,
} from '@repo/security/middleware';
import type { NextMiddleware } from 'next/server';
import { NextResponse } from 'next/server';
import { env } from './env';
import { isAdminClerkUserId } from './lib/admin-auth';

const securityHeaders = env.FLAGS_SECRET
  ? noseconeMiddleware(noseconeOptionsWithToolbar)
  : noseconeMiddleware(noseconeOptions);

const isAdminPath = (pathname: string): boolean =>
  pathname === '/admin' || pathname.startsWith('/admin/');

export default authMiddleware(async (session, request) => {
  const response = await securityHeaders();

  response.headers.set(
    'Content-Security-Policy-Report-Only',
    contentSecurityPolicyReportOnly()
  );

  if (isAdminPath(request.nextUrl.pathname)) {
    const { userId } = await session();
    if (!isAdminClerkUserId(userId, env.ADMIN_CLERK_USER_IDS)) {
      return new NextResponse(null, {
        status: 404,
        headers: response.headers,
      });
    }
  }

  return response;
}) as unknown as NextMiddleware;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
