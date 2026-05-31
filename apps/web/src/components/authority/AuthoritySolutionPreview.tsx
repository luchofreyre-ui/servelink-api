import { resolveAuthoritySolutionProfile } from "@/authority/data/authoritySolutionResolver";
import type {
  AuthoritySolutionProduct,
  AuthoritySolutionServiceEscalationLevel,
} from "@/authority/types/authoritySolutionTypes";

type AuthoritySolutionPreviewProps = {
  problemSlug: string;
  surfaceSlug: string;
};

const ACTION_LABELS = [
  { label: "Inspect", pattern: /\b(inspect|identify|confirm|diagnos)/i },
  { label: "Test first", pattern: /\b(pretest|test|small|controlled)/i },
  { label: "Treat", pattern: /\b(treat|clean|apply|remove|chemistry)/i },
  { label: "Verify", pattern: /\b(verify|dry|inspect after|reassess|recover|rinse)/i },
] as const;

const PRODUCT_ROLE_LABELS: Record<AuthoritySolutionProduct["role"], string> = {
  best_option: "Best option",
  alternative: "Alternative",
  maintenance: "Maintenance",
  professional_only: "Professional only",
  do_not_use: "Do not use",
};

function workflowLabels(sequence: readonly string[]): string[] {
  const labels: string[] = [];
  for (const { label, pattern } of ACTION_LABELS) {
    if (sequence.some((step) => pattern.test(step))) labels.push(label);
  }
  if (sequence.length > 0 && !labels.includes("Test first")) {
    const insertAt = labels.includes("Inspect") ? labels.indexOf("Inspect") + 1 : 0;
    labels.splice(insertAt, 0, "Test first");
  }
  return labels.slice(0, 4);
}

function escalationLabel(level: AuthoritySolutionServiceEscalationLevel): string | null {
  if (level === "stop_and_assess") return "Stop and assess";
  if (level === "professional_recommended") return "Professional recommended";
  return null;
}

function roleProducts(products: readonly AuthoritySolutionProduct[]): AuthoritySolutionProduct[] {
  const priority: AuthoritySolutionProduct["role"][] = [
    "best_option",
    "alternative",
    "maintenance",
    "professional_only",
  ];
  return priority
    .map((role) => products.find((product) => product.role === role))
    .filter((product): product is AuthoritySolutionProduct => Boolean(product));
}

export function AuthoritySolutionPreview({
  problemSlug,
  surfaceSlug,
}: AuthoritySolutionPreviewProps) {
  const solution = resolveAuthoritySolutionProfile({ problemSlug, surfaceSlug });
  const actions = workflowLabels(solution.workflow.actionSequence);
  const tools = solution.tools.slice(0, 3);
  const chemicals = solution.chemicals.filter((chemical) => chemical.role !== "do_not_use").slice(0, 2);
  const products = roleProducts(solution.products);
  const escalation = escalationLabel(solution.serviceEscalation.level);

  return (
    <div
      aria-label="Recommended solution"
      className="mt-3 rounded-2xl border border-[#E8DFD0]/85 bg-white/76 p-3 text-sm leading-6 text-[#475569]"
    >
      <div className="font-[var(--font-poppins)] text-[11px] font-semibold uppercase tracking-[0.16em] text-[#B89F6B]">
        Recommended solution
      </div>
      {escalation ? (
        <div className="mt-2 font-semibold text-[#0F172A]">{escalation}</div>
      ) : null}
      <div className="mt-2 space-y-1.5 font-[var(--font-manrope)]">
        <div>
          <span className="font-semibold text-[#0F172A]">Workflow:</span>{" "}
          {actions.length ? actions.join(" → ") : "Confirm the surface and problem before choosing products."}
        </div>
        <div>
          <span className="font-semibold text-[#0F172A]">Tools:</span>{" "}
          {tools.length ? tools.map((tool) => tool.name).join(", ") : "Confirm tool fit after inspection."}
        </div>
        <div>
          <span className="font-semibold text-[#0F172A]">Chemistry:</span>{" "}
          {chemicals.length
            ? chemicals.map((chemical) => chemical.name).join(", ")
            : "Confirm chemistry fit before treatment."}
        </div>
        <div>
          <span className="font-semibold text-[#0F172A]">Product summary:</span>{" "}
          {products.length
            ? products
                .map((product) => `${PRODUCT_ROLE_LABELS[product.role]}: ${product.title}`)
                .join(" · ")
            : "No product match yet."}
        </div>
      </div>
    </div>
  );
}
