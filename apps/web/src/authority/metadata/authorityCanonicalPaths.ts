export function getEncyclopediaCanonicalPath() {
  return "/encyclopedia";
}

export function getMethodsIndexCanonicalPath() {
  return "/methods";
}

export function getSurfacesIndexCanonicalPath() {
  return "/surfaces";
}

export function getProblemsIndexCanonicalPath() {
  return "/problems";
}

export function getGuidesIndexCanonicalPath() {
  return "/guides";
}

export function getCompareHubCanonicalPath(type: "methods" | "surfaces" | "problems") {
  return `/compare/${type}`;
}

export function getClustersCanonicalPath() {
  return "/clusters";
}

export function getMethodDetailCanonicalPath(methodSlug: string) {
  return `/methods/${methodSlug}`;
}

export function getSurfaceDetailCanonicalPath(surfaceSlug: string) {
  return `/surfaces/${surfaceSlug}`;
}

export function getProblemDetailCanonicalPath(problemSlug: string) {
  return `/problems/${problemSlug}`;
}

export function getGuideDetailCanonicalPath(guideSlug: string) {
  return `/guides/${guideSlug}`;
}

export function getMethodComboCanonicalPath(methodSlug: string, comboSlug: string) {
  return `/methods/${methodSlug}/${comboSlug}`;
}

export function getSurfaceProblemComboCanonicalPath(surfaceSlug: string, problemSlug: string) {
  return `/surfaces/${surfaceSlug}/${problemSlug}`;
}

export function getComparisonCanonicalPath(
  type: "methods" | "surfaces" | "problems",
  comparisonSlug: string,
) {
  return `/compare/${type}/${comparisonSlug}`;
}

export function getClusterDetailCanonicalPath(clusterSlug: string) {
  return `/clusters/${clusterSlug}`;
}
