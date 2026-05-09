export type OpsCustomerTeamPrepSectionProps = {
  teamPrepDetails: string;
  variant: "dark" | "light";
  /** Root element test id for assertions */
  testId?: string;
};

const TITLE = "Customer team-prep details";
const INTRO =
  "These notes came from the customer's planning details and should be reviewed before arrival.";
const QUOTE_DISCLAIMER =
  "Information for dispatch and crew — does not change the quoted total.";

export function OpsCustomerTeamPrepSection({
  teamPrepDetails,
  variant,
  testId = "ops-customer-team-prep",
}: OpsCustomerTeamPrepSectionProps) {
  if (!teamPrepDetails.replace(/\s+/g, "")) return null;
  const trimmed = teamPrepDetails.trim();

  const shell =
    variant === "dark"
      ? "rounded-[28px] border border-cyan-500/25 bg-cyan-500/5 p-6"
      : "rounded-xl border border-slate-200 bg-slate-50/90 p-4";

  const titleCls =
    variant === "dark"
      ? "text-xl font-semibold text-white"
      : "text-lg font-semibold text-slate-900";

  const introCls =
    variant === "dark" ? "mt-2 text-sm text-white/65" : "mt-2 text-sm text-slate-600";

  const bodyCls =
    variant === "dark"
      ? "mt-4 whitespace-pre-wrap text-sm leading-6 text-white/85"
      : "mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-800";

  const footCls =
    variant === "dark" ? "mt-3 text-xs leading-5 text-white/50" : "mt-3 text-xs leading-5 text-slate-500";

  return (
    <section data-testid={testId} className={shell}>
      <h2 className={titleCls}>{TITLE}</h2>
      <p className={introCls}>{INTRO}</p>
      <p className={bodyCls}>{trimmed}</p>
      <p className={footCls}>{QUOTE_DISCLAIMER}</p>
    </section>
  );
}
