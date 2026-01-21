import { PageWrapper } from '../components/page-wrapper';
import { InConstruction } from '../components/in-construction';

export default function InventoryPage() {
  return (
    <PageWrapper title="Inventory" description='Manage & track your inventory' >
      <InConstruction />
    </PageWrapper>
  );
}
