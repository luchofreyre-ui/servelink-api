import type { FranchiseOwnerOperatingProfile } from "@/portfolio/foOperatingProfileSelectors";

export function FranchiseOwnerOperatingProfileCard({
  profile,
}: {
  profile: FranchiseOwnerOperatingProfile | null;
}) {
  if (!profile) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
        Operating profile will appear once your active jobs are loaded in this view.
      </section>
    );
  }
  return (
    <section className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Your operating profile</h2>
      <p className="mt-2 text-xs text-slate-700">{profile.operatingProfileSummary}</p>
      <p className="mt-3 text-xs text-slate-800">
        <span className="font-medium">Where to lean in: </span>
        {profile.biggestDrag}
      </p>
      <p className="mt-2 text-xs text-slate-700">{profile.disciplineFocus}</p>
    </section>
  );
}
