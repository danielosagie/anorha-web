import amazonLogo from '@/app/assets/amazon.svg';
import cloverLogo from '@/app/assets/clover.svg';
import ebayLogo from '@/app/assets/ebay.svg';
import facebookLogo from '@/app/assets/facebook.svg';
import shopifyLogo from '@/app/assets/shopify.svg';
import squareLogo from '@/app/assets/square.svg';
import { StoreIcon } from 'lucide-react';
import type { StaticImageData } from 'next/image';
import Image from 'next/image';

const platformLogos: Readonly<
  Record<string, { name: string; logo: StaticImageData }>
> = {
  amazon: { name: 'Amazon', logo: amazonLogo },
  clover: { name: 'Clover', logo: cloverLogo },
  ebay: { name: 'eBay', logo: ebayLogo },
  facebook: { name: 'Facebook', logo: facebookLogo },
  shopify: { name: 'Shopify', logo: shopifyLogo },
  square: { name: 'Square', logo: squareLogo },
};

export function PlatformMark({
  platform,
  showName = true,
}: {
  platform: string | null;
  showName?: boolean;
}) {
  const normalized = platform?.toLowerCase().trim() ?? '';
  const definition =
    platformLogos[normalized] ??
    Object.entries(platformLogos).find(([key]) =>
      normalized.includes(key)
    )?.[1];
  const name = definition?.name ?? platform ?? 'Unknown';

  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-card">
        {definition ? (
          <Image
            src={definition.logo}
            alt=""
            className="size-5 object-contain"
            width={20}
            height={20}
          />
        ) : (
          <StoreIcon className="size-4 text-muted-foreground" aria-hidden />
        )}
      </span>
      {showName ? <span className="truncate">{name}</span> : null}
    </span>
  );
}
