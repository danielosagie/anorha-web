import { SubmissionStatusBadge } from '@repo/design-system/components/intake/submission-status-badge';
import { Button } from '@repo/design-system/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/design-system/components/ui/table';
import type {
  IntakeCondition,
  IntakeSubmissionStatus,
  SignedIntakeMedia,
} from './types';

export type SubmissionQueueItem = {
  id: string;
  customer: { name: string; email: string } | null;
  description: string;
  quantity: number;
  condition: IntakeCondition;
  status: Exclude<IntakeSubmissionStatus, 'draft'>;
  submittedAt: string;
  media: {
    count: number;
    imageCount: number;
    videoCount: number;
    cover: SignedIntakeMedia | null;
  };
};

function receivedLabel(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function itemFacts(item: SubmissionQueueItem): string {
  const media = `${item.media.count} ${item.media.count === 1 ? 'photo' : 'photos'}`;
  const quantity = `Qty ${item.quantity}`;
  return `${media}, ${quantity}`;
}

function ItemCell({ item }: { item: SubmissionQueueItem }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="size-12 shrink-0 overflow-hidden rounded-lg border bg-muted">
        {item.media.cover?.url ? (
          /* biome-ignore lint/nursery/noImgElement: Signed private media must load directly. */
          <img
            alt=""
            className="size-full object-cover"
            src={item.media.cover.url}
          />
        ) : null}
      </div>
      <div className="min-w-0">
        <p className="max-w-md truncate font-medium">{item.description}</p>
        <p className="text-muted-foreground text-xs">{itemFacts(item)}</p>
      </div>
    </div>
  );
}

export function SubmissionQueue({
  items,
  reviewHref,
}: {
  items: SubmissionQueueItem[];
  reviewHref: (submissionId: string) => string;
}) {
  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            New items will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Received</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Review</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <ItemCell item={item} />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span>{item.customer?.name ?? 'Unknown'}</span>
                    <span className="text-muted-foreground text-xs">
                      {item.customer?.email ?? 'No email'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{receivedLabel(item.submittedAt)}</TableCell>
                <TableCell>
                  <SubmissionStatusBadge status={item.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="outline">
                    <a href={reviewHref(item.id)}>Review</a>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 md:hidden">
        {items.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle className="line-clamp-2 leading-snug">
                {item.description}
              </CardTitle>
              <CardAction>
                <SubmissionStatusBadge status={item.status} />
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <ItemCell item={item} />
              <div className="flex items-center justify-between gap-3 text-muted-foreground">
                <span>{item.customer?.name ?? 'Unknown'}</span>
                <span>{receivedLabel(item.submittedAt)}</span>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button asChild className="w-full" variant="outline">
                <a href={reviewHref(item.id)}>Review</a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}
