'use client';

import { useSupabase } from '@/lib/supabase';
import { SignedIn } from '@clerk/nextjs';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@repo/design-system/components/ui/alert';
import {
  Avatar,
  AvatarFallback,
} from '@repo/design-system/components/ui/avatar';
import { Button } from '@repo/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import { Skeleton } from '@repo/design-system/components/ui/skeleton';
import {
  ArrowRightIcon,
  BadgeDollarSignIcon,
  Building2Icon,
  Globe2Icon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  RefreshCwIcon,
  Settings2Icon,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { PageWrapper } from '../components/page-wrapper';

interface UserData {
  Id: string;
  Email: string;
  FirstName?: string;
  LastName?: string;
  PhoneNumber?: string;
  Region?: string;
  Currency?: string;
  active_org_id?: string;
}

type ProfileRowProps = {
  icon: typeof PhoneIcon;
  label: string;
  value: string;
};

const ProfileRow = ({ icon: Icon, label, value }: ProfileRowProps) => (
  <div className="flex min-h-16 items-center gap-3 border-b px-4 py-3 last:border-b-0 md:px-5">
    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
      <Icon className="size-[1.125rem]" />
    </span>
    <div className="min-w-0 flex-1">
      <div className="font-bold text-muted-foreground text-xs uppercase tracking-[0.06em]">
        {label}
      </div>
      <div className="mt-0.5 truncate font-semibold text-foreground text-sm">
        {value}
      </div>
    </div>
  </div>
);

export default function ProfilePage() {
  return (
    <SignedIn>
      <UserProfile />
    </SignedIn>
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex max-w-4xl flex-col gap-6" aria-label="Loading profile">
      <Card>
        <CardContent className="flex items-center gap-4 px-5 py-5">
          <Skeleton className="size-16 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </div>
        </CardContent>
      </Card>
      <Skeleton className="h-56 rounded-[1.125rem]" />
    </div>
  );
}

function UserProfile() {
  const supabase = useSupabase();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('Users')
        .select('*')
        .single();

      if (fetchError) {
        throw fetchError;
      }
      setUserData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  if (loading) {
    return (
      <PageWrapper
        title="Profile"
        description="Your seller identity and everyday preferences."
      >
        <ProfileSkeleton />
      </PageWrapper>
    );
  }

  if (error || !userData) {
    return (
      <PageWrapper
        title="Profile"
        description="Your seller identity and everyday preferences."
      >
        <Alert variant="destructive" className="max-w-2xl rounded-2xl">
          <RefreshCwIcon />
          <AlertTitle>We couldn&apos;t load your profile</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            <span>{error || 'No profile was found for this account.'}</span>
            <Button variant="outline" size="sm" onClick={fetchUserProfile}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      </PageWrapper>
    );
  }

  const fullName =
    [userData.FirstName, userData.LastName].filter(Boolean).join(' ') ||
    'Anorha seller';
  const initials =
    [userData.FirstName?.[0], userData.LastName?.[0]]
      .filter(Boolean)
      .join('') || 'A';

  return (
    <PageWrapper
      title="Profile"
      description="Your seller identity and everyday preferences."
    >
      <div className="flex max-w-4xl flex-col gap-7">
        <Card className="py-0">
          <CardContent className="flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center md:px-6 md:py-6">
            <Avatar className="size-16 border-2 border-card ring-2 ring-primary/25">
              <AvatarFallback className="bg-primary/15 font-extrabold text-accent-foreground text-lg">
                {initials.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate font-extrabold text-xl tracking-[-0.02em]">
                  {fullName}
                </h2>
                <span
                  className="size-2 shrink-0 rounded-full bg-success"
                  aria-label="Account active"
                />
              </div>
              <p className="mt-1 truncate font-medium text-muted-foreground text-sm">
                {userData.Email}
              </p>
              <p className="mt-2 font-semibold text-accent-foreground text-xs">
                Seller account
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="h-11 self-stretch px-4 sm:self-auto"
            >
              <Link href="/settings">
                <Settings2Icon data-icon="inline-start" />
                Edit preferences
              </Link>
            </Button>
          </CardContent>
        </Card>

        <section
          className="flex flex-col gap-3"
          aria-labelledby="account-details-heading"
        >
          <div>
            <p className="font-bold text-[0.6875rem] text-muted-foreground uppercase tracking-[0.1em]">
              Account
            </p>
            <h2
              id="account-details-heading"
              className="mt-1 font-bold text-lg tracking-[-0.015em]"
            >
              Contact details
            </h2>
          </div>
          <Card className="gap-0 overflow-hidden py-0">
            <ProfileRow icon={MailIcon} label="Email" value={userData.Email} />
            <ProfileRow
              icon={PhoneIcon}
              label="Phone"
              value={userData.PhoneNumber || 'Not added yet'}
            />
          </Card>
        </section>

        <section
          className="flex flex-col gap-3"
          aria-labelledby="seller-preferences-heading"
        >
          <div>
            <p className="font-bold text-[0.6875rem] text-muted-foreground uppercase tracking-[0.1em]">
              Selling
            </p>
            <h2
              id="seller-preferences-heading"
              className="mt-1 font-bold text-lg tracking-[-0.015em]"
            >
              Defaults
            </h2>
          </div>
          <Card className="gap-0 overflow-hidden py-0">
            <ProfileRow
              icon={MapPinIcon}
              label="Region"
              value={userData.Region || 'Not set'}
            />
            <ProfileRow
              icon={BadgeDollarSignIcon}
              label="Currency"
              value={userData.Currency || 'Not set'}
            />
            <ProfileRow
              icon={Building2Icon}
              label="Workspace"
              value={
                userData.active_org_id
                  ? 'Connected organization'
                  : 'No organization selected'
              }
            />
          </Card>
        </section>

        <Card className="border-primary/20 bg-primary/10 py-0">
          <CardHeader className="grid-cols-[auto_1fr] items-center gap-x-4 px-5 py-5">
            <span className="row-span-2 flex size-10 items-center justify-center rounded-xl bg-card text-accent-foreground">
              <Globe2Icon className="size-5" />
            </span>
            <CardTitle className="font-bold text-sm">
              Keep your selling defaults current
            </CardTitle>
            <CardDescription className="leading-5">
              Region and currency help Anorha draft better prices and
              channel-ready listings.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <Button
              asChild
              variant="link"
              className="h-auto p-0 text-accent-foreground"
            >
              <Link href="/settings">
                Review settings
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
