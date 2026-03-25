export function trackSearchQuery(query: string) {
  if (!query) return;

  console.log("[search] query:", query);

  // future: send to backend
}

export function trackSearchClick(result: {
  id: string;
  type: string;
  query: string;
}) {
  console.log("[search] click:", result);
}

export function trackQuickSolveLaunch(params: {
  surfaceId?: string;
  problemId?: string;
  severity?: string;
  source?: string;
}) {
  console.log("[search] quick_solve_launch:", params);
}
