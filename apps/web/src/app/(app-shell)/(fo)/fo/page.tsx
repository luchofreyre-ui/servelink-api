import { apiFetch } from "@/lib/api";
import { readApiJson } from "@/lib/api-response";
import { describePageLoadError } from "@/lib/page-errors";
import { roleThemes } from "@/lib/role-theme";
import { emptyCopy } from "@/lib/empty-copy";
import { RoleShell } from "@/components/shared/RoleShell";
import { AutoRefresh } from "@/components/shared/AutoRefresh";
import { FranchiseOwnerDashboard } from "@/components/dashboard/franchise-owner/FranchiseOwnerDashboard";
import { buildFranchiseOwnerDashboardViewModel } from "@/dashboard/franchise-owner/franchiseOwnerDashboardViewModel";
import { DashboardEscalationSeed } from "@/components/notifications/DashboardEscalationSeed";
import { FranchiseOwnerWorkloadBoard } from "@/components/operations/franchise-owner/FranchiseOwnerWorkloadBoard";
import { computeBookingBilling } from "@/booking-screen/billing/computeBookingBilling";
import { buildPortfolioOperationalSnapshot } from "@/portfolio/portfolioOperationalSelectors";

export const dynamic = "force-dynamic";

export default async function FoDashboard() {
  const theme = roleThemes.fo;
  try {
    const summaryRes = await apiFetch("/api/v1/fo/screen-summary");
    const { summary } = await readApiJson<{ summary: any }>(summaryRes);
    const vm = buildFranchiseOwnerDashboardViewModel(summary, {
      emptyQueueMessage: emptyCopy.fo.dashboard,
    });
    const counts = summary?.counts ?? {};
    const paymentIssues = Number(counts.paymentActionRequired ?? 0);
    const completionReady = Number(counts.completionReady ?? 0);
    const escalationLevel = paymentIssues > 0 ? "warning" : completionReady > 0 ? "watch" : "none";
    const refreshTier =
      escalationLevel === "warning"
        ? "at_risk"
        : escalationLevel === "watch"
          ? "active"
          : "idle";

    const bookingIds: string[] = (summary?.queue?.rows ?? [])
      .map((r: any) => String(r?.bookingId ?? ""))
      .filter(Boolean)
      .slice(0, 15);

    const bookingScreens = await Promise.all(
      Array.from(new Set(bookingIds)).map(async (id) => {
        const screenRes = await apiFetch(`/api/v1/bookings/${id}/screen`);
        const { screen: raw } = await readApiJson<{ screen: any }>(screenRes);
        return { ...raw, billing: computeBookingBilling(raw) };
      }),
    );

    const portfolioSnapshot = buildPortfolioOperationalSnapshot({
      bookingScreens,
      source: "fo_console",
    });

    return (
      <RoleShell
        theme={theme}
        nav={[
          { href: "/fo", label: "My work" },
          { href: "/notifications", label: "Alerts" },
          { href: "/", label: "Home" },
        ]}
      >
        <AutoRefresh interval={10000} tier={refreshTier as any} />
        <DashboardEscalationSeed
          role="fo"
          escalationLevel={escalationLevel as any}
          headline={
            paymentIssues > 0
              ? "Critical work items need your action"
              : completionReady > 0
                ? "Some jobs are ready to complete"
                : "All clear"
          }
          detail="We’ll keep your queue updated as system risk changes."
        />
        <FranchiseOwnerDashboard
          theme={theme}
          vm={vm}
          bookingScreens={bookingScreens}
          portfolioSnapshot={portfolioSnapshot}
        />
        <FranchiseOwnerWorkloadBoard bookingScreens={bookingScreens} />
      </RoleShell>
    );
  } catch (e: unknown) {
    const { message } = describePageLoadError(e);
    return (
      <RoleShell theme={theme} subtitle="Could not load your queue">
        <p className="text-sm text-red-700">{message}</p>
        <a className="mt-3 inline-block text-sm font-medium text-blue-900 underline" href="/">
          Back to home
        </a>
      </RoleShell>
    );
  }
}
