import { env } from '@/env';
import { resend } from '@repo/email';
import { AndroidAccessTemplate } from '@repo/email/templates/android-access';
import { createRateLimiter, slidingWindow } from '@repo/rate-limit';
import { headers } from 'next/headers';
import { createElement } from 'react';

export const runtime = 'nodejs';

export async function GET() {
  return Response.json({ ok: true });
}

/**
 * Two limits, because they stop different things. The IP limit stops one caller
 * enumerating or hammering the form. The per-address limit stops the nastier
 * one: the endpoint sends mail to whatever address it is handed, so repeating a
 * stranger's address turned this into an email cannon pointed at them (and at
 * the staff inbox) even though the duplicate insert was already a no-op.
 */
async function rateLimited(email: string): Promise<boolean> {
  if (!(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN)) {
    // Upstash is the whole mechanism here, so without it this endpoint is back
    // to being an open mailer. Say so rather than failing open in silence.
    console.warn(
      '[waitlist] UPSTASH_REDIS_REST_URL/TOKEN unset: signup rate limiting is DISABLED'
    );
    return false;
  }

  const ip = (await headers()).get('x-forwarded-for') ?? 'unknown';

  const [byIp, byEmail] = await Promise.all([
    createRateLimiter({ limiter: slidingWindow(5, '1h'), prefix: 'waitlist_ip' }).limit(ip),
    createRateLimiter({ limiter: slidingWindow(1, '1d'), prefix: 'waitlist_email' }).limit(
      email.toLowerCase()
    ),
  ]);

  return !(byIp.success && byEmail.success);
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (
      typeof email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return Response.json({ error: 'Invalid email' }, { status: 400 });
    }

    if (await rateLimited(email)) {
      // Same shape as success: whether an address is already on the list is not
      // something an anonymous caller should be able to probe.
      return Response.json({ ok: true, accessUrl: null, emailed: false });
    }

    // Persist the signup (source of truth). Keep the insert minimal so it stays
    // compatible with the existing `waitlist_signups` schema (email, created_at).
    if (!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY)) {
      return Response.json(
        { error: 'Waitlist storage not configured' },
        { status: 501 }
      );
    }

    // `email` is unique, so a second request from the same person used to hit
    // 23505 and surface as "Something went wrong. Please try again." Signing up
    // twice is the most natural thing to do when the first attempt looked like
    // it did nothing, so treat it as the no-op it is: keep the original row
    // (and its created_at) and carry on to the send.
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/waitlist_signups?on_conflict=email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          Prefer: 'return=representation,resolution=ignore-duplicates',
        },
        body: JSON.stringify({ email, created_at: new Date().toISOString() }),
      }
    );

    if (!res.ok) {
      // The raw PostgREST body names tables, columns, and constraints. Operators
      // need that; anonymous callers do not.
      console.error('[waitlist] insert failed', await res.text());
      return Response.json({ error: 'Could not save signup' }, { status: 502 });
    }

    // When open testing is live, ANDROID_ACCESS_URL holds the public Play opt-in
    // link. The confirmation email then becomes fully self-serve (one tap, no
    // manual tester-add). Until then, the email says "invite on the way" and the
    // team gets a heads-up. Email is best-effort: a mail hiccup must NEVER fail
    // the request. The signup is already persisted above.
    const accessUrl = process.env.ANDROID_ACCESS_URL?.trim() || undefined;
    // The sender is a no-reply on a send-only domain, so mailing the heads-up to
    // RESEND_FROM drops it into a mailbox that cannot receive. The team notice
    // needs a real inbox, which is a separate address from the sender.
    const notifyTo =
      process.env.WAITLIST_NOTIFY_TO?.trim() || env.RESEND_FROM;
    let emailed = false;
    try {
      await resend.emails.send({
        from: env.RESEND_FROM,
        to: email,
        subject: accessUrl
          ? 'Your Anorha Android install link'
          : "You're on the Anorha list",
        react: createElement(AndroidAccessTemplate, { accessUrl }),
      });
      await resend.emails.send({
        from: env.RESEND_FROM,
        to: notifyTo,
        subject: `New Android access request: ${email}`,
        replyTo: email,
        text: accessUrl
          ? `New Android access request from ${email} (self-serve opt-in link is live).`
          : `New Android access request from ${email}. Add to Play testers if open testing is not live yet.`,
      });
      emailed = true;
    } catch (sendError) {
      // Still non-fatal: the signup is saved and resubmitting would not help.
      // But an empty catch is how an unverified RESEND_FROM domain (403 on every
      // send) stayed invisible for months while the form kept saying "check your
      // inbox". A mail failure is an operator problem, so log it loudly and tell
      // the caller whether anything actually went out.
      console.error(
        '[waitlist] android access email failed',
        `from=${env.RESEND_FROM}`,
        sendError instanceof Error ? sendError.message : sendError
      );
    }

    return Response.json({ ok: true, accessUrl: accessUrl ?? null, emailed });
  } catch (error) {
    console.error('[waitlist] request failed', error);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
