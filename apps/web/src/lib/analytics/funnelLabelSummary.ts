import { parseSearchResultLabel } from "@/lib/analytics/searchResultLabelParser";

export type FunnelStage =
  | "search_top_result"
  | "search_non_top_result"
  | "compare_entry"
  | "product_context"
  | "authority_close"
  | "product_buy"
  | "unknown";

export function summarizeFunnelLabel(label: string | null | undefined): FunnelStage {
  if (!label) return "unknown";

  const parsedSearch = parseSearchResultLabel(label);
  if (parsedSearch) {
    return parsedSearch.topBucket === "top_result" ? "search_top_result" : "search_non_top_result";
  }

  if (label.startsWith("product_context_compare:")) return "compare_entry";
  if (label.startsWith("product_context_chip:")) return "product_context";
  if (label.startsWith("product_primary_problem:")) return "product_context";
  if (label.startsWith("product_context_buy:")) return "product_buy";
  if (label.startsWith("authority_close_buy:")) return "authority_close";
  if (label.startsWith("authority_close_compare:")) return "authority_close";
  if (label.startsWith("authority_close_products:")) return "authority_close";
  if (label.startsWith("product_priority_compare:")) return "compare_entry";

  return "unknown";
}
