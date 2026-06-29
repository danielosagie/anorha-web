import { env } from '@/env';
import { auth } from '@repo/auth/server';
import { Alert, AlertDescription, AlertTitle } from '@repo/design-system/components/ui/alert';
import { Badge } from '@repo/design-system/components/ui/badge';
import { buttonVariants } from '@repo/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import { ExternalLink, Info, ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Header } from '../components/header';

export const metadata: Metadata = {
  title: 'Admin · Anorha',
  description: 'Internal operations & observability — staff only.',
};

/** Deny-by-default allowlist of Clerk user ids (comma-separated env). Empty ⇒ nobody. */
const adminUserIds = (): string[] =>
  (env.ADMIN_USER_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

const AdminPage = async () => {
  const { userId } = await auth();

  // The /admin segment is the internal/ops plane — the one surface allowed to show real
  // vendor/model names (the customer app scrubs them). Gate it hard, and 404 rather than 403
  // so its very existence isn't disclosed to non-staff.
  if (!userId || !adminUserIds().includes(userId)) {
    notFound();
  }

  const dashboardUrl = env.LANGFUSE_DASHBOARD_URL;

  return (
    <div
      className="flex min-h-[100vh] flex-1 flex-col p-2"
      style={{ backgroundColor: '#FEF4DD' }}
    >
      <Header page="Admin">
        <Badge variant="secondary" className="gap-1">
          <ShieldCheck className="h-3 w-3" />
          Internal
        </Badge>
      </Header>

      <div className="flex w-full max-w-4xl flex-col gap-4 p-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">Operations</h1>
          <p className="text-muted-foreground text-sm">
            Staff-only plane. Unlike the customer app, vendor and model names are shown here
            in full — this is the durable home for observability and internal tooling.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>LLM observability</CardTitle>
            <CardDescription>
              Langfuse traces — one per agent turn, with tool-call spans and model generations
              nested underneath.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {dashboardUrl ? (
              <>
                <div>
                  <a
                    href={dashboardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants()}
                  >
                    Open Langfuse dashboard
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </div>
                <div className="overflow-hidden rounded-lg border bg-background">
                  <iframe
                    src={dashboardUrl}
                    title="Langfuse dashboard"
                    className="h-[60vh] w-full"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <p className="text-muted-foreground text-xs">
                  If the embed is blank, Langfuse is blocking framing (its CSP) — use “Open
                  Langfuse dashboard” above instead.
                </p>
              </>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Dashboard not configured</AlertTitle>
                <AlertDescription>
                  Set <code>LANGFUSE_DASHBOARD_URL</code> (your Langfuse project URL) to embed
                  or link the dashboard here.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPage;
