import { apiFetch } from "@/lib/api";
import { readApiJson } from "@/lib/api-response";
import { describePageLoadError } from "@/lib/page-errors";
import { roleThemes } from "@/lib/role-theme";
import { RoleShell } from "@/components/shared/RoleShell";
import { computeBookingBilling } from "@/booking-screen/billing/computeBookingBilling";
import { FranchiseOwnerBookingDetail } from "@/components/booking-detail/franchise-owner/FranchiseOwnerBookingDetail";
import { loadFoFleetScreens } from "@/lib/fleetBookingScreens";

export const dynamic = "force-dynamic";

export default async function FoBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const theme = roleThemes.fo;
  try {
    const screenRes = await apiFetch(`/api/v1/bookings/${id}/screen`);
    const { screen: raw } = await readApiJson<{ screen: any }>(screenRes);
    const screen = { ...raw, billing: computeBookingBilling(raw) };

    let fleetScreens = await loadFoFleetScreens(15);
    if (!fleetScreens.some((s: any) => String(s?.booking?.id ?? "") === id)) {
      fleetScreens = [raw, ...fleetScreens];
    }

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
        <FranchiseOwnerBookingDetail screen={screen} fleetScreens={fleetScreens} />
      </RoleShell>
    );
  } catch (e: unknown) {
    const { message } = describePageLoadError(e);
    return (
      <RoleShell theme={theme} subtitle="Could not open booking">
        <p className="text-sm text-red-700">{message}</p>
      </RoleShell>
    );
  }
}
