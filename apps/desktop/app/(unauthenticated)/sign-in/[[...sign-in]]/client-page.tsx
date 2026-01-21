'use client';

import { SignIn } from '@repo/auth/components/sign-in';

type SignInClientPageProps = {
  readonly title: string;
  readonly description: string;
};

export const SignInClientPage = ({ title, description }: SignInClientPageProps) => (
  <>
    <div className="flex flex-col space-y-2 text-center">
      <h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
    <SignIn />
  </>
);

