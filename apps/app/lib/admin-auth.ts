export function parseAdminClerkUserIds(
  value: string | undefined
): ReadonlySet<string> {
  return new Set(
    (value ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

export function isAdminClerkUserId(
  userId: string | null | undefined,
  configuredUserIds: string | undefined
): boolean {
  const allowedUserIds = parseAdminClerkUserIds(configuredUserIds);

  // Empty or unset is deliberately fail-closed, including in development.
  return Boolean(
    userId && allowedUserIds.size > 0 && allowedUserIds.has(userId)
  );
}
