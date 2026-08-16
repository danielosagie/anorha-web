import type {
  SellerLinkListResponse,
  SellerSubmissionListResponse,
} from '@/lib/intake-contract';
import { getSellerIntake, sellerIntakeToken } from '@/lib/intake-server';
import type { Metadata } from 'next';
import { IntakeLinksClient } from './intake-links-client';

export const metadata: Metadata = {
  title: 'Intake links',
};

export default async function IntakeLinksPage() {
  try {
    const token = await sellerIntakeToken();
    const [links, submissions] = await Promise.all([
      getSellerIntake<SellerLinkListResponse>('/links', token),
      getSellerIntake<SellerSubmissionListResponse>('/submissions', token),
    ]);
    return (
      <IntakeLinksClient
        error={false}
        initialLinks={links.links}
        metrics={links.metrics}
        initialCursor={submissions.nextCursor}
        initialSubmissions={submissions.items}
      />
    );
  } catch {
    return (
      <IntakeLinksClient
        error
        initialCursor={null}
        initialLinks={[]}
        initialSubmissions={[]}
        metrics={{ items: 0, new: 0, reviewed: 0 }}
      />
    );
  }
}
