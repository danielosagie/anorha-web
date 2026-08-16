'use client';

import logo from '@/app/assets/anorha_logo.png';
import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import { Spinner } from '@repo/design-system/components/ui/spinner';
import type { LucideIcon } from 'lucide-react';
import {
  AppleIcon,
  ArrowRightIcon,
  CheckIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  SmartphoneIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { FormEvent, ReactNode } from 'react';

export type AndroidRequestStatus =
  | 'error'
  | 'idle'
  | 'loading'
  | 'saved'
  | 'sent';
export type InstallPlatform = 'android' | 'ios';

// Clerk paints its own card, inputs and buttons. These classes hand those slots
// back to the app's tokens so the first screen is the same surface as /.
export const CREATE_ORGANIZATION_APPEARANCE = {
  elements: {
    card: 'w-full gap-4 border-0 bg-transparent p-0 shadow-none',
    cardBox: 'w-full border-0 bg-transparent shadow-none',
    footer: 'hidden',
    footerAction: 'hidden',
    formButtonPrimary:
      'h-11 w-full rounded-full bg-primary px-4 text-sm font-semibold normal-case tracking-normal text-primary-foreground shadow-none hover:bg-primary/90 sm:h-9 sm:w-auto',
    formFieldInput:
      'h-11 rounded-[0.875rem] border-input bg-transparent px-3 text-sm shadow-none',
    formFieldLabel: 'text-foreground text-sm font-medium',
    header: 'hidden',
    headerSubtitle: 'hidden',
    headerTitle: 'hidden',
    rootBox: 'w-full',
  },
} as const;

export function OnboardingFrame({
  children,
  step,
}: {
  readonly children: ReactNode;
  readonly step?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-center overflow-y-auto bg-background p-2 sm:items-center sm:p-6">
      <div className="flex w-full flex-1 flex-col overflow-hidden rounded-[1.125rem] border border-border bg-card sm:max-w-[26rem] sm:flex-none">
        <header className="flex h-13 shrink-0 items-center justify-between gap-3 border-b px-4 md:h-14 md:px-5">
          <span className="flex min-w-0 items-center gap-2">
            <Image
              alt=""
              aria-hidden
              className="size-5"
              height={20}
              src={logo}
              width={20}
            />
            <span className="truncate font-semibold text-sm">Anorha</span>
          </span>
          {step ? (
            <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
              {step}
            </span>
          ) : null}
        </header>
        <main className="flex flex-1 flex-col gap-5 px-4 py-6 md:px-5">
          {children}
        </main>
      </div>
    </div>
  );
}

function ScreenTitle({ children }: { readonly children: ReactNode }) {
  return <h1 className="font-bold text-2xl tracking-[-0.025em]">{children}</h1>;
}

function SectionLabel({ children }: { readonly children: ReactNode }) {
  return (
    <p className="font-bold text-muted-foreground text-xs uppercase tracking-[0.1em]">
      {children}
    </p>
  );
}

export function LoadingScreen() {
  return (
    <OnboardingFrame>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10">
        <Spinner className="size-5 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">Loading</p>
      </div>
    </OnboardingFrame>
  );
}

export function CreateWorkspaceScreen({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <OnboardingFrame step="1 of 2">
      <ScreenTitle>Create workspace</ScreenTitle>
      {children}
    </OnboardingFrame>
  );
}

function PlatformRow({
  detail,
  icon: Icon,
  onSelect,
  selected,
  title,
  trailing,
}: {
  readonly detail: string;
  readonly icon: LucideIcon;
  readonly onSelect: () => void;
  readonly selected: boolean;
  readonly title: string;
  readonly trailing: ReactNode;
}) {
  return (
    <button
      aria-pressed={selected}
      className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-muted/45 focus-visible:bg-muted/45 aria-pressed:bg-muted/45 md:px-5"
      onClick={onSelect}
      type="button"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon aria-hidden className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-sm">{title}</span>
        <span className="block truncate text-muted-foreground text-xs">
          {detail}
        </span>
      </span>
      {trailing}
    </button>
  );
}

function AndroidResult({
  playEmail,
  sent,
}: {
  readonly playEmail: string;
  readonly sent: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span
        className={
          sent
            ? 'mt-1.5 size-1.5 shrink-0 rounded-full bg-success'
            : 'mt-1.5 size-1.5 shrink-0 rounded-full bg-warning'
        }
      />
      <div className="min-w-0">
        <p className="font-semibold text-sm">
          {sent ? 'Invite sent' : 'Requested'}
        </p>
        <p className="mt-0.5 truncate text-muted-foreground text-xs">
          {sent ? playEmail : 'Install link comes by email.'}
        </p>
      </div>
    </div>
  );
}

function AndroidForm({
  androidError,
  emailIsValid,
  onEmailChange,
  onSubmit,
  playEmail,
  status,
}: {
  readonly androidError: string;
  readonly emailIsValid: boolean;
  readonly onEmailChange: (value: string) => void;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readonly playEmail: string;
  readonly status: AndroidRequestStatus;
}) {
  return (
    <form className="flex flex-col gap-2" onSubmit={onSubmit}>
      <Label
        className="text-muted-foreground text-xs"
        htmlFor="google-play-email"
      >
        Google Play email
      </Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          aria-invalid={status === 'error'}
          autoComplete="email"
          className="h-11 min-w-0 flex-1 rounded-[0.875rem] bg-card"
          id="google-play-email"
          inputMode="email"
          onChange={(event) => onEmailChange(event.target.value)}
          required
          type="email"
          value={playEmail}
        />
        <Button
          className="h-11 shrink-0"
          disabled={!emailIsValid}
          isLoading={status === 'loading'}
          type="submit"
        >
          Request access
        </Button>
      </div>
      {status === 'error' ? (
        <p className="text-destructive text-xs" role="alert">
          {androidError}
        </p>
      ) : null}
    </form>
  );
}

export function WorkspaceReadyScreen({
  androidError,
  androidStatus,
  emailIsValid,
  onAndroidSubmit,
  onEmailChange,
  onSelectAndroid,
  onSelectIos,
  platform,
  playEmail,
}: {
  readonly androidError: string;
  readonly androidStatus: AndroidRequestStatus;
  readonly emailIsValid: boolean;
  readonly onAndroidSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readonly onEmailChange: (value: string) => void;
  readonly onSelectAndroid: () => void;
  readonly onSelectIos: () => void;
  readonly platform: InstallPlatform | null;
  readonly playEmail: string;
}) {
  const androidSelected = platform === 'android';
  const androidSettled = androidStatus === 'saved' || androidStatus === 'sent';

  return (
    <OnboardingFrame step="2 of 2">
      <ScreenTitle>Workspace ready</ScreenTitle>

      <section className="flex flex-col gap-2.5">
        <SectionLabel>Get the app</SectionLabel>
        <div className="divide-y overflow-hidden rounded-[0.875rem] border bg-background">
          <PlatformRow
            detail="TestFlight"
            icon={AppleIcon}
            onSelect={onSelectIos}
            selected={platform === 'ios'}
            title="iPhone"
            trailing={
              <ExternalLinkIcon
                aria-hidden
                className="size-3.5 shrink-0 text-muted-foreground"
              />
            }
          />
          <PlatformRow
            detail="Google Play"
            icon={SmartphoneIcon}
            onSelect={onSelectAndroid}
            selected={androidSelected}
            title="Android"
            trailing={
              androidSelected ? (
                <CheckIcon
                  aria-hidden
                  className="size-4 shrink-0 text-primary"
                />
              ) : (
                <ChevronRightIcon
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground"
                />
              )
            }
          />
          {androidSelected ? (
            <div className="px-4 py-4 md:px-5">
              {androidSettled ? (
                <AndroidResult
                  playEmail={playEmail}
                  sent={androidStatus === 'sent'}
                />
              ) : (
                <AndroidForm
                  androidError={androidError}
                  emailIsValid={emailIsValid}
                  onEmailChange={onEmailChange}
                  onSubmit={onAndroidSubmit}
                  playEmail={playEmail}
                  status={androidStatus}
                />
              )}
            </div>
          ) : null}
        </div>
      </section>

      <div className="mt-auto flex pt-1">
        <Button
          asChild
          className="h-11 w-full sm:h-9 sm:w-auto"
          variant="outline"
        >
          <Link href="/">
            Continue on web
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        </Button>
      </div>
    </OnboardingFrame>
  );
}
