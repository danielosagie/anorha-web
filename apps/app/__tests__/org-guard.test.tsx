import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

// OrgGuard used to treat "Clerk has not answered yet" as "this user has no
// organizations". On a cold load the hook's top-level isLoaded flips true before
// the paginated membership request returns, so the guard redirected to
// /onboarding, whose server component saw a real organization and redirected to
// "/". Every deep link landed on the dashboard.
//
// These tests pin the three states: pending waits, resolved-empty redirects,
// resolved-non-empty renders, and an errored request never redirects.

const replace = vi.fn();
let pathname = '/intake-links';

type MembershipsStub = {
  data?: unknown[];
  isLoading: boolean;
  isError: boolean;
};

let hookState: {
  isLoaded: boolean;
  userMemberships: MembershipsStub | undefined;
} = {
  isLoaded: false,
  userMemberships: undefined,
};

vi.mock('@clerk/nextjs', () => ({
  useOrganizationList: () => hookState,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useRouter: () => ({ replace }),
}));

vi.mock('@repo/design-system/components/ui/spinner', () => ({
  Spinner: () => <output aria-label="Spinner" />,
}));

const { OrgGuard } = await import(
  '../app/(authenticated)/components/org-guard'
);

const CHILD = 'workspace content';
const renderGuard = () => render(<OrgGuard>{CHILD}</OrgGuard>);
const loader = () => screen.queryByLabelText('Loading workspace');

beforeEach(() => {
  replace.mockClear();
  pathname = '/intake-links';
});

afterEach(cleanup);

test('waits while Clerk has not reported memberships yet', () => {
  hookState = { isLoaded: false, userMemberships: undefined };
  renderGuard();

  expect(loader()).not.toBeNull();
  expect(replace).not.toHaveBeenCalled();
});

test('waits while the membership request is still in flight', () => {
  // The regression: isLoaded is true, but the list has not come back. An empty
  // data array here must not read as "no organizations".
  hookState = {
    isLoaded: true,
    userMemberships: { data: [], isLoading: true, isError: false },
  };
  renderGuard();

  expect(loader()).not.toBeNull();
  expect(replace).not.toHaveBeenCalled();
});

test('renders the page once memberships resolve', () => {
  hookState = {
    isLoaded: true,
    userMemberships: {
      data: [{ id: 'mem_1' }],
      isLoading: false,
      isError: false,
    },
  };
  renderGuard();

  expect(screen.getByText(CHILD)).toBeDefined();
  expect(replace).not.toHaveBeenCalled();
});

test('redirects to onboarding only on a resolved empty answer', () => {
  hookState = {
    isLoaded: true,
    userMemberships: { data: [], isLoading: false, isError: false },
  };
  renderGuard();

  expect(replace).toHaveBeenCalledWith('/onboarding');
});

test('does not redirect when the membership request failed', () => {
  // An error is not an answer. The server layout is the authoritative check.
  hookState = {
    isLoaded: true,
    userMemberships: { data: [], isLoading: false, isError: true },
  };
  renderGuard();

  expect(screen.getByText(CHILD)).toBeDefined();
  expect(replace).not.toHaveBeenCalled();
});

test('does not redirect away from onboarding itself', () => {
  pathname = '/onboarding';
  hookState = {
    isLoaded: true,
    userMemberships: { data: [], isLoading: false, isError: false },
  };
  renderGuard();

  expect(screen.getByText(CHILD)).toBeDefined();
  expect(replace).not.toHaveBeenCalled();
});
