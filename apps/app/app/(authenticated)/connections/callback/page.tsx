import { ConnectionCallback } from './connection-callback';

type CallbackPageProps = {
  searchParams: Promise<{
    connection?: string;
    status?: string;
    connectionId?: string;
    message?: string;
  }>;
};

export default async function ConnectionCallbackPage({
  searchParams,
}: CallbackPageProps) {
  const params = await searchParams;
  return (
    <ConnectionCallback
      platform={params.connection}
      status={params.status}
      connectionId={params.connectionId}
      message={params.message}
    />
  );
}
