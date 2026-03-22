import { apiFetch } from "@/lib/api";
import { readApiJson } from "@/lib/api-response";
import { describePageLoadError } from "@/lib/page-errors";
import { roleThemes } from "@/lib/role-theme";
import { emptyCopy } from "@/lib/empty-copy";
import { RoleShell } from "@/components/shared/RoleShell";
import { AutoRefresh } from "@/components/shared/AutoRefresh";
import { CustomerDashboard } from "@/components/dashboard/customer/CustomerDashboard";
import { buildCustomerDashboardViewModel } from "@/dashboard/customer/customerDashboardViewModel";
import { DashboardEscalationSeed } from "@/components/notifications/DashboardEscalationSeed";
import { CustomerActiveBookingCard } from "@/components/operations/customer/CustomerActiveBookingCard";
import { CustomerBookingUpdatesPanel } from "@/components/operations/customer/CustomerBookingUpdatesPanel";

export const dynamic = "force-dynamic";

export default async function CustomerDashboardPage() {
  const theme = roleThemes.customer;
  try {
    const summaryRes = await apiFetch("/api/v1/customer/screen-summary");
    const { summary } = await readApiJson<{ summary: any }>(summaryRes);
    const vm = buildCustomerDashboardViewModel(summary, {
      emptyMessage: emptyCopy.customer.dashboard,
    });
    const counts = summary?.counts ?? {};
    const actionRequired = Number(counts.actionRequired ?? 0);
    const completionReady = Number(counts.completionReady ?? 0);
    const escalationLevel =
      actionRequired > 0 ? "warning" : completionReady > 0 ? "watch" : "none";
    const refreshTier =
      escalationLevel === "warning"
        ? "at_risk"
        : escalationLevel === "watch"
          ? "active"
          : "idle";

    const activeBookingIds: string[] = (summary?.rows ?? [])
      .filter((r: any) => String(r?.status ?? "").toLowerCase() !== "completed")
      .map((r: any) => String(r?.bookingId ?? ""))
      .filter(Boolean)
      .slice(0, 3);

    const activeBookingScreens = await Promise.all(
      Array.from(new Set(activeBookingIds)).map(async (id) => {
        const screenRes = await apiFetch(`/api/v1/bookings/${id}/screen`);
        const { screen: raw } = await readApiJson<{ screen: any }>(screenRes);
        return raw;
      }),
    );

    const nextActive =
      activeBookingScreens
        .slice()
        .sort((a: any, b: any) => {
          const ta = a?.booking?.scheduledStart ? new Date(a.booking.scheduledStart).getTime() : Number.MAX_SAFE_INTEGER;
          const tb = b?.booking?.scheduledStart ? new Date(b.booking.scheduledStart).getTime() : Number.MAX_SAFE_INTEGER;
          return ta - tb;
        })[0] ?? null;

    return (
      <RoleShell
        theme={theme}
        nav={[
          { href: "/customer", label: "Bookings" },
          { href: "/notifications", label: "Updates" },
          { href: "/", label: "Home" },
        ]}
      >
        <AutoRefresh interval={10000} tier={refreshTier as any} />
        <DashboardEscalationSeed
          role="customer"
          escalationLevel={escalationLevel as any}
          headline={
            actionRequired > 0
              ? "Your booking needs one step"
              : completionReady > 0
                ? "Upcoming booking is ready"
                : "All clear"
          }
          detail="We’ll update this page automatically when new information arrives."
        />
        {nextActive ? <CustomerActiveBookingCard screen={nextActive} /> : null}
        {nextActive ? <CustomerBookingUpdatesPanel screen={nextActive} /> : null}
        <CustomerDashboard theme={theme} vm={vm} />
      </RoleShell>
    );
  } catch (e: unknown) {
    const { message } = describePageLoadError(e);
    return (
      <RoleShell theme={theme} subtitle="Could not load your bookings">
        <p className="text-sm text-red-700">{message}</p>
        <a className="mt-3 inline-block text-sm font-medium text-emerald-900 underline" href="/">
          Back to home
        </a>
      </RoleShell>
    );
  }
}
