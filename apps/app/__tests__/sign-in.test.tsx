import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import Page from '../app/(unauthenticated)/sign-in/[[...sign-in]]/page';

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
  render(<Page />);
  expect(
    screen.getByRole('heading', {
      level: 1,
      name: 'Welcome back',
    })
  ).toBeDefined();
});
