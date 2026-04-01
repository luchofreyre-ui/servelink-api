type Props = {
  chemicalClass: string;
  topSurfaces: string[];
  topProblems: string[];
  safetySnapshot: string;
  easeSnapshot: string;
};

export function ProductAtAGlance({
  chemicalClass,
  topSurfaces,
  topProblems,
  safetySnapshot,
  easeSnapshot,
}: Props) {
  return (
    <section className="mt-12" aria-labelledby="at-a-glance-heading">
      <h2
        id="at-a-glance-heading"
        className="font-[var(--font-poppins)] text-xl font-semibold text-[#0F172A]"
      >
        At a glance
      </h2>
      <dl className="mt-6 grid gap-6 font-[var(--font-manrope)] text-sm md:grid-cols-2">
        <div>
          <dt className="text-[#64748B]">Chemistry class</dt>
          <dd className="mt-1 font-medium capitalize text-[#0F172A]">{chemicalClass.replace(/_/g, " ")}</dd>
        </div>
        <div className="md:col-span-2">
          <dt className="text-[#64748B]">Top compatible surfaces</dt>
          <dd className="mt-1 text-[#334155]">{topSurfaces.join(" · ") || "—"}</dd>
        </div>
        <div className="md:col-span-2">
          <dt className="text-[#64748B]">Top compatible problems</dt>
          <dd className="mt-1 text-[#334155]">{topProblems.join(" · ") || "—"}</dd>
        </div>
        <div>
          <dt className="text-[#64748B]">Safety snapshot</dt>
          <dd className="mt-1 leading-relaxed text-[#334155]">{safetySnapshot}</dd>
        </div>
        <div>
          <dt className="text-[#64748B]">Ease of use</dt>
          <dd className="mt-1 leading-relaxed text-[#334155]">{easeSnapshot}</dd>
        </div>
      </dl>
    </section>
  );
}
