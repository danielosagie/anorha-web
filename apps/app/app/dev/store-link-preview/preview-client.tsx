'use client';

import { StoreLinkCard } from '@/app/(authenticated)/intake-links/store-link-card';
import type {
  SellerStoreLink,
  SlugCheckResponse,
} from '@/lib/intake-contract';
import { IntakeLinkCard } from '@repo/design-system/components/intake/intake-link-card';
import { Button } from '@repo/design-system/components/ui/button';
import { ChevronDownIcon } from 'lucide-react';
import { useState } from 'react';
import type { PreviewState } from './preview-states';

const PREFIX = 'https://anorha.app/x/';

const EMPTY: SellerStoreLink = {
  storeUrlPrefix: PREFIX,
  linkId: null,
  name: null,
  slug: null,
  storeUrl: null,
  suggestedSlug: 'muffins-mercantile',
  otherLinkCount: 0,
};

const SET: SellerStoreLink = {
  storeUrlPrefix: PREFIX,
  linkId: '95eaa89c-4f37-4fc7-b955-988b03049c5e',
  name: 'Store link',
  slug: 'muffins-mercantile',
  storeUrl: `${PREFIX}muffins-mercantile`,
  suggestedSlug: null,
  otherLinkCount: 0,
};

const free = (slug: string): Promise<SlugCheckResponse> =>
  Promise.resolve({
    slug,
    available: true,
    reason: null,
    message: null,
    suggestions: [],
  });

const taken = (slug: string): Promise<SlugCheckResponse> =>
  Promise.resolve({
    slug,
    available: false,
    reason: 'taken',
    message: 'That link is already taken.',
    suggestions: [`${slug}-2`, `${slug}-3`, `${slug}-4`],
  });

const reserved = (slug: string): Promise<SlugCheckResponse> =>
  Promise.resolve({
    slug,
    available: false,
    reason: 'reserved',
    message: `"${slug}" is reserved by Anorha. Pick another.`,
    suggestions: [],
  });

const noop = () => Promise.resolve();

// The card is the real production component. Only the two async boundaries are
// replaced, so what renders here is exactly what a seller sees.
const CASES: Record<
  PreviewState,
  {
    storeLink: SellerStoreLink;
    check: (slug: string) => Promise<SlugCheckResponse>;
    editing?: boolean;
    slug?: string;
    moreLinks?: boolean;
    moreLinksOpen?: boolean;
  }
> = {
  empty: { storeLink: EMPTY, check: free },
  set: { storeLink: SET, check: free },
  editing: {
    storeLink: SET,
    check: free,
    editing: true,
    slug: 'muffins-atlanta',
  },
  taken: {
    storeLink: SET,
    check: taken,
    editing: true,
    slug: 'muffins-atlanta',
  },
  reserved: {
    storeLink: SET,
    check: reserved,
    editing: true,
    slug: 'billing',
  },
  'set-with-more': { storeLink: SET, check: free, moreLinks: true },
  'set-with-more-open': {
    storeLink: SET,
    check: free,
    moreLinks: true,
    moreLinksOpen: true,
  },
};

const OTHER_LINKS = [
  {
    id: 'a2f0c2ba-0f7d-4b2c-9a05-6f0f6b0b8f11',
    name: 'Spring pop-up',
    status: 'active' as const,
    metrics: { items: 41, new: 3, reviewed: 38 },
  },
  {
    id: 'b3e1d3cb-1f8e-4c3d-8b16-7f1f7c1c9f22',
    name: 'Old flyer',
    status: 'revoked' as const,
    metrics: { items: 12, new: 0, reviewed: 12 },
  },
];

export function PreviewClient({ state }: { state: PreviewState }) {
  const activeCase = CASES[state];
  // Production opens this page with the section collapsed. The harness must
  // match that default or the screenshot is not a receipt for anything.
  const [showOtherLinks, setShowOtherLinks] = useState(
    Boolean(activeCase.moreLinksOpen)
  );

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[860px] flex-col gap-[14px] px-5 pt-8 pb-10 md:px-9">
      <header className="flex flex-col gap-1">
        <h1 className="font-semibold text-[22px] text-k0-ink leading-7 tracking-[-0.02em]">
          Store link
        </h1>
        <p className="text-[13px] text-k0-ink-3 leading-5">
          Preview state: {state}
        </p>
      </header>

      <div className="flex flex-col gap-8">
        <StoreLinkCard
          initialEditing={activeCase.editing}
          initialSlug={activeCase.slug}
          key={state}
          onCheck={activeCase.check}
          onSave={noop}
          storeLink={activeCase.storeLink}
        />

        {activeCase.moreLinks ? (
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
              More links ({OTHER_LINKS.length})
            </Button>
            {showOtherLinks ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {OTHER_LINKS.map((link) => (
                  <IntakeLinkCard
                    href={`/intake-links/${link.id}`}
                    key={link.id}
                    link={link}
                  />
                ))}
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
