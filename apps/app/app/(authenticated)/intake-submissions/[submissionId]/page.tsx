import type { SellerSubmissionDetailResponse } from '@/lib/intake-contract';
import { getSellerIntake, sellerIntakeToken } from '@/lib/intake-server';
import type { Metadata } from 'next';
import { SubmissionDetailClient } from './submission-detail-client';

export const metadata: Metadata = {
  title: 'Intake submission',
};

export default async function IntakeSubmissionPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  try {
    const token = await sellerIntakeToken();
    const submission = await getSellerIntake<SellerSubmissionDetailResponse>(
      `/submissions/${encodeURIComponent(submissionId)}`,
      token
    );
    return <SubmissionDetailClient initialSubmission={submission} />;
  } catch {
    return <SubmissionDetailClient initialSubmission={null} />;
  }
}
