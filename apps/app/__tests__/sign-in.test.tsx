import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { SignInClientPage } from '../app/(unauthenticated)/sign-in/[[...sign-in]]/client-page';

// Mock Clerk hooks and components
vi.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignIn: () => <div data-testid="clerk-sign-in">Sign In Component</div>,
  useSession: () => ({ isLoaded: false, isSignedIn: false }),
  useUser: () => ({ isLoaded: false, user: null }),
}));

vi.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTheme: () => ({ resolvedTheme: 'light', setTheme: vi.fn() }),
}));

test('Sign In Page', () => {
  render(<SignInClientPage title="Welcome back" description="Enter your details to sign in." />);
  expect(
    screen.getByRole('heading', {
      level: 1,
      name: 'Welcome back',
    })
  ).toBeDefined();
});
