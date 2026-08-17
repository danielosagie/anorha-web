'use client';

import { intakeRequest } from '@/lib/intake-api';
import type {
  DecisionResponse,
  SellerSubmissionDetailResponse,
} from '@/lib/intake-contract';
import { useAuth } from '@repo/auth/client';
import { IntakeMediaViewer } from '@repo/design-system/components/intake/intake-media-viewer';
import { SubmissionStatusBadge } from '@repo/design-system/components/intake/submission-status-badge';
import {
  Alert,
  AlertDescription,
} from '@repo/design-system/components/ui/alert';
import { Button } from '@repo/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@repo/design-system/components/ui/dialog';
import { Label } from '@repo/design-system/components/ui/label';
import { Spinner } from '@repo/design-system/components/ui/spinner';
import { Textarea } from '@repo/design-system/components/ui/textarea';
import { CheckIcon, RefreshCwIcon, XIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { PageWrapper } from '../../components/page-wrapper';

function dateLabel(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function conditionLabel(value: string): string {
  if (value === 'like_new') {
    return 'Like new';
  }
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

export function SubmissionDetailClient({
  initialSubmission,
}: {
  initialSubmission: SellerSubmissionDetailResponse | null;
}) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [submission, setSubmission] = useState(initialSubmission);
  const [decisionOpen, setDecisionOpen] = useState<
    'accepted' | 'declined' | null
  >(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reviewStarted = useRef(false);

  useEffect(() => {
    setSubmission(initialSubmission);
  }, [initialSubmission]);

  useEffect(() => {
    if (!submission || submission.status !== 'new' || reviewStarted.current) {
      return;
    }
    reviewStarted.current = true;
    const startReview = async () => {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Sign in required.');
        }
        const result = await intakeRequest<{
          status: 'reviewing';
          reviewStartedAt: string;
        }>({
          path: `/submissions/${encodeURIComponent(submission.id)}/review`,
          token,
          method: 'POST',
        });
        setSubmission((current) =>
          current
            ? {
                ...current,
                status: result.status,
                reviewStartedAt: result.reviewStartedAt,
              }
            : current
        );
      } catch {
        setError('Review could not start. Try again.');
      }
    };
    startReview().catch(() => setError('Review could not start. Try again.'));
  }, [getToken, submission]);

  if (!submission) {
    return (
      <PageWrapper
        onBack={() => router.push('/intake-links')}
        title="Submission"
      >
        <Card>
          <CardHeader>
            <CardTitle>Could not load</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.refresh()} variant="outline">
              <RefreshCwIcon aria-hidden data-icon="inline-start" />
              Try again
            </Button>
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  const decide = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!decisionOpen) {
      return;
    }
    setPending(true);
    setError(null);
    const note = String(
      new FormData(event.currentTarget).get('decisionReason') ?? ''
    ).trim();
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Sign in required.');
      }
      const result = await intakeRequest<DecisionResponse>({
        path: `/submissions/${encodeURIComponent(submission.id)}/${decisionOpen === 'accepted' ? 'accept' : 'decline'}`,
        token,
        method: 'POST',
        body: note ? { decisionReason: note } : {},
      });
      setSubmission((current) =>
        current
          ? {
              ...current,
              status: result.status,
              decision: {
                at: result.decisionAt,
                byUserId: '',
                reason: note || null,
                draftTitle: null,
              },
              conversion: {
                ...current.conversion,
                status: result.conversionStatus,
              },
            }
          : current
      );
      setDecisionOpen(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Decision could not be saved.'
      );
    } finally {
      setPending(false);
    }
  };

  const canDecide =
    submission.status === 'new' || submission.status === 'reviewing';

  return (
    <PageWrapper onBack={() => router.push('/intake-links')} title="Submission">
      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <SubmissionStatusBadge status={submission.status} />
            <span className="text-muted-foreground text-sm">
              {dateLabel(submission.submittedAt)} UTC
            </span>
          </div>
          {canDecide ? (
            <div className="flex items-center gap-2">
              <Dialog
                onOpenChange={(open) =>
                  setDecisionOpen(open ? 'declined' : null)
                }
                open={decisionOpen === 'declined'}
              >
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <XIcon aria-hidden data-icon="inline-start" />
                    Decline
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Decline?</DialogTitle>
                  </DialogHeader>
                  <form className="flex flex-col gap-4" onSubmit={decide}>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="decline-note">Note</Label>
                      <Textarea id="decline-note" name="decisionReason" />
                    </div>
                    <DialogFooter>
                      <Button
                        disabled={pending}
                        type="submit"
                        variant="outline"
                      >
                        {pending ? <Spinner className="size-4" /> : null}
                        Decline
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog
                onOpenChange={(open) =>
                  setDecisionOpen(open ? 'accepted' : null)
                }
                open={decisionOpen === 'accepted'}
              >
                <DialogTrigger asChild>
                  <Button>
                    <CheckIcon aria-hidden data-icon="inline-start" />
                    Accept
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Accept?</DialogTitle>
                  </DialogHeader>
                  <form className="flex flex-col gap-4" onSubmit={decide}>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="accept-note">Note</Label>
                      <Textarea id="accept-note" name="decisionReason" />
                    </div>
                    <DialogFooter>
                      <Button disabled={pending} type="submit">
                        {pending ? <Spinner className="size-4" /> : null}
                        Accept
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          ) : null}
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.6fr)]">
          <section className="flex flex-col gap-4">
            <h2 className="font-semibold text-lg">Media</h2>
            <IntakeMediaViewer
              media={submission.media}
              onRefresh={() => router.refresh()}
            />
          </section>

          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Item</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">
                      Description
                    </dt>
                    <dd className="whitespace-pre-wrap text-sm">
                      {submission.description}
                    </dd>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <dt className="text-muted-foreground text-xs">
                        Quantity
                      </dt>
                      <dd className="text-sm tabular-nums">
                        {submission.quantity.toLocaleString()}
                      </dd>
                    </div>
                    <div className="flex flex-col gap-1">
                      <dt className="text-muted-foreground text-xs">
                        Condition
                      </dt>
                      <dd className="text-sm">
                        {conditionLabel(submission.condition)}
                      </dd>
                    </div>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Name</dt>
                    <dd className="text-sm">
                      {submission.customer?.name ?? 'Unknown'}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground text-xs">Email</dt>
                    <dd className="break-all text-sm">
                      {submission.customer?.email ?? 'No email'}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {submission.decision ? (
              <Card>
                <CardHeader>
                  <CardTitle>Decision</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <dt className="text-muted-foreground text-xs">Saved</dt>
                      <dd className="text-sm">
                        {dateLabel(submission.decision.at)} UTC
                      </dd>
                    </div>
                    <div className="flex flex-col gap-1">
                      <dt className="text-muted-foreground text-xs">Draft</dt>
                      <dd className="text-sm">Not requested</dd>
                    </div>
                    {submission.decision.reason ? (
                      <div className="flex flex-col gap-1">
                        <dt className="text-muted-foreground text-xs">Note</dt>
                        <dd className="whitespace-pre-wrap text-sm">
                          {submission.decision.reason}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
