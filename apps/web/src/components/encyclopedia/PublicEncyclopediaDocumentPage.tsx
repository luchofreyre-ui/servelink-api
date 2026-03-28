import { PublicSiteFooter } from "@/components/marketing/precision-luxury/layout/PublicSiteFooter";
import { PublicSiteHeader } from "@/components/marketing/precision-luxury/layout/PublicSiteHeader";
import type { EncyclopediaDocument } from "@/lib/encyclopedia/types";
import { EncyclopediaPage } from "./EncyclopediaPage";

interface PublicEncyclopediaDocumentPageProps {
  document: EncyclopediaDocument;
}

export function PublicEncyclopediaDocumentPage({
  document,
}: PublicEncyclopediaDocumentPageProps) {
  return (
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]">
      <PublicSiteHeader />
      <EncyclopediaPage document={document} />
      <PublicSiteFooter />
    </div>
  );
}
