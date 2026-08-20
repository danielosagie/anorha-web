import { beforeEach, describe, expect, it, vi } from 'vitest';

const { authMock, createClientMock, getTokenMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  createClientMock: vi.fn(),
  getTokenMock: vi.fn(),
}));

vi.mock('@repo/auth/server', () => ({ auth: authMock }));
vi.mock('@supabase/supabase-js', () => ({ createClient: createClientMock }));

const { getServerSupabaseClient } = await import('../lib/supabase/server');

describe('getServerSupabaseClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.test');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    getTokenMock.mockResolvedValue('clerk-session-token');
    authMock.mockResolvedValue({
      getToken: getTokenMock,
      userId: 'user_clerk_1',
    });
    createClientMock.mockReturnValue({ client: true });
  });

  it('attaches the Clerk token through the Supabase access-token contract', async () => {
    await expect(getServerSupabaseClient()).resolves.toEqual({ client: true });

    expect(createClientMock).toHaveBeenCalledOnce();
    const [url, key, options] = createClientMock.mock.calls[0] ?? [];
    expect(url).toBe('https://project.supabase.test');
    expect(key).toBe('anon-key');
    await expect(options.accessToken()).resolves.toBe('clerk-session-token');
    expect(options.auth).toEqual({
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    });
  });

  it('fails closed instead of issuing anonymous workspace queries', async () => {
    getTokenMock.mockResolvedValue(null);

    await expect(getServerSupabaseClient()).rejects.toThrow(
      'Workspace authentication is missing: Clerk session token is required.'
    );
    expect(createClientMock).not.toHaveBeenCalled();
  });
});
