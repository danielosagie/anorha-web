'use client';

import { intakeRequest } from '@/lib/intake-api';
import type {
  SellerLinkDetailResponse,
  SellerSubmissionListItem,
} from '@/lib/intake-contract';
import { useAuth } from '@repo/auth/client';
import { SubmissionQueue } from '@repo/design-system/components/intake/submission-queue';
import {
  Alert,
  AlertDescription,
} from '@repo/design-system/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@repo/design-system/components/ui/alert-dialog';
import { Badge } from '@repo/design-system/components/ui/badge';
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
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import { Spinner } from '@repo/design-system/components/ui/spinner';
import { PencilIcon, RefreshCwIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { PageWrapper } from '../../components/page-wrapper';

function bytesLabel(bytes: number): string {
  return `${new Intl.NumberFormat('en-US').format(bytes)} bytes`;
}

function dateLabel(value: string | null): string {
  if (!value) {
    return 'None';
  }
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(value));
}

export function LinkDetailClient({
  initialCursor,
  initialLink,
  initialSubmissions,
}: {
  initialCursor: string | null;
  initialLink: SellerLinkDetailResponse | null;
  initialSubmissions: SellerSubmissionListItem[];
}) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [link, setLink] = useState(initialLink);
  const [renameOpen, setRenameOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [cursor, setCursor] = useState(initialCursor);
  const [queuePending, setQueuePending] = useState(false);
  const [queueError, setQueueError] = useState(false);

  useEffect(() => {
    setLink(initialLink);
    setSubmissions(initialSubmissions);
    setCursor(initialCursor);
  }, [initialCursor, initialLink, initialSubmissions]);

  if (!link) {
    return (
      <PageWrapper
        onBack={() => router.push('/intake-links')}
        title="Intake link"
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

  const rename = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    const name = String(new FormData(event.currentTarget).get('name') ?? '');
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Sign in required.');
      }
      await intakeRequest({
        path: `/links/${encodeURIComponent(link.Id)}/name`,
        token,
        method: 'PATCH',
        body: { name },
      });
      setLink((current) =>
        current ? { ...current, Name: name.trim() } : current
      );
      setRenameOpen(false);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Link could not be renamed.'
      );
    } finally {
      setPending(false);
    }
  };

  const revoke = async () => {
    setPending(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Sign in required.');
      }
      const result = await intakeRequest<{
        Status?: 'revoked';
        RevokedAt?: string;
      }>({
        path: `/links/${encodeURIComponent(link.Id)}/revoke`,
        token,
        method: 'POST',
      });
      setLink((current) =>
        current
          ? {
              ...current,
              Status: 'revoked',
              RevokedAt: result.RevokedAt ?? new Date().toISOString(),
            }
          : current
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Link could not be revoked.'
      );
    } finally {
      setPending(false);
    }
  };

  const loadMore = async () => {
    if (!cursor) {
      return;
    }
    setQueuePending(true);
    setQueueError(false);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Sign in required.');
      }
      const next = await intakeRequest<{
        items: SellerSubmissionListItem[];
        nextCursor: string | null;
      }>({
        path: `/submissions?linkId=${encodeURIComponent(link.Id)}&cursor=${encodeURIComponent(cursor)}`,
        token,
      });
      setSubmissions((current) => [...current, ...next.items]);
      setCursor(next.nextCursor);
    } catch {
      setQueueError(true);
    } finally {
      setQueuePending(false);
    }
  };

  return (
    <PageWrapper
      actions={
        <>
          <Dialog onOpenChange={setRenameOpen} open={renameOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <PencilIcon aria-hidden data-icon="inline-start" />
                Rename
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rename</DialogTitle>
              </DialogHeader>
              <form className="flex flex-col gap-4" onSubmit={rename}>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="rename-link">Name</Label>
                  <Input
                    defaultValue={link.Name}
                    id="rename-link"
                    name="name"
                    required
                  />
                </div>
                {error ? (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}
                <DialogFooter>
                  <Button disabled={pending} type="submit">
                    {pending ? <Spinner className="size-4" /> : null}
                    Save
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={link.Status === 'revoked'} variant="outline">
                Revoke
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Revoke link?</AlertDialogTitle>
                <AlertDialogDescription>
                  Existing submissions stay. This link stops accepting.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction disabled={pending} onClick={revoke}>
                  Revoke
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      }
      onBack={() => router.push('/intake-links')}
      title={link.Name}
    >
      <div className="flex flex-col gap-8">
        {error && !renameOpen ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {link.Status === 'revoked' ? (
          <Alert>
            <AlertDescription>
              Revoked. Existing submissions remain available.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Public link</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Shown once when the link is created.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                data-intake-status={
                  link.Status === 'active' ? 'accepted' : 'declined'
                }
                variant="outline"
              >
                {link.Status === 'active' ? 'Active' : 'Revoked'}
              </Badge>
            </CardContent>
          </Card>
        </div>

        <section className="flex flex-col gap-4">
          <h2 className="font-semibold text-lg">Usage</h2>
          <Card>
            <CardContent>
              <dl className="grid gap-5 sm:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <dt className="text-muted-foreground text-xs">Submissions</dt>
                  <dd className="font-semibold tabular-nums">
                    {link.metrics.items.toLocaleString()}
                  </dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-muted-foreground text-xs">Reserved</dt>
                  <dd className="font-semibold tabular-nums">
                    {bytesLabel(link.bytes.reserved)}
                  </dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-muted-foreground text-xs">Stored</dt>
                  <dd className="font-semibold tabular-nums">
                    {bytesLabel(link.bytes.actual)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
          <Alert>
            <AlertDescription>
              Configured limits are unavailable for this link.
            </AlertDescription>
          </Alert>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-semibold text-lg">History</h2>
          <Card>
            <CardContent>
              <dl className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <dt className="text-muted-foreground text-xs">Created</dt>
                  <dd className="text-sm">{dateLabel(link.CreatedAt)}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-muted-foreground text-xs">Revoked</dt>
                  <dd className="text-sm">{dateLabel(link.RevokedAt)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-semibold text-lg">Submissions</h2>
          <SubmissionQueue
            items={submissions}
            reviewHref={(id) => `/intake-submissions/${id}`}
          />
          {queueError ? (
            <Alert variant="destructive">
              <AlertDescription>
                More submissions could not load.
              </AlertDescription>
            </Alert>
          ) : null}
          {cursor ? (
            <Button
              className="self-start"
              disabled={queuePending}
              onClick={loadMore}
              type="button"
              variant="outline"
            >
              {queuePending ? <Spinner className="size-4" /> : null}
              Load more
            </Button>
          ) : null}
        </section>
      </div>
    </PageWrapper>
  );
}
