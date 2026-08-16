import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@repo/design-system/components/ui/alert';
import { CircleAlertIcon } from 'lucide-react';
import type { BudgetFailure } from './types';

const budgetLabels: Record<string, string> = {
  public_requests_per_hour: 'Request limit',
  submissions_per_link: 'Submission limit',
  media_per_submission: 'Photo limit',
  image_bytes_per_file: 'Photo size',
};

function bytesLabel(bytes: number): string {
  const exact = new Intl.NumberFormat('en-US').format(bytes);
  if (bytes % (1024 * 1024) === 0) {
    return `${bytes / (1024 * 1024)} MB (${exact} bytes)`;
  }
  return `${exact} bytes`;
}

function limitLabel(failure: BudgetFailure): string {
  if (failure.unit.includes('bytes')) {
    return bytesLabel(failure.limit);
  }
  return `${new Intl.NumberFormat('en-US').format(failure.limit)} ${failure.unit}`;
}

function customerAsk(failure: BudgetFailure): string {
  if (failure.budget === 'media_per_submission') {
    return 'Remove photos or ask the seller to raise the limit.';
  }
  if (failure.budget === 'image_bytes_per_file') {
    return 'Choose a smaller photo or ask the seller to raise the limit.';
  }
  if (failure.budget === 'submissions_per_link') {
    return 'Ask the seller for a new link.';
  }
  if (failure.budget === 'public_requests_per_hour') {
    return 'Try again after the limit resets.';
  }
  return failure.ask.replace(/[A-Z][A-Z0-9_]{2,}/g, 'the limit');
}

export function BudgetNotice({ failure }: { failure: BudgetFailure }) {
  return (
    <Alert>
      <CircleAlertIcon aria-hidden />
      <AlertTitle>{budgetLabels[failure.budget] ?? 'Intake limit'}</AlertTitle>
      <AlertDescription>
        <p>Limit: {limitLabel(failure)}.</p>
        <p>{customerAsk(failure)}</p>
      </AlertDescription>
    </Alert>
  );
}
