'use client';

import { SignUp } from '@repo/auth/components/sign-up';

type SignUpClientPageProps = {
  readonly title: string;
  readonly description: string;
};

export const SignUpClientPage = ({ title, description }: SignUpClientPageProps) => (
  <>
    <div className="flex flex-col space-y-2 text-center">
      <h1 className="font-semibold text-2xl tracking-tight">{title}</h1>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
    <SignUp />
  </>
);

