export function mergeEvidenceIdsUnique(
  existingIds: string[],
  incomingIds: string[]
): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const id of [...existingIds, ...incomingIds]) {
    const normalized = id.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    merged.push(normalized);
  }

  return merged.sort((a, b) => a.localeCompare(b));
}

export function removeEvidenceIds(
  existingIds: string[],
  idsToRemove: string[]
): string[] {
  const removeSet = new Set(
    idsToRemove.map((id) => id.trim()).filter(Boolean)
  );
  return existingIds
    .map((id) => id.trim())
    .filter((id) => id && !removeSet.has(id))
    .sort((a, b) => a.localeCompare(b));
}
