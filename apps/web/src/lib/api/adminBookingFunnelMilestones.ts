import { WEB_ENV } from "@/lib/env";

export type AdminBookingFunnelMilestoneRow = {
  milestone: string;
  occurredAt: string | null;
  source: "booking_event" | "intake";
  bookingEventId?: string;
  surface?: string | null;
  cadence?: string | null;
  sessionHint?: string | null;
  teamId?: string | null;
  slotId?: string | null;
  holdId?: string | null;
  reasonCode?: string | null;
  phase?: string | null;
};

export type AdminBookingFunnelMilestonesPayload = {
  ok: true;
  bookingId: string;
  milestones: AdminBookingFunnelMilestoneRow[];
};

export async function fetchAdminBookingFunnelMilestones(
  bookingId: string,
  token: string,
): Promise<AdminBookingFunnelMilestonesPayload> {
  const id = bookingId.trim();
  if (!id) {
    throw new Error("bookingId required");
  }
  const response = await fetch(
    `${WEB_ENV.apiBaseUrl}/admin/bookings/${encodeURIComponent(id)}/funnel-milestones`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      text.trim() ||
        `Failed to load funnel milestones (${response.status})`,
    );
  }
  return response.json() as Promise<AdminBookingFunnelMilestonesPayload>;
}
