/**
 * Safe type guard: coerce unknown to Record<string, unknown>.
 * Returns empty object for non-objects.
 */
export function asRecord(val: unknown): Record<string, unknown> {
  if (typeof val === "object" && val !== null && !Array.isArray(val)) {
    return val as Record<string, unknown>;
  }
  return {};
}
