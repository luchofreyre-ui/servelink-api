import { RecurringOpsDashboard } from "@/components/admin/ops/RecurringOpsDashboard";
import { loadRecurringOpsPageData } from "@/lib/api/adminOps";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function AdminRecurringOpsPage() {
  const data = await loadRecurringOpsPageData(50);
  return <RecurringOpsDashboard data={data} />;
}
