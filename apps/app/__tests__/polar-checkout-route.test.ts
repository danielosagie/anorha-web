// @vitest-environment node

import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { authMock, getSupabaseTokenMock, getPolarProductIdsMock } = vi.hoisted(
  () => ({
    authMock: vi.fn(),
    getSupabaseTokenMock: vi.fn(),
    getPolarProductIdsMock: vi.fn(),
  })
);

vi.mock('@repo/auth/server', () => ({ auth: authMock }));
vi.mock('../app/api/billing/_utils', () => ({
  getSupabaseToken: getSupabaseTokenMock,
}));
vi.mock('../lib/polar-config', () => ({
  getPolarProductIds: getPolarProductIdsMock,
}));

const { GET } = await import('../app/api/polar/checkout/route');

const request = (productId = 'prod_teams') =>
  new NextRequest(
    `https://app.anorha.app/api/polar/checkout?products=${productId}`,
    {
      headers: {
        'x-forwarded-host': 'app.anorha.app',
        'x-forwarded-proto': 'https',
      },
    }
  );

describe('GET /api/polar/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    authMock.mockResolvedValue({ userId: 'user_clerk_1' });
    getSupabaseTokenMock.mockResolvedValue({
      token: 'clerk-session-token',
      apiBase: 'https://api.sssync.app/api',
    });
    getPolarProductIdsMock.mockReturnValue({
      growth: 'prod_growth',
      teams: 'prod_teams',
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('routes the selected tier through backend provider selection', async () => {
    const fetchMock = vi.fn(
      async (_input: string | URL | Request, _init?: RequestInit) =>
        Response.json({
          action: 'redirect',
          provider: 'polar',
          url: 'https://checkout.polar.sh/session/123',
        })
    );
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(request());

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://checkout.polar.sh/session/123?theme=light'
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.sssync.app/api/billing/checkout',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer clerk-session-token',
          'Content-Type': 'application/json',
        },
      })
    );
    const init = fetchMock.mock.calls[0]?.[1];
    expect(JSON.parse(String(init?.body))).toEqual({
      tier: 'Teams',
      successUrl:
        'https://app.anorha.app/billing/success?checkout_id={CHECKOUT_ID}',
    });
  });

  it('preserves a Shopify redirect without Polar query parameters', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({
          action: 'redirect',
          provider: 'shopify',
          url: 'https://store.myshopify.com/admin/charges/123',
        })
      )
    );

    const response = await GET(request());

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://store.myshopify.com/admin/charges/123'
    );
  });

  it('returns a non-success when backend provider selection fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json(
          { error: 'shopify_checkout_not_available' },
          { status: 501 }
        )
      )
    );

    const response = await GET(request());

    expect(response.status).toBe(501);
    await expect(response.json()).resolves.toMatchObject({
      reasonCode: 'BILLING_CHECKOUT_BACKEND_REJECTED',
    });
  });
});
