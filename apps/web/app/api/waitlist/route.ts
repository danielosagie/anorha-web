import { env } from '@/env';
import { resend } from '@repo/email';
import { AndroidAccessTemplate } from '@repo/email/templates/android-access';
import { createElement } from 'react';

export const runtime = 'nodejs';

export async function GET() {
  return Response.json({ ok: true });
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

    // Persist the signup (source of truth). Keep the insert minimal so it stays
    // compatible with the existing `waitlist_signups` schema (email, created_at).
    if (!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY)) {
      return Response.json(
        { error: 'Waitlist storage not configured' },
        { status: 501 }
      );
    }

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/waitlist_signups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ email, created_at: new Date().toISOString() }),
    });

    if (!res.ok) {
      const msg = await res.text();
      return Response.json(
        { error: `Supabase insert failed: ${msg}` },
        { status: 502 }
      );
    }

    // When open testing is live, ANDROID_ACCESS_URL holds the public Play opt-in
    // link. The confirmation email then becomes fully self-serve (one tap, no
    // manual tester-add). Until then, the email says "invite on the way" and the
    // team gets a heads-up. Email is best-effort: a mail hiccup must NEVER fail
    // the request. The signup is already persisted above.
    const accessUrl = process.env.ANDROID_ACCESS_URL?.trim() || undefined;
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
        to: env.RESEND_FROM,
        subject: `New Android access request: ${email}`,
        replyTo: email,
        text: accessUrl
          ? `New Android access request from ${email} (self-serve opt-in link is live).`
          : `New Android access request from ${email}. Add to Play testers if open testing is not live yet.`,
      });
    } catch {
      // Non-critical: the signup is saved; surfacing an email failure would only
      // scare the user into resubmitting. Swallow and continue.
    }

    return Response.json({ ok: true, accessUrl: accessUrl ?? null });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
