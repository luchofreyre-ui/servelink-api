type Props = {
  surfaces: string[];
  problems: string[];
};

export function ProductCompatibilityGrid({ surfaces, problems }: Props) {
  return (
    <section className="mt-12" aria-labelledby="compat-heading">
      <h2 id="compat-heading" className="font-[var(--font-poppins)] text-xl font-semibold text-[#0F172A]">
        Compatibility grid
      </h2>
      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div>
          <h3 className="font-[var(--font-manrope)] text-sm font-semibold text-[#64748B]">Compatible surfaces</h3>
          <ul className="mt-3 flex flex-wrap gap-2 font-[var(--font-manrope)] text-sm">
            {surfaces.map((s) => (
              <li
                key={s}
                className="rounded-full border border-[#E2E8F0] bg-white px-3 py-1 text-[#334155]"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-[var(--font-manrope)] text-sm font-semibold text-[#64748B]">Compatible problems</h3>
          <ul className="mt-3 flex flex-wrap gap-2 font-[var(--font-manrope)] text-sm">
            {problems.map((p) => (
              <li
                key={p}
                className="rounded-full border border-[#E2E8F0] bg-white px-3 py-1 text-[#334155]"
              >
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
