/** Max tags shown per category in the command-center authority strip. */
export const COMMAND_CENTER_AUTHORITY_TOP_TAG_COUNT = 5;

/**
 * Comma-separate up to `max` tags; append "+N more" when truncated.
 */
export function formatTopTagsDisplay(
  tags: string[],
  max: number = COMMAND_CENTER_AUTHORITY_TOP_TAG_COUNT,
): string {
  if (!tags.length) {
    return "—";
  }
  const head = tags.slice(0, max);
  const rest = tags.length - head.length;
  const core = head.join(", ");
  return rest > 0 ? `${core} +${rest} more` : core;
}
