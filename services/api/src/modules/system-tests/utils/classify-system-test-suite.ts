/**
 * Infer Playwright suite bucket from spec file path when ingest omits `suite`.
 */
export function classifySystemTestSuite(filePath: string): string {
  const p = filePath.replace(/\\/g, "/").toLowerCase();

  if (p.includes("/public-search") || p.includes("/search/") || p.includes("public-search")) {
    return "search";
  }
  if (
    p.includes("knowledge") ||
    p.includes("encyclopedia") ||
    p.includes("quick-solve") ||
    p.includes("quick_solve")
  ) {
    return "knowledge";
  }
  if (p.includes("/admin/") || p.includes("/regression/admin/")) {
    return "admin";
  }
  if (p.includes("/customer/") || p.includes("/regression/customer/")) {
    return "customer";
  }
  if (p.includes("/fo/") || p.includes("/regression/fo/")) {
    return "fo";
  }
  if (p.includes("/public/") || p.includes("/regression/public/")) {
    return "public";
  }

  return "unknown";
}
