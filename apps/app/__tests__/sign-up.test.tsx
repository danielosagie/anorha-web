import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { SignUpClientPage } from '../app/(unauthenticated)/sign-up/[[...sign-up]]/client-page';

// Mock Clerk hooks and components
vi.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SignUp: () => <div data-testid="clerk-sign-up">Sign Up Component</div>,
  useSession: () => ({ isLoaded: false, isSignedIn: false }),
  useUser: () => ({ isLoaded: false, user: null }),
}));

vi.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTheme: () => ({ resolvedTheme: 'light', setTheme: vi.fn() }),
}));

test('Sign Up Page', () => {
  render(<SignUpClientPage title="Create an account" description="Enter your details to get started." />);
  expect(
    screen.getByRole('heading', {
      level: 1,
      name: 'Create an account',
    })
  ).toBeDefined();
});
