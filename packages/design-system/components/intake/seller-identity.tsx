import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@repo/design-system/components/ui/avatar';
import { Badge } from '@repo/design-system/components/ui/badge';

const WHITESPACE = /\s+/;

function initials(name: string): string {
  return name
    .split(WHITESPACE)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function SellerIdentity({
  accepting,
  displayName,
  locationLabel,
  logoUrl,
}: {
  accepting: boolean;
  displayName: string;
  locationLabel: string | null;
  logoUrl: string | null;
}) {
  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-12 border">
        {logoUrl ? <AvatarImage alt="" src={logoUrl} /> : null}
        <AvatarFallback>{initials(displayName) || 'A'}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold text-base">{displayName}</p>
          <Badge variant={accepting ? 'default' : 'secondary'}>
            {accepting ? 'Accepting' : 'Closed'}
          </Badge>
        </div>
        {locationLabel ? (
          <p className="text-muted-foreground text-sm">{locationLabel}</p>
        ) : null}
      </div>
    </div>
  );
}
