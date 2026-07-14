import type { Metadata } from 'next';
import { InventoryContent } from '../components/inventory-content';

export const metadata: Metadata = {
  title: 'Inventory | Anorha',
  description: 'Manage inventory across every connected sales channel.',
};

export default function InventoryPage() {
  return <InventoryContent />;
}
