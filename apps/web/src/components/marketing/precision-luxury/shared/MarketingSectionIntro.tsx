type MarketingSectionIntroProps = {
  eyebrow: string;
  title: string;
  body?: string;
  maxWidthClassName?: string;
};

export function MarketingSectionIntro({
  eyebrow,
  title,
  body,
  maxWidthClassName = "max-w-3xl",
}: MarketingSectionIntroProps) {
  return (
    <div className={maxWidthClassName}>
      <p className="font-[var(--font-poppins)] text-xs uppercase tracking-[0.28em] text-[#C9B27C]">
        {eyebrow}
      </p>
      <h2 className="mt-4 font-[var(--font-poppins)] text-4xl font-semibold tracking-[-0.035em] text-[#0F172A] md:text-5xl">
        {title}
      </h2>
      {body ? (
        <p className="mt-5 font-[var(--font-manrope)] text-lg leading-8 text-[#475569]">
          {body}
        </p>
      ) : null}
    </div>
  );
}
