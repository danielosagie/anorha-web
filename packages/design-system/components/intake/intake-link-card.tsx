'use client';

import { Badge } from '@repo/design-system/components/ui/badge';
import { Button } from '@repo/design-system/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { useState } from 'react';

export type IntakeLinkCardData = {
  id: string;
  name: string;
  status: 'active' | 'revoked';
  metrics: {
    items: number;
    new: number;
    reviewed: number;
  };
};

export function IntakeLinkCard({
  href,
  link,
  publicUrl,
}: {
  href: string;
  link: IntakeLinkCardData;
  publicUrl?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!publicUrl) {
      return;
    }
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="truncate">{link.name}</CardTitle>
        <CardAction>
          <Badge
            data-intake-status={
              link.status === 'active' ? 'accepted' : 'declined'
            }
            variant="outline"
          >
            {link.status === 'active' ? 'Active' : 'Revoked'}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground text-xs">Items</dt>
            <dd className="font-semibold tabular-nums">
              {link.metrics.items.toLocaleString()}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground text-xs">New</dt>
            <dd className="font-semibold tabular-nums">
              {link.metrics.new.toLocaleString()}
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground text-xs">Reviewed</dt>
            <dd className="font-semibold tabular-nums">
              {link.metrics.reviewed.toLocaleString()}
            </dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter className="gap-2 border-t pt-6">
        <Button asChild size="sm" variant="outline">
          <a href={href}>Open</a>
        </Button>
        {publicUrl ? (
          <Button onClick={copy} size="sm" type="button" variant="ghost">
            {copied ? (
              <CheckIcon aria-hidden data-icon="inline-start" />
            ) : (
              <CopyIcon aria-hidden data-icon="inline-start" />
            )}
            {copied ? 'Copied' : 'Copy link'}
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}
