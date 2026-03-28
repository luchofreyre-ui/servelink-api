import { PublicSiteFooter } from "@/components/marketing/precision-luxury/layout/PublicSiteFooter";
import { PublicSiteHeader } from "@/components/marketing/precision-luxury/layout/PublicSiteHeader";
import type { EncyclopediaClusterRollup } from "@/lib/encyclopedia/types";
import { EncyclopediaClusterHub } from "./EncyclopediaClusterHub";

interface PublicEncyclopediaClusterHubProps {
  rollup: EncyclopediaClusterRollup;
}

export function PublicEncyclopediaClusterHub({
  rollup,
}: PublicEncyclopediaClusterHubProps) {
  return (
    <div className="min-h-screen bg-[#FFF9F3] text-[#0F172A]">
      <PublicSiteHeader />
      <EncyclopediaClusterHub rollup={rollup} />
      <PublicSiteFooter />
    </div>
  );
}
