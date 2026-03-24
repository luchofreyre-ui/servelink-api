"use client";

import type { AdminBookingAuthorityBlock } from "@/lib/api/adminBookingCommandCenter";
import { AdminCommandCenterAuthorityStrip } from "@/components/admin/AdminCommandCenterAuthorityStrip";
import { AdminAuthorityRecomputeControl } from "@/components/admin/AdminAuthorityRecomputeControl";

export function AdminBookingAuthorityActionSurface(props: {
  loading?: boolean;
  error?: string | null;
  authority?: AdminBookingAuthorityBlock | null;
  apiBase: string;
  token: string | null;
  bookingId: string;
  onRecomputeComplete?: () => void;
}) {
  const { loading, error, authority, apiBase, token, bookingId, onRecomputeComplete } = props;

  return (
    <section
      data-testid="admin-booking-authority-action-surface"
      className="mb-5 rounded-[24px] border border-white/10 bg-black/20 p-4 sm:p-5"
      aria-label="Booking authority actions"
    >
      <div className="mb-3 border-b border-white/10 pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
          Booking authority
        </p>
        <p className="mt-1 text-sm text-white/70">
          Saved classifier tags, review state, and resolver refresh for this booking.
        </p>
      </div>
      <AdminCommandCenterAuthorityStrip
        variant="embedded"
        loading={loading}
        error={error}
        authority={authority}
      />
      <AdminAuthorityRecomputeControl
        apiBase={apiBase}
        token={token}
        bookingId={bookingId}
        disabled={!token || !bookingId}
        onComplete={onRecomputeComplete}
        compact
      />
    </section>
  );
}
