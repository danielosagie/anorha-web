import { auth, currentUser } from '@clerk/nextjs/server';
import { polar } from '@repo/payments';
import { PolarConfigError } from '@repo/payments/keys';
import { createClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';

class PolarPortalRouteError extends Error {
  constructor(
    readonly reasonCode: string,
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

const failureResponse = (
  reasonCode: string,
  status: number,
  message: string
) => NextResponse.json({ error: message, reasonCode }, { status });

export async function GET(_request: NextRequest) {
  try {
    const [{ userId }, clerkUser] = await Promise.all([auth(), currentUser()]);
    if (!userId || !clerkUser) {
      return failureResponse(
        'POLAR_PORTAL_UNAUTHORIZED',
        401,
        'Authentication is required.'
      );
    }

    if (!process.env.POLAR_ACCESS_TOKEN?.trim()) {
      console.error('[polar/portal] POLAR_ACCESS_TOKEN is not set');
      throw new PolarPortalRouteError(
        'POLAR_PORTAL_CONFIG_MISSING',
        503,
        'Subscription portal is not configured.'
      );
    }
    if (
      process.env.POLAR_API_SERVER !== 'production' &&
      process.env.POLAR_API_SERVER !== 'sandbox'
    ) {
      console.error('[polar/portal] POLAR_API_SERVER is not set or invalid');
      throw new PolarPortalRouteError(
        'POLAR_PORTAL_CONFIG_INVALID',
        503,
        'Subscription portal is not configured.'
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const supabaseKey = (
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )?.trim();
    if (!supabaseUrl || !supabaseKey) {
      console.error(
        '[polar/portal] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY is not set'
      );
      throw new PolarPortalRouteError(
        'POLAR_PORTAL_DATABASE_CONFIG_MISSING',
        503,
        'Subscription portal is not configured.'
      );
    }

    console.log(`[polar/portal] Resolving customer for Clerk user ${userId}`);
    const supabase = createClient(supabaseUrl, supabaseKey);
    let lookupFailed = false;

    const { data: userData, error: userError } = await supabase
      .from('Users')
      .select('Id, PolarCustomerId')
      .eq('ClerkUserId', userId)
      .maybeSingle();

    if (userError) {
      lookupFailed = true;
      console.error(
        '[polar/portal] Users lookup by ClerkUserId failed:',
        userError
      );
    }

    let internalUserId = userData?.Id as string | undefined;
    let polarCustomerId = userData?.PolarCustomerId as string | undefined;

    // Preserve the existing resolution chain: membership, then Clerk email.
    if (!internalUserId) {
      const { data: membership, error: membershipError } = await supabase
        .from('OrgMemberships')
        .select('UserId')
        .eq('clerk_user_id', userId)
        .maybeSingle();

      if (membershipError) {
        lookupFailed = true;
        console.error(
          '[polar/portal] OrgMemberships lookup failed:',
          membershipError
        );
      } else {
        internalUserId = membership?.UserId || undefined;
      }
    }

    if (!internalUserId && clerkUser.emailAddresses.length > 0) {
      const primaryEmail =
        clerkUser.emailAddresses.find(
          (email) => email.id === clerkUser.primaryEmailAddressId
        )?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;

      if (primaryEmail) {
        const { data: emailMatch, error: emailError } = await supabase
          .from('Users')
          .select('Id, PolarCustomerId, ClerkUserId')
          .ilike('Email', primaryEmail)
          .maybeSingle();

        if (emailError) {
          lookupFailed = true;
          console.error(
            '[polar/portal] Users lookup by email failed:',
            emailError
          );
        } else if (emailMatch?.Id) {
          internalUserId = emailMatch.Id;
          polarCustomerId = emailMatch.PolarCustomerId as string | undefined;

          const [userBackfill, membershipBackfill] = await Promise.all([
            supabase
              .from('Users')
              .update({ ClerkUserId: userId })
              .eq('Id', internalUserId),
            supabase
              .from('OrgMemberships')
              .update({ clerk_user_id: userId })
              .eq('UserId', internalUserId),
          ]);
          if (userBackfill.error) {
            console.error(
              '[polar/portal] Users ClerkUserId backfill failed:',
              userBackfill.error
            );
          }
          if (membershipBackfill.error) {
            console.error(
              '[polar/portal] OrgMemberships ClerkUserId backfill failed:',
              membershipBackfill.error
            );
          }
        }
      }
    }

    if (!polarCustomerId && internalUserId) {
      const { data: subscription, error: subscriptionError } = await supabase
        .from('Subscriptions')
        .select('PolarCustomerId, PolarSubscriptionId, Status')
        .eq('UserId', internalUserId)
        .maybeSingle();

      if (subscriptionError) {
        console.error(
          '[polar/portal] Subscriptions lookup failed:',
          subscriptionError
        );
        throw new PolarPortalRouteError(
          'POLAR_PORTAL_CUSTOMER_LOOKUP_FAILED',
          503,
          'Subscription details are temporarily unavailable.'
        );
      }

      if (subscription?.PolarCustomerId) {
        polarCustomerId = subscription.PolarCustomerId;
        const { error: syncError } = await supabase
          .from('Users')
          .update({
            PolarCustomerId: polarCustomerId,
            ClerkUserId: userId,
          })
          .eq('Id', internalUserId);
        if (syncError) {
          console.error(
            '[polar/portal] PolarCustomerId backfill failed:',
            syncError
          );
        }
      }
    }

    if (!polarCustomerId) {
      if (lookupFailed) {
        throw new PolarPortalRouteError(
          'POLAR_PORTAL_CUSTOMER_LOOKUP_FAILED',
          503,
          'Subscription details are temporarily unavailable.'
        );
      }
      throw new PolarPortalRouteError(
        'POLAR_PORTAL_CUSTOMER_NOT_FOUND',
        404,
        'No Polar subscription was found.'
      );
    }

    const session = await polar().customerSessions.create({
      customerId: polarCustomerId,
    });
    return NextResponse.redirect(session.customerPortalUrl);
  } catch (error) {
    if (error instanceof PolarPortalRouteError) {
      console.error(`[polar/portal] ${error.reasonCode}`);
      return failureResponse(error.reasonCode, error.status, error.message);
    }
    if (error instanceof PolarConfigError) {
      console.error(`[polar/portal] ${error.message}`);
      return failureResponse(
        'POLAR_PORTAL_CONFIG_INVALID',
        503,
        'Subscription portal is not configured.'
      );
    }

    console.error('[polar/portal] POLAR_PORTAL_UPSTREAM_FAILED', error);
    return failureResponse(
      'POLAR_PORTAL_UPSTREAM_FAILED',
      502,
      'Unable to open the subscription portal.'
    );
  }
}
