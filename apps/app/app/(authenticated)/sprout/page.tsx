import type { Metadata } from 'next';
import { PageWrapper } from '../components/page-wrapper';
import { SproutChat } from './sprout-chat';

export const metadata: Metadata = {
  title: 'Sprout | Anorha',
  description: 'Plan and review work with Sprout.',
};

export default function SproutPage() {
  return (
    <PageWrapper title="Sprout" description="Plan the next move.">
      <SproutChat />
    </PageWrapper>
  );
}
