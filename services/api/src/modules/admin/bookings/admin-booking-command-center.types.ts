export type AdminBookingCommandCenterActivityPreview = {
  id: string;
  type: string;
  summary: string;
  actorUserId: string;
  actorRole: string;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type AdminBookingCommandCenterPayload = {
  success: true;
  bookingId: string;
  status: string;
  workflowState: "open" | "held" | "in_review" | "approved" | "reassign_requested";
  operatorNote: string | null;
  anomaly: {
    id: string;
    status: string;
    reviewState: string | null;
    commandCenterHeld: boolean;
    reassignmentRequested: boolean;
  } | null;
  availableActions: {
    canSaveOperatorNote: boolean;
    canHold: boolean;
    canMarkInReview: boolean;
    canApprove: boolean;
    canReassign: boolean;
  };
  activityPreview: AdminBookingCommandCenterActivityPreview[];
};
