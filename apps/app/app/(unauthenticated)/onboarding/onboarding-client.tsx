'use client';

import {
  CreateOrganization,
  useOrganizationList,
  useUser,
} from '@clerk/nextjs';
import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent } from '@repo/design-system/components/ui/card';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type OnboardingStep = 'checking' | 'create_org' | 'success';

export default function OnboardingClient() {
  const { isLoaded: userLoaded, isSignedIn } = useUser();
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

  if (step === 'checking' || !userLoaded || !orgListLoaded) {
    return (
      <div className="fade-in flex min-h-[400px] animate-in flex-col items-center justify-center space-y-4 duration-500">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
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
      <div className="zoom-in-95 slide-in-from-bottom-4 fade-in mx-auto flex max-w-md animate-in flex-col space-y-8 py-10 text-center duration-700">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-12 w-12 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-2xl text-foreground">
              Workspace ready.
            </h1>
            <p className="mt-2 text-muted-foreground">
              Choose a plan now, or explore your dashboard and upgrade whenever
              you're ready.
            </p>
          </div>
        </div>

        <div className="w-full space-y-3">
          <Link href="/billing?upgrade=true" className="block w-full">
            <Button className="h-12 w-full rounded-xl font-semibold text-md">
              Choose a plan
              <ArrowRight className="ml-2 size-4" aria-hidden />
            </Button>
          </Link>
          <Link href="/" className="block w-full">
            <Button variant="outline" className="h-12 w-full rounded-xl">
              Continue with free access
            </Button>
          </Link>
          <p className="text-center text-muted-foreground text-xs">
            Secure checkout. You can manage or cancel from Billing &amp; usage.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
