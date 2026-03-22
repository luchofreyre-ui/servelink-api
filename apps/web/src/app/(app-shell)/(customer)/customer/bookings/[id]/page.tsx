import { apiFetch } from "@/lib/api";
import { readApiJson } from "@/lib/api-response";
import { describePageLoadError } from "@/lib/page-errors";
import { roleThemes } from "@/lib/role-theme";
import { RoleShell } from "@/components/shared/RoleShell";
import { computeBookingBilling } from "@/booking-screen/billing/computeBookingBilling";
import { CustomerBookingDetail } from "@/components/booking-detail/customer/CustomerBookingDetail";
import { WEB_ENV } from "@/lib/env";
import { BookingUiTelemetryCard } from "@/components/bookings/BookingUiTelemetryCard";
import { CustomerBookingStatusClient } from "@/components/bookings/CustomerBookingStatusClient";

export const dynamic = "force-dynamic";

export default async function CustomerBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const theme = roleThemes.customer;
  try {
    const screenRes = await apiFetch(`/api/v1/bookings/${id}/screen`);
    const { screen: raw } = await readApiJson<{ screen: any }>(screenRes);
    const screen = { ...raw, billing: computeBookingBilling(raw) };

    return (
      <RoleShell
        theme={theme}
        nav={[
          { href: "/customer", label: "Bookings" },
          { href: "/notifications", label: "Updates" },
          { href: "/", label: "Home" },
        ]}
      >
        <div className="space-y-6">
          <CustomerBookingStatusClient bookingId={id} />
          {WEB_ENV.enableBookingUiTelemetry ? <BookingUiTelemetryCard /> : null}
          <CustomerBookingDetail screen={screen} />
        </div>
      </RoleShell>
    );
  } catch (e: unknown) {
    const { message } = describePageLoadError(e);
    return (
      <RoleShell theme={theme} subtitle="We couldn’t load this booking">
        <p className="text-sm text-red-700">{message}</p>
      </RoleShell>
    );
  }
}
