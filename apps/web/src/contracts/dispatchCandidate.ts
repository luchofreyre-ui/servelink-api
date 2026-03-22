export interface DispatchCandidate {
  foId: string;
  label: string;
  rank: number;
  score: number;
  recommended: boolean;

  distanceMiles?: number;
  acceptanceRate?: number;
  completionRate?: number;
  cancellationRate?: number;
  currentLoad?: number;

  economicsFit?: string;
  proofFit?: string;

  strengths: string[];
  degraders: string[];
  riskFlags: string[];
}
