import { AdminOperationsCommandCenter } from "@/components/admin/AdminOperationsCommandCenter";
import { SystemAccessLayer } from "@/components/admin/SystemAccessLayer";
import { loadAdminOpsPageData } from "@/lib/api/adminOps";
import OpsSystemBacklog from "./_components/OpsSystemBacklog";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function AdminOpsPage() {
  const data = await loadAdminOpsPageData(25);

  return (
    <>
      <AdminOperationsCommandCenter>
        <SystemAccessLayer />
      </AdminOperationsCommandCenter>
      <OpsSystemBacklog {...data} />
    </>
  );
}
