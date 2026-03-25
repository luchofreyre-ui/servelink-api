import { FoKnowledgeHubPage } from "@/components/fo/knowledge/FoKnowledgeHubPage";
import { RoleShell } from "@/components/shared/RoleShell";
import { roleThemes } from "@/lib/role-theme";
import { KnowledgeSeverity } from "@/types/knowledge";

interface FoKnowledgePageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function pickSingle(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeSeverity(value?: string): KnowledgeSeverity | undefined {
  if (value === "light" || value === "medium" || value === "heavy") {
    return value;
  }
  return undefined;
}

export default async function FoKnowledgePage({ searchParams }: FoKnowledgePageProps) {
  const theme = roleThemes.fo;
  const resolved = (await searchParams) ?? {};
  const bookingId = pickSingle(resolved.bookingId);
  const focusQuickSolve = pickSingle(resolved.focusQuickSolve) === "1";
  const searchQuery = pickSingle(resolved.q) ?? "";
  const surfaceId = pickSingle(resolved.surfaceId);
  const problemId = pickSingle(resolved.problemId);
  const severity = normalizeSeverity(pickSingle(resolved.severity));

  return (
    <RoleShell
      theme={theme}
      nav={[
        { href: "/fo", label: "My work" },
        { href: "/fo/knowledge", label: "Knowledge" },
        { href: "/notifications", label: "Alerts" },
        { href: "/", label: "Home" },
      ]}
    >
      <FoKnowledgeHubPage
        bookingId={bookingId}
        focusQuickSolve={focusQuickSolve}
        searchQuery={searchQuery}
        surfaceId={surfaceId}
        problemId={problemId}
        severity={severity}
      />
    </RoleShell>
  );
}
