'use client';

import { env } from '@/env';
import { IOS_DOWNLOAD_URL } from '@/lib/mobile-downloads';
import {
  CreateOrganization,
  useAuth,
  useOrganizationList,
  useUser,
} from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { type FormEvent, useCallback, useEffect, useState } from 'react';
import {
  type AndroidRequestStatus,
  CREATE_ORGANIZATION_APPEARANCE,
  CreateWorkspaceScreen,
  type InstallPlatform,
  LoadingScreen,
  WorkspaceReadyScreen,
} from './onboarding-screens';

type OnboardingStep = 'checking' | 'create_org' | 'success';

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
    return <LoadingScreen />;
  }

  if (step === 'create_org') {
    return (
      <CreateWorkspaceScreen>
        <CreateOrganization
          afterCreateOrganizationUrl="/onboarding?created=true"
          appearance={CREATE_ORGANIZATION_APPEARANCE}
        />
      </CreateWorkspaceScreen>
    );
  }

  if (step === 'success') {
    return (
      <WorkspaceReadyScreen
        androidError={androidError}
        androidStatus={androidStatus}
        emailIsValid={EMAIL_PATTERN.test(playEmail.trim())}
        onAndroidSubmit={submitAndroidRequest}
        onEmailChange={(value) => {
          setPlayEmail(value);
          if (androidStatus === 'error') {
            setAndroidError('');
            setAndroidStatus('idle');
          }
        }}
        onSelectAndroid={() => setPlatform('android')}
        onSelectIos={() => {
          setPlatform('ios');
          window.open(IOS_DOWNLOAD_URL, '_blank', 'noopener,noreferrer');
        }}
        platform={platform}
        playEmail={playEmail}
      />
    );
  }

  return null;
}
