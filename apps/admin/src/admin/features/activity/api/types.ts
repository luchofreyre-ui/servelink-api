/**
 * Aligned to backend AdminActivityItem / AdminActivityResponse.
 */
export type AdminActivityItem = {
  id: string;
  type: string;
  actorAdminUserId: string | null;
  createdAt: string;
  bookingId: string | null;
  dispatchConfigId: string | null;
  title: string;
  description: string;
  metadata: Record<string, unknown>;
};

export type AdminActivityListResponse = {
  items: AdminActivityItem[];
  nextCursor: string | null;
};

export type AdminActivityParams = {
  limit?: number;
  entityType?: string;
  actorType?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
};
