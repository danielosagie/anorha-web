import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@repo/design-system/components/ui/button';

export const metadata: Metadata = {
  title: 'Account & data deletion',
  description:
    'How to delete your Anorha account and request deletion of associated data.',
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
            This page describes how to delete your account and request deletion of associated
            data for <span className="font-semibold text-foreground">Anorha</span>.
          </p>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              How to request account and data deletion
            </h2>
            <p className="text-muted-foreground text-sm font-medium mb-2">In the app:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground mb-4">
              <li>
                Open <span className="font-semibold text-foreground">Anorha</span> → Profile →
                Privacy & Security or Delete Account
              </li>
              <li>Follow the confirmation steps shown in the app</li>
              <li>Sign out after the app confirms the request</li>
            </ul>
            <p className="text-muted-foreground text-sm leading-relaxed">
              You can also contact support with the subject &quot;Delete my account&quot; and the
              email address of your account.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">What we delete</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We delete or de-identify account profile data, organization memberships, notification
              settings, device tokens, platform connections, products, listings, images, drafts,
              sync records, support attachments, and automation/device records tied only to your
              account or organization.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">
              What we may keep (and for how long)
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We may retain invoices, tax records, fraud and security logs, chargeback records, and
              backups awaiting normal expiration where required or permitted by law. Retained records
              are not used to restore a deleted account except where required for legal or security
              reasons.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Timing</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              In-app deletion begins when you confirm the request. Support-assisted deletion begins
              after we verify account ownership.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Public deletion page</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              The public account deletion instructions are also available at{' '}
              <Link className="font-medium text-[#647653] underline underline-offset-4" href="/legal/account-deletion">
                anorha.app/delete-account
              </Link>.
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
