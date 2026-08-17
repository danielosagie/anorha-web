import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

// The create-location dialog used to be duplicated: one copy nested in the pool
// editor (with the Platform select that supplies connectionId) and a second
// top-level copy with no Platform select. Both were gated on the same
// showCreateLocation flag, so both mounted and the broken one painted on top.
// These tests pin the surviving dialog: exactly one, and it can actually submit.

const POOLS_TAB = /Pools/;
const NEW_POOL = /New Pool/;
const OPEN_DIALOG = /Create New Location/;
const SUBMIT = /Create Location/;
const DIALOG_HEADING = 'Create New Location';

const getMemberships = vi.fn(() => Promise.resolve({ data: [] }));

vi.mock('@clerk/nextjs', () => ({
  useOrganization: () => ({
    isLoaded: true,
    organization: { id: 'org_test', getMemberships },
  }),
  useAuth: () => ({
    isLoaded: true,
    getToken: () => Promise.resolve('test-token'),
  }),
}));

const AVAILABLE_LOCATIONS = {
  conn_shopify: {
    platformType: 'shopify',
    connectionName: 'Test Shopify',
    locations: [
      { platformLocationId: 'loc_1', locationName: 'Existing Warehouse' },
    ],
  },
};

// The client calls .catch() on some of these, so they must be real promises.
const jsonResponse = (body: unknown) =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response);

const routeFetch = (url: string) => {
  if (url.includes('/api/pools/locations/available')) {
    return jsonResponse(AVAILABLE_LOCATIONS);
  }
  if (url.includes('/api/pools/org/')) {
    return jsonResponse([]);
  }
  if (url.includes('/api/locations/create')) {
    return jsonResponse({
      location: { platformLocationId: 'loc_new', locationName: 'Warehouse B' },
    });
  }
  return jsonResponse({});
};

let fetchMock: ReturnType<typeof vi.fn>;

// This suite runs without vitest `globals`, so RTL auto-cleanup never registers.
afterEach(() => cleanup());

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock = vi.fn(routeFetch);
  vi.stubGlobal('fetch', fetchMock);
});

/** Renders the client and drives it to the open create-location dialog. */
const openCreateLocationDialog = async () => {
  const { default: PoolsAndPartnersClient } = await import(
    '../app/(authenticated)/team/components/PoolsAndPartnersClient'
  );

  render(<PoolsAndPartnersClient />);

  // Locations only load once loadData resolves.
  await waitFor(() => {
    expect(
      fetchMock.mock.calls.some(([url]) =>
        String(url).includes('/api/pools/locations/available')
      )
    ).toBe(true);
  });

  fireEvent.click(await screen.findByRole('button', { name: POOLS_TAB }));
  fireEvent.click(await screen.findByRole('button', { name: NEW_POOL }));
  fireEvent.click(await screen.findByRole('button', { name: OPEN_DIALOG }));
};

test('opens exactly one create-location dialog', async () => {
  await openCreateLocationDialog();

  const dialogs = await screen.findAllByRole('heading', {
    name: DIALOG_HEADING,
  });
  expect(dialogs).toHaveLength(1);

  // The surviving dialog is the one carrying the Platform select, which is the
  // only writer of connectionId that createLocation requires.
  expect(screen.getByRole('combobox')).toBeDefined();
});

test('submits the location with the selected platform connectionId', async () => {
  await openCreateLocationDialog();

  fireEvent.change(screen.getByRole('combobox'), {
    target: { value: 'conn_shopify' },
  });
  fireEvent.change(
    screen.getByPlaceholderText('e.g., Downtown Store, Warehouse A'),
    { target: { value: 'Warehouse B' } }
  );

  fireEvent.click(screen.getByRole('button', { name: SUBMIT }));

  await waitFor(() => {
    const call = fetchMock.mock.calls.find(([url]) =>
      String(url).includes('/api/locations/create')
    );
    expect(call).toBeDefined();
    expect(JSON.parse((call?.[1] as RequestInit).body as string)).toMatchObject(
      {
        connectionId: 'conn_shopify',
        name: 'Warehouse B',
      }
    );
  });

  // Dialog closes on success.
  await waitFor(() => {
    expect(screen.queryByRole('heading', { name: DIALOG_HEADING })).toBeNull();
  });
});
