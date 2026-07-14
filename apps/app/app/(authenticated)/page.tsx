import { Button } from '@repo/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import {
  ArrowRightIcon,
  BoxesIcon,
  MessageCircleMoreIcon,
  PackagePlusIcon,
  PlugZapIcon,
  SparklesIcon,
  UsersIcon,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PageWrapper } from './components/page-wrapper';
import { TestFlightBanner } from './components/testflight-banner';

export const metadata: Metadata = {
  title: 'Today | Anorha',
  description: 'Pick up where you left off in Anorha.',
  icons: {
    icon: '/favicon.ico',
    apple: '/logo.png',
  },
  manifest: '/manifest.json',
};

const workspaceActions = [
  {
    title: 'Review inventory',
    description: 'See stock, channel mappings, and listings in one place.',
    href: '/inventory',
    icon: BoxesIcon,
  },
  {
    title: 'Connect a channel',
    description: 'Bring in Shopify, Square, Clover, eBay, or Amazon.',
    href: '/settings',
    icon: PlugZapIcon,
  },
  {
    title: 'Manage your team',
    description: 'Invite a seller or review partner access.',
    href: '/team',
    icon: UsersIcon,
  },
] as const;

const App = () => (
  <PageWrapper
    title="Today"
    description="A calm place to pick up the next thing that needs your attention."
  >
    <div className="flex flex-col gap-8">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.7fr)]">
        <Card className="overflow-hidden border-primary/25 bg-card py-0">
          <CardHeader className="gap-3 px-5 pt-6 pb-4 md:px-7 md:pt-7">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-accent-foreground">
              <PackagePlusIcon className="size-5" />
            </div>
            <CardTitle className="max-w-xl font-extrabold text-xl tracking-[-0.02em] md:text-2xl">
              Add the next item, without the form fatigue.
            </CardTitle>
            <CardDescription className="max-w-[62ch] font-medium text-[0.9375rem] leading-6">
              The Anorha mobile flow photographs the item, drafts the listing,
              and gives you the important details to confirm.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 px-5 pb-6 md:flex-row md:items-end md:justify-between md:px-7 md:pb-7">
            <div
              className="flex flex-wrap gap-2"
              aria-label="Add product steps"
            >
              {['Photograph', 'Review', 'Publish'].map((step, index) => (
                <span
                  key={step}
                  className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-2 font-bold text-muted-foreground text-xs"
                >
                  <span className="flex size-5 items-center justify-center rounded-full bg-card text-[0.6875rem] text-foreground">
                    {index + 1}
                  </span>
                  {step}
                </span>
              ))}
            </div>
            <Button asChild size="lg" className="h-12 px-5">
              <Link href="/inventory">
                Open inventory
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border bg-card py-0">
          <CardHeader className="px-5 pt-6 pb-4 md:px-6">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-muted text-foreground">
              <MessageCircleMoreIcon className="size-5" />
            </div>
            <CardTitle className="font-extrabold text-xl tracking-[-0.02em]">
              Plan with Sprout
            </CardTitle>
            <CardDescription className="font-medium leading-6">
              Turn slow stock into a clearout plan through the campaign chat on
              mobile.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 px-5 pb-6 md:px-6">
            <div className="flex flex-wrap gap-2">
              {[
                'Move older stock',
                'Plan a weekend sale',
                'Draft a clearout',
              ].map((prompt) => (
                <span
                  key={prompt}
                  className="rounded-full bg-muted px-3 py-2 font-semibold text-muted-foreground text-xs"
                >
                  {prompt}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1 font-semibold text-accent-foreground text-xs">
              <SparklesIcon className="size-4" />
              Available in the mobile app
            </div>
          </CardContent>
        </Card>
      </section>

      <section
        className="flex flex-col gap-3"
        aria-labelledby="workspace-heading"
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-bold text-[0.6875rem] text-muted-foreground uppercase tracking-[0.1em]">
              Workspace
            </p>
            <h2
              id="workspace-heading"
              className="mt-1 font-bold text-lg tracking-[-0.015em]"
            >
              Keep things moving
            </h2>
          </div>
        </div>
        <Card className="gap-0 overflow-hidden py-0">
          {workspaceActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex min-h-20 items-center gap-4 border-b px-4 py-4 outline-none transition-colors last:border-b-0 hover:bg-muted/60 focus-visible:bg-muted/60 md:px-5"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-primary/15 group-hover:text-accent-foreground">
                <action.icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-foreground text-sm">
                  {action.title}
                </span>
                <span className="mt-0.5 block font-medium text-muted-foreground text-sm">
                  {action.description}
                </span>
              </span>
              <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </Card>
      </section>

      <TestFlightBanner />
    </div>
  </PageWrapper>
);

export default App;
