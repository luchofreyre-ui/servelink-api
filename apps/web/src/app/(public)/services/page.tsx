import type { Metadata } from "next";
import { ServicesHubPage } from "@/components/marketing/precision-luxury/services/ServicesHubPage";
import { buildServicesHubMetadata } from "@/components/marketing/precision-luxury/content/publicContentMetadata";

export const metadata: Metadata = buildServicesHubMetadata();

export default function ServicesHubRoute() {
  return <ServicesHubPage />;
}
