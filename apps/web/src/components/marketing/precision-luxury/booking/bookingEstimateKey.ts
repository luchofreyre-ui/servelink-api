/**
 * Omits `recurringInterest.note` from the preview key so operational / preference
 * prose does not invalidate the live estimate request while the customer types.
 */
function intakePayloadForEstimateRequestKey(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const recurringInterest = input.recurringInterest;
  if (
    recurringInterest == null ||
    typeof recurringInterest !== "object" ||
    Array.isArray(recurringInterest)
  ) {
    return input;
  }

  const ri = recurringInterest as Record<string, unknown>;

  /** Team-planning-only transport uses `interested: false` + `note` — never invalidates preview. */
  if (ri.interested !== true) {
    const { recurringInterest: _, ...rest } = input;
    return rest;
  }

  const { note: _omitNote, ...recRest } = ri;

  if (Object.keys(recRest).length === 0) {
    const { recurringInterest: _ri, ...rest } = input;
    return rest;
  }

  return { ...input, recurringInterest: recRest };
}

export function buildEstimateRequestKey(input: Record<string, unknown>) {
  return JSON.stringify(intakePayloadForEstimateRequestKey(input));
}
