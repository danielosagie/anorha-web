'use client';

import { useAuth } from '@clerk/nextjs';
import React from 'react';
import { apiUrl, readError } from '../products/contract';

export type VariantLevelUpdate = {
  connectionId: string;
  locationId: string;
  quantity?: number;
  price?: number;
};

export type SaveVariantPricingInput = {
  variantId: string;
  /** Canonical variant price (ProductVariants.Price) applied to all channels. */
  canonicalPrice?: number;
  /** Per-location price / quantity updates. */
  levelUpdates: VariantLevelUpdate[];
};

/**
 * Batches the two writes the sheet needs, each hitting an endpoint already used
 * elsewhere in this workspace:
 *   PATCH /api/inventory/:variantId          (canonical price, Next proxy)
 *   PUT   /api/products/:variantId/inventory  (per-location price + quantity, backend)
 * The PUT mirrors the mobile app's inventory save path exactly.
 */
export function useVariantMutations() {
  const { getToken } = useAuth();

  const saveVariantPricing = React.useCallback(
    async ({
      variantId,
      canonicalPrice,
      levelUpdates,
    }: SaveVariantPricingInput) => {
      if (canonicalPrice !== undefined) {
        const response = await fetch(`/api/inventory/${variantId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ price: canonicalPrice }),
        });
        if (!response.ok) {
          const detail = await response.json().catch(() => null);
          throw new Error(readError(detail, 'Could not save price'));
        }
      }

      const updates = levelUpdates.filter(
        (update) =>
          update.connectionId &&
          update.locationId &&
          (update.quantity !== undefined || update.price !== undefined)
      );

      if (updates.length > 0) {
        const token = await getToken();
        if (!token) throw new Error('Sign in again');
        const response = await fetch(
          apiUrl(`/api/products/${variantId}/inventory`),
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              updates: updates.map((update) => ({
                platformConnectionId: update.connectionId,
                locationId: update.locationId,
                ...(update.quantity !== undefined
                  ? { quantity: update.quantity }
                  : {}),
                ...(update.price !== undefined ? { price: update.price } : {}),
              })),
            }),
          }
        );
        if (!response.ok) {
          const detail = await response.json().catch(() => null);
          throw new Error(readError(detail, 'Could not save stock'));
        }
      }
    },
    [getToken]
  );

  return { saveVariantPricing };
}
