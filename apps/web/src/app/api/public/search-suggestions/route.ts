import { NextRequest, NextResponse } from "next/server";
import { searchSiteIndex } from "@/search/searchSiteIndex";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const hits = searchSiteIndex({ query: q, limit: 12 });
  return NextResponse.json({
    results: hits.map((doc) => ({
      href: doc.href,
      title: doc.title,
    })),
  });
}
