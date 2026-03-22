/**
 * Aligned to backend responses where applicable.
 */
export type BookingDispatchDetail = {
  id: string;
  status: string;
  scheduledStart: string | null;
  estimatedHours?: number | null;
  foId?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export type BookingTimelineEvent = {
  id: string;
  type: string;
  createdAt: string;
  actorLabel?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
};

export type BookingDispatchExplainer = {
  booking: { id: string; status: string; scheduledStart: string | null; foId: string | null };
  scoringVersion: string;
  configVersion: number | null;
  selectedCandidateId: string | null;
  selectedFoId: string | null;
  dispatchSequence: number | null;
  trigger: string | null;
  summary: string;
  candidates: Array<{
    providerId: string | null;
    foId: string | null;
    baseRank: number | null;
    effectiveRank: number | null;
    selected: boolean;
    excluded: boolean;
    exclusionReason: string | null;
    factors: Record<string, number>;
    explanation: string[];
  }>;
  notes: string[];
};

export type BookingAdminNote = {
  id: string;
  body: string;
  authorName?: string | null;
  createdAt: string;
};

export type ManualDispatchActionPayload = {
  franchiseOwnerId?: string;
  adminId?: string;
  note?: string;
};
