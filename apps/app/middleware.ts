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

/** The mobile app appends this to the checkout return URLs it controls. */
const MOBILE_RETURN_PARAM = 'mobile';
const MOBILE_RETURN_DEEP_LINK = 'anorhaapp://billing/return';

export default authMiddleware(async (session, request) => {
  // A checkout or portal opened from the mobile app lands back here inside the app's own
  // browser sheet. Bounce straight into the app rather than render the web billing page in
  // a sheet the user cannot navigate. This lives in middleware, not the page, because the
  // authenticated layout would redirect an unauthenticated web session to sign-in first and
  // the user would never reach the bounce.
  if (
    request.nextUrl.pathname.startsWith('/billing') &&
    request.nextUrl.searchParams.get(MOBILE_RETURN_PARAM) === '1'
  ) {
    return NextResponse.redirect(MOBILE_RETURN_DEEP_LINK);
  }

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
