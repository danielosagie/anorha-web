import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@repo/design-system/components/ui/alert';
import { Badge } from '@repo/design-system/components/ui/badge';
import {
  CircleAlertIcon,
  CircleCheckIcon,
  Clock3Icon,
} from 'lucide-react';
import type { ToolActivity } from '../types';

const statusLabel = (status: ToolActivity['status']) => {
  if (status === 'failed') {
    return 'Needs attention';
  }
  if (status === 'pending') {
    return 'In progress';
  }
  return 'Complete';
};

export function ActivityCard({ activity }: { activity: ToolActivity }) {
  const Icon =
    activity.status === 'failed'
      ? CircleAlertIcon
      : activity.status === 'pending'
        ? Clock3Icon
        : CircleCheckIcon;

  return (
    <Alert className="max-w-[38rem] bg-card/80">
      <Icon aria-hidden="true" />
      <AlertTitle>{activity.label}</AlertTitle>
      <AlertDescription>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={activity.status === 'failed' ? 'destructive' : 'secondary'}
          >
            {statusLabel(activity.status)}
          </Badge>
          {activity.summary ? <span>{activity.summary}</span> : null}
        </div>
      </AlertDescription>
    </Alert>
  );
}
