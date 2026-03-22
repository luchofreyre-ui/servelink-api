import type { AdminDecisionStandard } from "./adminDecisionStandardModel";
import { ADMIN_DECISION_STANDARDS } from "./adminDecisionStandardRegistry";
import type { OperationalSignalContract } from "@/contracts/operationalSignal";

export function getAllAdminDecisionStandards(): AdminDecisionStandard[] {
  return ADMIN_DECISION_STANDARDS;
}

const byId = (id: string) => ADMIN_DECISION_STANDARDS.find((s) => s.id === id) ?? null;

/**
 * Match operational dispatch / execution signals to the closest applicable standard.
 */
export function findMatchingStandard(
  signal: OperationalSignalContract,
): AdminDecisionStandard | null {
  if (signal.overloadRisk) {
    return byId("std_overloaded_supervision");
  }
  if (signal.slaMiss || signal.noShowRisk) {
    return byId("std_severity_comm_gap");
  }
  if (signal.noAcceptance) {
    return byId("std_policy_no_owner");
  }
  if (signal.offerExpired || signal.reassignment) {
    return byId("std_stale_ack");
  }
  return null;
}
