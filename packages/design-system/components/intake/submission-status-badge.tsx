import { Badge } from '@repo/design-system/components/ui/badge';
import type { IntakeSubmissionStatus } from './types';

const labels: Record<IntakeSubmissionStatus, string> = {
  draft: 'Draft',
  new: 'New',
  reviewing: 'Reviewing',
  accepted: 'Accepted',
  declined: 'Declined',
};

export function SubmissionStatusBadge({
  status,
}: {
  status: IntakeSubmissionStatus;
}) {
  return (
    <Badge data-intake-status={status} variant="outline">
      {labels[status]}
    </Badge>
  );
}
