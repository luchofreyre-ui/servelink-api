/**
 * Workload- and size-based minimum crew for eligibility (not service-type tables).
 * `serviceType` is accepted for signature stability / future extension; it is not used in v1 rules.
 */
export function getWorkloadMinCrew(args: {
  estimatedLaborMinutes: number;
  squareFootage: number;
  serviceType?: string;
}): number {
  void args.serviceType;

  const labor = Math.max(0, Math.floor(Number(args.estimatedLaborMinutes)));
  let minCrew = 1;
  if (labor <= 240) {
    minCrew = 1;
  } else if (labor <= 480) {
    minCrew = 2;
  } else {
    minCrew = 3;
  }

  const sqft = Math.max(0, Math.floor(Number(args.squareFootage)));
  if (sqft >= 4000) {
    minCrew = Math.max(minCrew, 3);
  } else if (sqft >= 2500) {
    minCrew = Math.max(minCrew, 2);
  }

  return Math.max(1, minCrew);
}
