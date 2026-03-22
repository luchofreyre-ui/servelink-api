export type AdminDispatchAction =
  | "approve_assignment"
  | "reassign"
  | "hold"
  | "escalate"
  | "request_review";

export interface AdminBookingDispatchCandidate {
  foId: string;
  label: string;
  rank: number;
  score: number;
  scoreLabel: string;
  distanceMiles?: number;
  acceptanceRate?: number;
  completionRate?: number;
  cancellationRate?: number;
  currentLoad?: number;
  economicsFit?: string;
  proofFit?: string;
  riskFlags: string[];
  strengths: string[];
  degraders: string[];
  recommended: boolean;
}

export interface AdminBookingDispatchTimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  detail: string;
  tone: "neutral" | "positive" | "warning" | "critical";
}

export interface AdminBookingDispatchEconomics {
  customerTotal?: number;
  franchiseOwnerPayout?: number;
  cleanerPayout?: number;
  platformRevenue?: number;
  marginPercent?: number;
  economicsBand: "strong" | "acceptable" | "thin" | "unknown";
  headline: string;
  notes: string[];
}

export interface AdminBookingDispatchGovernance {
  standardTitle?: string;
  scenarioSignature?: string;
  recommendedDecisionPath?: string;
  consistencyState: "aligned" | "watch" | "drift";
  consistencyHeadline: string;
  consistencyReasons: string[];
  riskFlags: string[];
  nextBestAction: string;
  ownerRecommendation: string;
}

export interface AdminBookingDispatchSummary {
  bookingId: string;
  serviceLabel: string;
  customerName: string;
  locationLabel: string;
  scheduledStartLabel: string;
  statusLabel: string;
  dispatchHeadline: string;
  assignedFoLabel?: string;
  signalFlags: string[];
}

export interface AdminBookingDispatchDetailModel {
  summary: AdminBookingDispatchSummary;
  candidates: AdminBookingDispatchCandidate[];
  economics: AdminBookingDispatchEconomics;
  governance: AdminBookingDispatchGovernance;
  timeline: AdminBookingDispatchTimelineEvent[];
  defaultAction: AdminDispatchAction;
  defaultActionReason: string;
}
