'use client';

import { env } from '@/env';
import { IOS_DOWNLOAD_URL } from '@/lib/mobile-downloads';
import {
  CreateOrganization,
  useAuth,
  useOrganizationList,
  useUser,
} from '@clerk/nextjs';
import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent } from '@repo/design-system/components/ui/card';
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import { Spinner } from '@repo/design-system/components/ui/spinner';
import { Inter_Tight } from 'next/font/google';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, useCallback, useEffect, useState } from 'react';
import styles from './onboarding-client.module.css';

type OnboardingStep = 'checking' | 'create_org' | 'success';
type InstallPlatform = 'android' | 'ios';
type AndroidRequestStatus = 'error' | 'idle' | 'loading' | 'saved' | 'sent';

type AndroidAccessResponse = {
  request?: {
    inviteSentAt?: string | null;
    playEmail?: string;
  } | null;
};

const ANDROID_ACCESS_API_URL = new URL(
  '/api/android-access',
  env.NEXT_PUBLIC_WEB_URL
).toString();
const ANDROID_USER_AGENT_PATTERN = /Android/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IOS_USER_AGENT_PATTERN = /iPhone|iPad|iPod/i;
const interTight = Inter_Tight({ subsets: ['latin'], weight: ['600'] });

function Brand() {
  return (
    <div className={`${styles.brand} ${interTight.className}`}>
      <span className={styles.brandMark} aria-hidden="true">
        <svg height="14" viewBox="0 0 14 14" width="14">
          <title>Anorha mark</title>
          <path
            d="M3 7.5L6 10.5L11 3.5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      </span>
      <span>Anorha</span>
    </div>
  );
}

function AppleIcon() {
  return (
    <svg
      aria-hidden="true"
      data-icon="inline-start"
      viewBox="786.788 483.498 13.026 14.001"
    >
      <path
        d="M794.791 485.722C795.211 485.204 795.511 484.486 795.512 483.767C795.512 483.668 795.504 483.568 795.485 483.484C794.8 483.511 793.984 483.957 793.493 484.55C793.107 485.003 792.747 485.723 792.746 486.45C792.746 486.561 792.763 486.669 792.772 486.702C792.816 486.712 792.886 486.719 792.958 486.721C793.572 486.721 794.345 486.296 794.791 485.722ZM797.96 488.269C797.883 488.335 796.494 489.141 796.494 490.942C796.494 493.024 798.259 493.759 798.311 493.777C798.303 493.823 798.031 494.786 797.382 495.766C796.803 496.631 796.196 497.491 795.277 497.495C794.358 497.499 794.12 496.941 793.055 496.938C792.019 496.938 791.652 497.511 790.81 497.512C789.968 497.513 789.381 496.713 788.701 495.731C787.921 494.575 787.289 492.784 787.289 491.085C787.289 488.358 788.999 486.912 790.683 486.912C791.578 486.912 792.325 487.522 792.888 487.52C793.422 487.52 794.257 486.875 795.274 486.875C795.66 486.875 797.046 486.913 797.96 488.269Z"
        fill="currentColor"
      />
    </svg>
  );
}

function AndroidIcon() {
  return (
    <svg
      aria-hidden="true"
      data-icon="inline-start"
      viewBox="84.502 24.898 14 8.592"
    >
      <path
        d="M95.748 25.011C95.543 25.033 95.36 25.155 95.257 25.341L94.075 27.462C93.279 27.137 92.416 26.959 91.504 26.959C90.597 26.959 89.734 27.135 88.946 27.457L87.767 25.341C87.642 25.116 87.404 24.987 87.155 25.01C86.679 25.054 86.418 25.584 86.653 26.013L87.793 28.058C86.039 29.191 84.789 31.14 84.502 33.49H98.504C98.218 31.137 96.973 29.197 95.227 28.066L96.371 26.012C96.609 25.583 96.338 25.054 95.869 25.01C95.829 25.006 95.788 25.007 95.748 25.011Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ReadyIcon() {
  return (
    <span className={styles.readyIcon} aria-hidden="true">
      <svg height="20" viewBox="0 0 20 20" width="20">
        <title>Workspace ready</title>
        <path
          d="M4 10.5L8 14.5L16 5.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.2"
        />
      </svg>
    </span>
  );
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: This small state machine keeps Clerk loading, organization creation, and the download handoff in one route component.
export default function OnboardingClient() {
  const { getToken } = useAuth();
  const { isLoaded: userLoaded, isSignedIn, user } = useUser();
  const { userMemberships, isLoaded: orgListLoaded } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });
  const router = useRouter();
  const searchParams = useSearchParams();

  const membershipsData = userMemberships?.data;
  const hasOrgs = membershipsData && membershipsData.length > 0;
  const created = searchParams.get('created') === 'true';

  const [step, setStep] = useState<OnboardingStep>('checking');
  const [platform, setPlatform] = useState<InstallPlatform | null>(null);
  const [playEmail, setPlayEmail] = useState('');
  const [emailInitialized, setEmailInitialized] = useState(false);
  const [androidStatus, setAndroidStatus] =
    useState<AndroidRequestStatus>('idle');
  const [androidError, setAndroidError] = useState('');

  useEffect(() => {
    if (!userLoaded || !orgListLoaded) {
      return;
    }

    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }

    if (created) {
      if (step !== 'success') {
        setStep('success');
      }
      return;
    }

    if (hasOrgs) {
      router.replace('/');
      return;
    }

    if (step === 'checking' && !hasOrgs) {
      setStep('create_org');
    }
  }, [userLoaded, orgListLoaded, isSignedIn, hasOrgs, router, step, created]);

  useEffect(() => {
    if (!emailInitialized && userLoaded) {
      setPlayEmail(user?.primaryEmailAddress?.emailAddress ?? '');
      setEmailInitialized(true);
    }
  }, [emailInitialized, user, userLoaded]);

  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    const isIpad =
      window.navigator.platform === 'MacIntel' &&
      window.navigator.maxTouchPoints > 1;

    if (ANDROID_USER_AGENT_PATTERN.test(userAgent)) {
      setPlatform('android');
      return;
    }

    if (IOS_USER_AGENT_PATTERN.test(userAgent) || isIpad) {
      setPlatform('ios');
    }
  }, []);

  const readSavedRequest = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      return null;
    }

    const response = await fetch(ANDROID_ACCESS_API_URL, {
      headers: { Authorization: `Bearer ${token}` },
      method: 'GET',
    });
    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as AndroidAccessResponse;
    return data.request ?? null;
  }, [getToken]);

  useEffect(() => {
    if (step !== 'success' || !userLoaded || !isSignedIn) {
      return;
    }

    let cancelled = false;
    readSavedRequest()
      .then((savedRequest) => {
        if (cancelled || !savedRequest) {
          return;
        }

        setPlatform('android');
        if (savedRequest.playEmail) {
          setPlayEmail(savedRequest.playEmail);
        }
        setAndroidStatus(savedRequest.inviteSentAt ? 'sent' : 'saved');
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, readSavedRequest, step, userLoaded]);

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Persistence reconciliation is intentionally kept beside the submit state it protects.
  const submitAndroidRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = playEmail.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalizedEmail) || androidStatus === 'loading') {
      return;
    }

    setAndroidError('');
    setAndroidStatus('loading');

    try {
      const token = await getToken();
      if (!token) {
        setAndroidStatus('error');
        setAndroidError('Sign in again to request access.');
        return;
      }

      const response = await fetch(ANDROID_ACCESS_API_URL, {
        body: JSON.stringify({ email: normalizedEmail }),
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });
      const data = (await response.json().catch(() => ({}))) as
        | (AndroidAccessResponse & { error?: string; saved?: boolean })
        | undefined;

      if (response.ok && data?.saved) {
        setPlayEmail(data.request?.playEmail ?? normalizedEmail);
        setAndroidStatus(data.request?.inviteSentAt ? 'sent' : 'saved');
        return;
      }

      setAndroidStatus('error');
      setAndroidError(
        data?.error === 'play_email_already_requested'
          ? 'That Google Play email already has a request.'
          : 'Could not save your request. Try again.'
      );
    } catch {
      const savedRequest = await readSavedRequest().catch(() => null);
      if (savedRequest) {
        setPlayEmail(savedRequest.playEmail ?? normalizedEmail);
        setAndroidStatus(savedRequest.inviteSentAt ? 'sent' : 'saved');
        return;
      }

      setAndroidStatus('error');
      setAndroidError('Could not confirm your request. Try again.');
    }
  };

  if (step === 'checking' || !userLoaded || !orgListLoaded) {
    return (
      <div className="fade-in flex min-h-[400px] animate-in flex-col items-center justify-center space-y-4 duration-500">
        <Spinner className="size-10 text-primary" />
        <p className="font-medium text-muted-foreground">
          Preparing your workspace...
        </p>
      </div>
    );
  }

  if (step === 'create_org') {
    return (
      <div className="slide-in-from-bottom-8 fade-in flex animate-in flex-col space-y-8 py-8 duration-700">
        <div className="flex flex-col space-y-3 text-center">
          <h1 className="font-bold text-3xl text-foreground tracking-tight">
            Welcome to Anorha
          </h1>
          <p className="mx-auto max-w-sm text-base text-muted-foreground">
            Create a space for your team.
          </p>
        </div>

        <Card className="mx-auto w-full max-w-md border-0 bg-transparent shadow-none">
          <CardContent className="flex justify-center p-0">
            <CreateOrganization
              afterCreateOrganizationUrl="/onboarding?created=true"
              appearance={{
                elements: {
                  rootBox: 'w-full shadow-lg rounded-2xl overflow-hidden',
                  card: 'shadow-none border-0 w-full',
                  headerTitle: 'hidden',
                  headerSubtitle: 'hidden',
                  formButtonPrimary:
                    'bg-primary hover:bg-primary/90 text-primary-foreground text-sm',
                },
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className={styles.readyShell}>
        <aside className={styles.readyRail}>
          <Brand />
          <span className={styles.stepLabel}>03 / READY</span>
        </aside>

        <main className={styles.readyMain}>
          <div className={styles.mobileHeader}>
            <Brand />
            <span className={styles.stepLabel}>03 / READY</span>
          </div>

          <div className={styles.readyContent}>
            <ReadyIcon />
            <h1>Workspace ready</h1>

            <div className={styles.platforms} aria-label="Choose your phone">
              <Button
                aria-pressed={platform === 'ios'}
                className={styles.platformButton}
                data-selected={platform === 'ios'}
                onClick={() => {
                  setPlatform('ios');
                  window.open(
                    IOS_DOWNLOAD_URL,
                    '_blank',
                    'noopener,noreferrer'
                  );
                }}
                type="button"
                variant="outline"
              >
                <AppleIcon />
                iPhone
              </Button>
              <Button
                aria-pressed={platform === 'android'}
                className={styles.platformButton}
                data-selected={platform === 'android'}
                onClick={() => setPlatform('android')}
                type="button"
                variant="outline"
              >
                <AndroidIcon />
                Android
              </Button>
            </div>

            {platform === 'android' ? (
              <div className={styles.androidPanel}>
                {androidStatus === 'saved' || androidStatus === 'sent' ? (
                  <output className={styles.savedState}>
                    <span className={styles.savedCheck} aria-hidden="true">
                      <svg height="14" viewBox="0 0 14 14" width="14">
                        <title>Saved</title>
                        <path
                          d="M3 7.5L6 10.5L11 3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                      </svg>
                    </span>
                    <div>
                      <strong>
                        {androidStatus === 'sent'
                          ? 'Install link sent'
                          : "You're on the list"}
                      </strong>
                      <p>
                        {androidStatus === 'sent'
                          ? 'Check your Google Play email.'
                          : "We'll email your install link shortly."}
                      </p>
                    </div>
                  </output>
                ) : (
                  <form
                    className={styles.androidForm}
                    onSubmit={submitAndroidRequest}
                  >
                    <div className={styles.field}>
                      <Label htmlFor="google-play-email">
                        Google Play email
                      </Label>
                      <Input
                        aria-invalid={androidStatus === 'error'}
                        autoComplete="email"
                        id="google-play-email"
                        inputMode="email"
                        onChange={(event) => {
                          setPlayEmail(event.target.value);
                          if (androidStatus === 'error') {
                            setAndroidError('');
                            setAndroidStatus('idle');
                          }
                        }}
                        required
                        type="email"
                        value={playEmail}
                      />
                    </div>
                    <Button
                      className={styles.requestButton}
                      disabled={
                        !EMAIL_PATTERN.test(playEmail.trim()) ||
                        androidStatus === 'loading'
                      }
                      type="submit"
                    >
                      {androidStatus === 'loading' ? (
                        <>
                          <span
                            className={styles.spinnerSlot}
                            data-icon="inline-start"
                          >
                            <Spinner />
                          </span>
                          Saving
                        </>
                      ) : (
                        'Request access'
                      )}
                    </Button>
                    {androidStatus === 'error' ? (
                      <p className={styles.error} role="alert">
                        {androidError}
                      </p>
                    ) : null}
                  </form>
                )}
              </div>
            ) : null}

            <Button asChild className={styles.continueButton} variant="outline">
              <Link href="/">Continue on web</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return null;
}
