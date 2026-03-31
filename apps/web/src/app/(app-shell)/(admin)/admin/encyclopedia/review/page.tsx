import ApiEncyclopediaIntakeRunbookPanel from "@/components/admin/encyclopedia/ApiEncyclopediaIntakeRunbookPanel";
import ApiEncyclopediaMigrationPanel from "@/components/admin/encyclopedia/ApiEncyclopediaMigrationPanel";
import ApiEncyclopediaReviewPanel from "@/components/admin/encyclopedia/ApiEncyclopediaReviewPanel";
import EncyclopediaReviewPanel from "@/components/admin/encyclopedia/EncyclopediaReviewPanel";
import { buildStoredAdminReviewPages } from "@/lib/encyclopedia/adminPipeline.server";

export default function AdminEncyclopediaReviewPage() {
  const pages = buildStoredAdminReviewPages();

  return (
    <main className="space-y-6 p-6">
      <div>
        <div className="text-sm font-medium text-neutral-500">
          Encyclopedia admin
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Review generated cleaning authority pages
        </h1>
      </div>

      <div className="space-y-6">
        <ApiEncyclopediaMigrationPanel />
        <ApiEncyclopediaIntakeRunbookPanel />
        <ApiEncyclopediaReviewPanel />
      </div>

      <details className="rounded-2xl border border-neutral-200 bg-white p-5">
        <summary className="cursor-pointer text-sm font-medium">
          Legacy pipeline review corpus (read-only migration reference)
        </summary>

        <div className="mt-4">
          <EncyclopediaReviewPanel readOnly pages={pages} />
        </div>
      </details>
    </main>
  );
}
