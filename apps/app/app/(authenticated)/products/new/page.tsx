import { getServerSupabaseClient } from '@/lib/supabase/server';
import { currentUser } from '@repo/auth/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageWrapper } from '../../components/page-wrapper';
import type { PlatformConnection } from '../contract';
import { NewProductClient } from './new-product-client';

export const metadata: Metadata = {
  title: 'New product | Anorha',
};

type ConnectionRow = {
  Id: string;
  PlatformType: string | null;
  DisplayName: string | null;
  IsEnabled: boolean | null;
  Status: string | null;
};

export default async function NewProductPage() {
  const user = await currentUser();
  if (!user) {
    notFound();
  }

  const supabase = await getServerSupabaseClient();
  const { data } = await supabase
    .from('PlatformConnections')
    .select('Id, PlatformType, DisplayName, IsEnabled, Status')
    .eq('UserId', user.id);

  const connections: PlatformConnection[] = (
    (data ?? []) as ConnectionRow[]
  ).map((connection) => ({
    id: connection.Id,
    platformType: connection.PlatformType || 'unknown',
    displayName:
      connection.DisplayName || connection.PlatformType || 'Connection',
    isEnabled: connection.IsEnabled ?? true,
    status: connection.Status,
  }));

  return (
    <PageWrapper
      title="New product"
      description="Add photos, review, and save."
    >
      <NewProductClient connections={connections} userId={user.id} />
    </PageWrapper>
  );
}
