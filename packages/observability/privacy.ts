const PRIVATE_INTAKE_PATH = /\/x\/[^/?#"'\\\s]+(?:[/?#"'\\]|$)/;

export function containsPrivateIntakePath(value: unknown): boolean {
  try {
    return PRIVATE_INTAKE_PATH.test(JSON.stringify(value));
  } catch {
    return false;
  }
}

export function dropPrivateIntakeEvent<Event>(event: Event): Event | null {
  return containsPrivateIntakePath(event) ? null : event;
}
