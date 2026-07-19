import type { getServerSupabaseClient } from '@/lib/supabase/server';

export type CommerceScope = {
  clerkUserId: string;
  clerkOrgId: string | null;
};

export type ResolvedCommerceScope = {
  dbUserId: string | null;
  dbOrgId: string | null;
};

export type PlatformConnection = {
  id: string;
  platformType: string;
  displayName: string;
};

type UserRow = { readonly Id: string };
type OrganizationRow = { readonly Id: string };
type ConnectionRow = {
  readonly Id: string;
  readonly PlatformType: string;
  readonly DisplayName: string;
};

export type ServerSupabaseClient = Awaited<
  ReturnType<typeof getServerSupabaseClient>
>;

export async function resolveCommerceScope(
  supabase: ServerSupabaseClient,
  scope: CommerceScope
): Promise<ResolvedCommerceScope> {
  const userPromise = supabase
    .from('Users')
    .select('Id')
    .eq('ClerkUserId', scope.clerkUserId)
    .maybeSingle();
  const orgPromise = scope.clerkOrgId
    ? supabase
        .from('Organizations')
        .select('Id')
        .eq('ClerkOrgId', scope.clerkOrgId)
        .maybeSingle()
    : Promise.resolve({ data: null });

  const [userResult, orgResult] = await Promise.all([userPromise, orgPromise]);
  const user = userResult.data as unknown as UserRow | null;
  const organization = orgResult.data as unknown as OrganizationRow | null;

  return {
    dbUserId: user?.Id ?? null,
    dbOrgId: organization?.Id ?? null,
  };
}

export async function getOrgConnections(
  supabase: ServerSupabaseClient,
  dbOrgId: string
): Promise<{
  connections: PlatformConnection[];
  error: string | null;
}> {
  const result = await supabase
    .from('PlatformConnections')
    .select('Id, PlatformType, DisplayName')
    .eq('OrgId', dbOrgId)
    .order('DisplayName', { ascending: true });

  if (result.error) {
    return { connections: [], error: result.error.message };
  }

  const rows = (result.data ?? []) as unknown as readonly ConnectionRow[];
  return {
    connections: rows.map((row) => ({
      id: row.Id,
      platformType: row.PlatformType,
      displayName: row.DisplayName,
    })),
    error: null,
  };
}

export function toFiniteNumber(value: unknown): number {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function asRecord(value: unknown): Readonly<Record<string, unknown>> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }
  return value as Readonly<Record<string, unknown>>;
}
