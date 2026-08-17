import type {
  SellerLinkDetailResponse,
  SellerSubmissionListResponse,
} from '@/lib/intake-contract';
import { getSellerIntake, sellerIntakeToken } from '@/lib/intake-server';
import type { Metadata } from 'next';
import { LinkDetailClient } from './link-detail-client';

export const metadata: Metadata = {
  title: 'Intake link',
};

export default async function IntakeLinkDetailPage({
  params,
}: {
  params: Promise<{ linkId: string }>;
}) {
  const { linkId } = await params;
  try {
    const token = await sellerIntakeToken();
    const [link, submissions] = await Promise.all([
      getSellerIntake<SellerLinkDetailResponse>(
        `/links/${encodeURIComponent(linkId)}`,
        token
      ),
      getSellerIntake<SellerSubmissionListResponse>(
        `/submissions?linkId=${encodeURIComponent(linkId)}`,
        token
      ),
    ]);
    return (
      <LinkDetailClient
        initialCursor={submissions.nextCursor}
        initialLink={link}
        initialSubmissions={submissions.items}
      />
    );
  } catch {
    return (
      <LinkDetailClient
        initialCursor={null}
        initialLink={null}
        initialSubmissions={[]}
      />
    );
  }
}
