export function formatDate(value: string | null): string {
  if (!value) {
    return 'Not recorded';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
}

export function formatCost(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function firstParam(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function statusTone(
  status: string
): 'good' | 'warn' | 'bad' | 'neutral' {
  const normalized = status.toLowerCase();
  if (
    normalized.includes('error') ||
    normalized.includes('fail') ||
    normalized.includes('revok') ||
    normalized.includes('dead') ||
    normalized.includes('refund')
  ) {
    return 'bad';
  }
  if (
    normalized.includes('pending') ||
    normalized.includes('queue') ||
    normalized.includes('process') ||
    normalized.includes('past_due') ||
    normalized.includes('park')
  ) {
    return 'warn';
  }
  if (
    normalized.includes('active') ||
    normalized.includes('complete') ||
    normalized.includes('sent') ||
    normalized.includes('added') ||
    normalized.includes('live') ||
    normalized.includes('success')
  ) {
    return 'good';
  }
  return 'neutral';
}
