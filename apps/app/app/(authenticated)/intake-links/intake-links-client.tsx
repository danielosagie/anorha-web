'use client';

import { intakeRequest } from '@/lib/intake-api';
import type {
  CreatedIntakeLink,
  LinkMetrics,
  SellerIntakeLink,
  SellerStoreLink,
  SellerSubmissionListItem,
  SlugCheckResponse,
  UpdatedIntakeLinkSlug,
} from '@/lib/intake-contract';
import { useAuth } from '@repo/auth/client';
import { IntakeLinkCard } from '@repo/design-system/components/intake/intake-link-card';
import { SubmissionQueue } from '@repo/design-system/components/intake/submission-queue';
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
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import { Spinner } from '@repo/design-system/components/ui/spinner';
import {
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  PlusIcon,
  RefreshCwIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { PageWrapper } from '../components/page-wrapper';
import { StoreLinkCard } from './store-link-card';

function blankLink(created: CreatedIntakeLink): SellerIntakeLink {
  return {
    Id: created.id,
    Name: created.name,
    Slug: created.slug,
    Status: created.status,
    AnalysisActorUserId: null,
    CreatedByUserId: '',
    CreatedAt: created.createdAt,
    UpdatedAt: created.createdAt,
    RevokedByUserId: null,
    RevokedAt: null,
    metrics: { items: 0, new: 0, reviewed: 0 },
    bytes: { reserved: 0, actual: 0 },
    storeUrl: created.storeUrl,
  };
}

function CreateLinkDialog({
  onCreated,
}: {
  onCreated: (link: CreatedIntakeLink) => void;
}) {
  const { getToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState<CreatedIntakeLink | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Sign in required.');
      }
      const link = await intakeRequest<CreatedIntakeLink>({
        path: '/links',
        token,
        method: 'POST',
        body: { name: String(data.get('name') ?? '') },
      });
      setCreated(link);
      onCreated(link);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Link could not be created.'
      );
    } finally {
      setPending(false);
    }
  };

  const copy = async () => {
    if (!created) {
      return;
    }
    await navigator.clipboard.writeText(created.publicUrl);
    setCopied(true);
  };

  return (
    <Dialog
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setCreated(null);
          setError(null);
          setCopied(false);
        }
      }}
      open={open}
    >
      <DialogTrigger asChild>
        <Button>
          <PlusIcon aria-hidden data-icon="inline-start" />
          Create link
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{created ? 'Link ready' : 'Create link'}</DialogTitle>
        </DialogHeader>
        {created ? (
          <div className="flex flex-col gap-3">
            <Label htmlFor="created-link">Public link</Label>
            <div className="flex gap-2">
              <Input id="created-link" readOnly value={created.publicUrl} />
              <Button onClick={copy} type="button" variant="outline">
                {copied ? (
                  <CheckIcon aria-hidden data-icon="inline-start" />
                ) : (
                  <CopyIcon aria-hidden data-icon="inline-start" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={create}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="link-name">Name</Label>
              <Input id="link-name" name="name" required />
            </div>
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <DialogFooter>
              <Button disabled={pending} type="submit">
                {pending ? <Spinner className="size-4" /> : null}
                Create
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Metrics({ metrics }: { metrics: LinkMetrics }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All time</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-3 gap-4 sm:gap-8">
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground text-xs">Items</dt>
            <dd className="font-semibold text-xl tabular-nums">
              {metrics.items.toLocaleString()}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground text-xs">New</dt>
            <dd className="font-semibold text-xl tabular-nums">
              {metrics.new.toLocaleString()}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground text-xs">Reviewed</dt>
            <dd className="font-semibold text-xl tabular-nums">
              {metrics.reviewed.toLocaleString()}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

export function IntakeLinksClient({
  error,
  initialCursor,
  initialLinks,
  initialStoreLink,
  initialSubmissions,
  metrics,
}: {
  error: boolean;
  initialCursor: string | null;
  initialLinks: SellerIntakeLink[];
  initialStoreLink: SellerStoreLink;
  initialSubmissions: SellerSubmissionListItem[];
  metrics: LinkMetrics;
}) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [links, setLinks] = useState(initialLinks);
  const [storeLink, setStoreLink] = useState(initialStoreLink);
  const [createdUrls, setCreatedUrls] = useState<Record<string, string>>({});
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [cursor, setCursor] = useState(initialCursor);
  const [queuePending, setQueuePending] = useState(false);
  const [queueError, setQueueError] = useState(false);
  const [showOtherLinks, setShowOtherLinks] = useState(false);

  useEffect(() => {
    setLinks(initialLinks);
    setStoreLink(initialStoreLink);
    setSubmissions(initialSubmissions);
    setCursor(initialCursor);
  }, [initialCursor, initialLinks, initialStoreLink, initialSubmissions]);

  const onCreated = (created: CreatedIntakeLink) => {
    setLinks((current) => [blankLink(created), ...current]);
    setCreatedUrls((current) => ({
      ...current,
      [created.id]: created.publicUrl,
    }));
  };

  const authorized = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      throw new Error('Sign in required.');
    }
    return token;
  }, [getToken]);

  const checkSlug = useCallback(
    async (slug: string) => {
      const token = await authorized();
      return intakeRequest<SlugCheckResponse>({
        path: `/links/slug-available?slug=${encodeURIComponent(slug)}`,
        token,
      });
    },
    [authorized]
  );

  const saveSlug = useCallback(
    async (slug: string) => {
      const token = await authorized();
      // The first store link does not exist yet, so saving it creates the link
      // and claims the address in one request instead of leaving a seller with
      // a nameless link they then have to find and edit.
      if (storeLink.linkId) {
        const updated = await intakeRequest<UpdatedIntakeLinkSlug>({
          path: `/links/${encodeURIComponent(storeLink.linkId)}/slug`,
          token,
          method: 'PATCH',
          body: { slug },
        });
        setStoreLink((current) => ({
          ...current,
          slug: updated.slug,
          storeUrl: updated.storeUrl,
          suggestedSlug: null,
        }));
        setLinks((current) =>
          current.map((link) =>
            link.Id === updated.id
              ? { ...link, Slug: updated.slug, storeUrl: updated.storeUrl }
              : link
          )
        );
        return;
      }

      const created = await intakeRequest<CreatedIntakeLink>({
        path: '/links',
        token,
        method: 'POST',
        body: { name: 'Store link', slug },
      });
      onCreated(created);
      setStoreLink((current) => ({
        ...current,
        linkId: created.id,
        name: created.name,
        slug: created.slug,
        storeUrl: created.storeUrl,
        suggestedSlug: null,
      }));
    },
    [authorized, storeLink.linkId]
  );

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
        path: `/submissions?cursor=${encodeURIComponent(cursor)}`,
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

  // The store link is one row; everything else is the old many-links model kept
  // alive so no printed token breaks. It stays collapsed until there is more
  // than the store link to look at.
  const otherLinks = links.filter((link) => link.Id !== storeLink.linkId);

  return (
    <PageWrapper
      actions={<CreateLinkDialog onCreated={onCreated} />}
      title="Store link"
    >
      {error ? (
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
      ) : (
        <div className="flex flex-col gap-8">
          <StoreLinkCard
            onCheck={checkSlug}
            onSave={saveSlug}
            storeLink={storeLink}
          />

          <Metrics metrics={metrics} />

          {otherLinks.length > 0 ? (
            <section className="flex flex-col gap-4">
              <Button
                aria-expanded={showOtherLinks}
                className="self-start"
                onClick={() => setShowOtherLinks((current) => !current)}
                type="button"
                variant="ghost"
              >
                <ChevronDownIcon
                  aria-hidden
                  className={
                    showOtherLinks ? 'rotate-180 transition' : 'transition'
                  }
                  data-icon="inline-start"
                />
                More links ({otherLinks.length})
              </Button>
              {showOtherLinks ? (
                <div className="grid gap-4 xl:grid-cols-2">
                  {otherLinks.map((link) => (
                    <IntakeLinkCard
                      href={`/intake-links/${link.Id}`}
                      key={link.Id}
                      link={{
                        id: link.Id,
                        name: link.Name,
                        status: link.Status,
                        metrics: link.metrics,
                      }}
                      publicUrl={link.storeUrl ?? createdUrls[link.Id]}
                    />
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}

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
      )}
    </PageWrapper>
  );
}
