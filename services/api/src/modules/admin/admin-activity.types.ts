export type AdminActivityItem = {
  id: string;
  type: string;
  actorAdminUserId: string | null;
  createdAt: string;
  bookingId: string | null;
  dispatchConfigId: string | null;
  title: string;
  description: string;
  /** Same as description; stable field for UI summaries. */
  summary: string;
  metadata: Record<string, unknown>;
  /** Web app path for deep link when applicable. */
  detailPath: string | null;
  anomalyId: string | null;
};

export type AdminActivityResponse = {
  items: AdminActivityItem[];
  nextCursor: string | null;
};
