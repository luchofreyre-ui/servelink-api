import type { FranchiseOwnerOperatingProfile } from "@/portfolio/foOperatingProfileSelectors";

export function FranchiseOwnerImprovementFocusCard({
  profile,
}: {
  profile: FranchiseOwnerOperatingProfile | null;
}) {
  if (!profile) return null;
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Improvement focus</h2>
      <p className="mt-2 text-xs text-slate-700">{profile.improvementToHealthierCohort}</p>
      <p className="mt-3 text-xs text-slate-500">
        Small, consistent upgrades here help you move toward steadier, higher-trust operations.
      </p>
    </section>
  );
}
