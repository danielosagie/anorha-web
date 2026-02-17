import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@repo/design-system/components/ui/button';

export const metadata: Metadata = {
  title: 'Account & data deletion',
  description:
    'How to request deletion of your Anorha account and data. In-app steps and support contact.',
};

export default function DeleteAccountPage() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="border-b border-border pb-4">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Account & data deletion
          </h1>
        </header>

        <div className="mt-6 space-y-8">
          <p className="text-muted-foreground text-sm leading-relaxed">
            This page describes how to request deletion of your account and data for{' '}
            <span className="font-semibold text-foreground">Anorha</span>.
          </p>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              How to request account and data deletion
            </h2>
            <p className="text-muted-foreground text-sm font-medium mb-2">In the app:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground mb-4">
              <li>
                Open <span className="font-semibold text-foreground">Anorha</span> → Profile → Delete
                Account
              </li>
              <li>Follow the steps (confirm your business name and reason)</li>
              <li>Your account and associated data will be deleted</li>
            </ul>
            <p className="text-muted-foreground text-sm leading-relaxed">
              You can also contact support with the subject &quot;Delete my account&quot; and the
              email address of your account.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">What we delete</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Account and profile, organization memberships, platform connections, products and
              listings data, usage and activity data tied to your account, and other user data we hold
              for your account.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              What we may keep (and for how long)
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Data we are required to keep by law (e.g. tax or invoice records) for the period
              required by law. Backups or logs may retain your data for a short period (e.g. up to
              90 days) before being purged.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Timing</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Deletion is processed when you confirm in the app (or when we process your support
              request).
            </p>
          </section>

          <div className="pt-4">
            <Link href="/">
              <Button variant="outline" className="text-[#647653] border-[#647653] hover:bg-[#647653]/10">
                Back to Anorha
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
