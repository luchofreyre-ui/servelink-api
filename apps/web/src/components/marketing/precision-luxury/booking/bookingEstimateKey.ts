export function buildEstimateRequestKey(input: Record<string, unknown>) {
  return JSON.stringify(input);
}
