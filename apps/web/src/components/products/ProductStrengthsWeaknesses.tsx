type Props = {
  strengths: string[];
  weaknesses: string[];
  bestUseCases: string[];
  worstUseCases: string[];
};

export function ProductStrengthsWeaknesses({
  strengths,
  weaknesses,
  bestUseCases,
  worstUseCases,
}: Props) {
  return (
    <section className="mt-12" aria-labelledby="sw-heading">
      <h2 id="sw-heading" className="font-[var(--font-poppins)] text-xl font-semibold text-[#0F172A]">
        Strengths, caveats, and fit
      </h2>
      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div>
          <h3 className="font-[var(--font-manrope)] text-sm font-semibold text-[#0D9488]">Strengths</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 font-[var(--font-manrope)] text-sm leading-relaxed text-[#334155]">
            {strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <h3 className="mt-8 font-[var(--font-manrope)] text-sm font-semibold text-[#0D9488]">Best use cases</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 font-[var(--font-manrope)] text-sm leading-relaxed text-[#334155]">
            {bestUseCases.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-[var(--font-manrope)] text-sm font-semibold text-[#B45309]">Weaknesses / risks</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 font-[var(--font-manrope)] text-sm leading-relaxed text-[#334155]">
            {weaknesses.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <h3 className="mt-8 font-[var(--font-manrope)] text-sm font-semibold text-[#B45309]">Worst use cases</h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 font-[var(--font-manrope)] text-sm leading-relaxed text-[#334155]">
            {worstUseCases.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
