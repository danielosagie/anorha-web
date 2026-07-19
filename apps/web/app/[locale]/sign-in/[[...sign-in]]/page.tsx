import { SignIn } from '@repo/auth/components/sign-in';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: 'Sign in | Anorha',
};

export default function SignInPage() {
  return (
    <div className="connection-sign-in-page flex min-h-[calc(100vh-78px)] items-start justify-center bg-[#f4f4f1] px-5 py-12 sm:items-center sm:py-16">
      <SignIn />
    </div>
  );
}
