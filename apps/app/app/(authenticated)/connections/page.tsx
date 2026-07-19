import { PageWrapper } from '../components/page-wrapper';
import { ConnectionsClient } from './connections-client';

export default function ConnectionsPage() {
  return (
    <PageWrapper
      title="Connections"
      description="Connect shops and keep inventory moving."
    >
      <ConnectionsClient />
    </PageWrapper>
  );
}
