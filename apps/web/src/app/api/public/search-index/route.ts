import { NextRequest, NextResponse } from "next/server";
import { searchSiteIndexIncludingApiLivePages } from "@/search/searchSiteIndex";

/**
 * JSON search index (same merge + ranking as `/search` SSR).
 * Used by Playwright search integrity tests and operators who need machine-readable hits.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json({ ok: true, query: "", count: 0, results: [] });
  }

  const hits = await searchSiteIndexIncludingApiLivePages({ query: q, limit: 48 });
  return NextResponse.json({
    ok: true,
    query: q,
    count: hits.length,
    results: hits.map((doc) => ({
      id: doc.id,
      href: doc.href,
      title: doc.title,
    })),
  });
}
