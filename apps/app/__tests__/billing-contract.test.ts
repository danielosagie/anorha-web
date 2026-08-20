import { describe, expect, it } from 'vitest';
import { parseBillingCredits } from '../app/(authenticated)/billing/billing-contract';

describe('parseBillingCredits', () => {
  it('accepts the exact billing summary credit contract', () => {
    expect(
      parseBillingCredits({
        ai_credits_cents: 9000,
        ai_allowance_cents: 6000,
        ai_used_cents: 1250,
        ai_remaining_cents: 7750,
        ai_topup_remaining_cents: 3000,
        ai_topup_total_cents: 3000,
        last_topup_cents: 3000,
        last_topup_at: '2026-08-20T12:00:00.000Z',
      })
    ).toEqual({
      totalCents: 9000,
      planCents: 6000,
      usedCents: 1250,
      remainingCents: 7750,
      topupRemainingCents: 3000,
      topupTotalCents: 3000,
      lastTopupCents: 3000,
      lastTopupAt: '2026-08-20T12:00:00.000Z',
    });
  });

  it('rejects wrappers and incomplete legacy shapes', () => {
    expect(
      parseBillingCredits({
        data: {
          ai_credits_cents: 9000,
          ai_allowance_cents: 6000,
        },
      })
    ).toBeNull();
    expect(parseBillingCredits({ ai_credits_limit: 900 })).toBeNull();
  });
});
