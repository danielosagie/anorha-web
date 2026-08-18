'use client';

import type { SellerStoreLink, SlugCheckResponse } from '@/lib/intake-contract';
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
import { Input } from '@repo/design-system/components/ui/input';
import { Label } from '@repo/design-system/components/ui/label';
import { Spinner } from '@repo/design-system/components/ui/spinner';
import { CheckIcon, CopyIcon, PencilIcon } from 'lucide-react';
import { type FormEvent, useEffect, useRef, useState } from 'react';

const SCHEME = /^https?:\/\//;

// Receipt: 350 ms is one beat slower than the 250 ms an average typist leaves
// between keystrokes, so a seller typing continuously issues one check at the
// end rather than one per character. The backend tripwire is 240 checks/minute.
const CHECK_DEBOUNCE_MS = 350;

export type StoreLinkCheck = (slug: string) => Promise<SlugCheckResponse>;

export type StoreLinkSave = (slug: string) => Promise<void>;

type Availability =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'free' }
  | { state: 'blocked'; message: string; suggestions: string[] };

export function StoreLinkCard({
  storeLink,
  onCheck,
  onSave,
  initialEditing = false,
  initialSlug,
}: {
  storeLink: SellerStoreLink;
  onCheck: StoreLinkCheck;
  onSave: StoreLinkSave;
  // The preview harness renders every state without driving the keyboard.
  initialEditing?: boolean;
  initialSlug?: string;
}) {
  const hasLink = Boolean(storeLink.slug);
  const [editing, setEditing] = useState(initialEditing || !hasLink);
  const [slug, setSlug] = useState(
    initialSlug ?? storeLink.slug ?? storeLink.suggestedSlug ?? ''
  );
  const [availability, setAvailability] = useState<Availability>({
    state: 'idle',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const checkRef = useRef(0);

  const display = `${storeLink.storeUrlPrefix.replace(SCHEME, '')}${slug}`;
  const unchanged = slug === storeLink.slug;

  useEffect(() => {
    if (!editing || unchanged || slug.length === 0) {
      setAvailability({ state: 'idle' });
      return;
    }
    setAvailability({ state: 'checking' });
    const attempt = ++checkRef.current;
    const timer = window.setTimeout(async () => {
      try {
        const result = await onCheck(slug);
        // A slower answer for an older keystroke must never overwrite a newer
        // one, or the seller reads a verdict about a link they already changed.
        if (attempt !== checkRef.current) {
          return;
        }
        setAvailability(
          result.available
            ? { state: 'free' }
            : {
                state: 'blocked',
                message: result.message ?? 'That link is already taken.',
                suggestions: result.suggestions,
              }
        );
      } catch {
        if (attempt === checkRef.current) {
          setAvailability({ state: 'idle' });
        }
      }
    }, CHECK_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [editing, onCheck, slug, unchanged]);

  const copy = async () => {
    if (!storeLink.storeUrl) {
      return;
    }
    await navigator.clipboard.writeText(storeLink.storeUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(slug);
      setEditing(false);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'Link could not be saved.'
      );
    } finally {
      setSaving(false);
    }
  };

  const blocked = availability.state === 'blocked';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your store link</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {editing ? (
          <form className="flex flex-col gap-4" onSubmit={save}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="store-slug">Link</Label>
              {/* The prefix and the editable part are one address, so they sit
                  inside one control. Split across two boxes, a seller reads two
                  things and has to assemble the URL in their head. */}
              <div
                className={`flex h-[34px] w-full max-w-[420px] items-center rounded-[var(--radius-control)] border bg-k0-surface px-3 ${
                  blocked
                    ? 'border-[var(--k0-bad)]'
                    : 'border-k0-border-strong focus-within:border-k0-ink'
                }`}
              >
                <span
                  className="shrink-0 text-[14px] text-k0-ink-3 leading-5"
                  data-testid="store-link-prefix"
                >
                  {storeLink.storeUrlPrefix.replace(SCHEME, '')}
                </span>
                <Input
                  aria-describedby="store-slug-status"
                  aria-invalid={blocked}
                  autoComplete="off"
                  className="h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-[14px] shadow-none focus-visible:ring-0"
                  id="store-slug"
                  name="slug"
                  onChange={(event) =>
                    setSlug(event.currentTarget.value.toLowerCase())
                  }
                  spellCheck={false}
                  value={slug}
                />
              </div>
              <p
                className="min-h-5 text-[13px] leading-5"
                id="store-slug-status"
                role="status"
              >
                {availability.state === 'checking' ? (
                  <span className="text-k0-ink-3">Checking</span>
                ) : null}
                {availability.state === 'free' ? (
                  <span className="text-[var(--k0-good)]">Available</span>
                ) : null}
                {blocked ? (
                  <span className="text-[var(--k0-bad)]">
                    {availability.message}
                  </span>
                ) : null}
              </p>
            </div>

            {blocked && availability.suggestions.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {availability.suggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    onClick={() => setSlug(suggestion)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            ) : null}

            {saveError ? (
              <Alert variant="destructive">
                <AlertDescription>{saveError}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <Button
                disabled={saving || blocked || slug.length === 0}
                type="submit"
              >
                {saving ? <Spinner className="size-4" /> : null}
                {hasLink ? 'Save' : 'Create link'}
              </Button>
              {hasLink ? (
                <Button
                  onClick={() => {
                    setSlug(storeLink.slug ?? '');
                    setSaveError(null);
                    setAvailability({ state: 'idle' });
                    setEditing(false);
                  }}
                  type="button"
                  variant="ghost"
                >
                  Cancel
                </Button>
              ) : null}
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="break-all font-medium text-[16px] text-k0-ink leading-6">
              {display}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={copy} type="button" variant="outline">
                {copied ? (
                  <CheckIcon aria-hidden data-icon="inline-start" />
                ) : (
                  <CopyIcon aria-hidden data-icon="inline-start" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button
                onClick={() => setEditing(true)}
                type="button"
                variant="ghost"
              >
                <PencilIcon aria-hidden data-icon="inline-start" />
                Edit
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
