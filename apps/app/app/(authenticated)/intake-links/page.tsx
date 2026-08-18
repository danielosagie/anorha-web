import type {
  SellerLinkListResponse,
  SellerSubmissionListResponse,
} from '@/lib/intake-contract';
import { getSellerIntake, sellerIntakeToken } from '@/lib/intake-server';
import type { Metadata } from 'next';
import { IntakeLinksClient } from './intake-links-client';

export const metadata: Metadata = {
  title: 'Store link',
};

// A seller who cannot reach the backend still has a store link; they just
// cannot see it yet. The empty shape keeps the card renderable and lets the
// error card own the message, rather than crashing the page.
const OFFLINE_STORE_LINK = {
  storeUrlPrefix: 'https://anorha.app/x/',
  linkId: null,
  name: null,
  slug: null,
  storeUrl: null,
  suggestedSlug: null,
  otherLinkCount: 0,
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
        initialStoreLink={links.storeLink}
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
        initialStoreLink={OFFLINE_STORE_LINK}
        initialSubmissions={[]}
        metrics={{ items: 0, new: 0, reviewed: 0 }}
      />
    );
  }
}
