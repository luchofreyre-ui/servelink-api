export type PublicBookingWindow = {
  foId: string;
  foDisplayName: string | null;
  startAt: string;
  endAt: string;
};

/** Ranked team option for public Step 3 (max 2). */
export type PublicBookingTeamOption = {
  id: string;
  displayName: string;
  shortLabel?: string;
  isRecommended?: boolean;
};

export type PublicBookingUnavailableReason = {
  code: string;
  message: string;
};
