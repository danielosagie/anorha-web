export type BillingCredits = {
  totalCents: number;
  planCents: number;
  usedCents: number;
  remainingCents: number;
  topupRemainingCents: number;
  topupTotalCents: number;
  lastTopupCents: number | null;
  lastTopupAt: string | null;
};

type BillingSummaryRecord = Readonly<Record<string, unknown>>;

function isRecord(value: unknown): value is BillingSummaryRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readCents(summary: BillingSummaryRecord, key: string): number | null {
  const value = summary[key];
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
    ? value
    : null;
}

export function parseBillingCredits(summary: unknown): BillingCredits | null {
  if (!isRecord(summary)) {
    return null;
  }

  const totalCents = readCents(summary, 'ai_credits_cents');
  const planCents = readCents(summary, 'ai_allowance_cents');
  const usedCents = readCents(summary, 'ai_used_cents');
  const remainingCents = readCents(summary, 'ai_remaining_cents');
  const topupRemainingCents = readCents(summary, 'ai_topup_remaining_cents');
  const topupTotalCents = readCents(summary, 'ai_topup_total_cents');
  const lastTopupValue = summary.last_topup_cents;
  const lastTopupCents =
    lastTopupValue === null ? null : readCents(summary, 'last_topup_cents');
  const lastTopupAt = summary.last_topup_at;

  if (
    totalCents === null ||
    planCents === null ||
    usedCents === null ||
    remainingCents === null ||
    topupRemainingCents === null ||
    topupTotalCents === null ||
    (lastTopupValue !== null && lastTopupCents === null) ||
    (lastTopupAt !== null && typeof lastTopupAt !== 'string')
  ) {
    return null;
  }

  return {
    totalCents,
    planCents,
    usedCents,
    remainingCents,
    topupRemainingCents,
    topupTotalCents,
    lastTopupCents,
    lastTopupAt,
  };
}
