'use server';

import { resolveCommerceScope } from '@/lib/data/context';
import { getServerSupabaseClient } from '@/lib/supabase/server';
import { auth } from '@repo/auth/server';
import { buildProductImagePath } from './product-image-path';

const MAX_PHOTOS = 10;

export async function createProductImageUploadPaths(
  extensions: string[]
): Promise<string[]> {
  if (extensions.length === 0 || extensions.length > MAX_PHOTOS) {
    throw new Error('Invalid photo count');
  }

  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    throw new Error('Sign in again');
  }

  const supabase = await getServerSupabaseClient();
  const { dbUserId } = await resolveCommerceScope(supabase, {
    clerkUserId,
    clerkOrgId: null,
  });
  if (!dbUserId) {
    throw new Error('Account is unavailable');
  }

  return extensions.map((extension, index) =>
    buildProductImagePath({ extension, index, internalUserId: dbUserId })
  );
}
