import type { AdminDecisionStandard } from "./adminDecisionStandardModel";

export const ADMIN_DECISION_STANDARDS: AdminDecisionStandard[] = [
  {
    id: "std_missing_proof_thin_margin",
    title: "Missing proof with thin economics",
    scenarioSignature:
      "Repeated or combined missing proof signals while margin is compressed.",
    recommendedDecisionPath:
      "Pause dispatch expansion on the job, assign proof recovery owner, and confirm margin recovery plan with finance.",
    expectedOwnershipPosture: "Named admin owner + FO accountability checkpoint",
    followUpExpectation: "Proof uploaded or waiver documented within one business day.",
    escalationLevel: "L2",
    whenDeviationAcceptable:
      "Customer explicitly declined photo proof and that is captured in the record.",
  },
  {
    id: "std_complete_open_issue",
    title: "Completed booking with open issue and no follow-up",
    scenarioSignature: "Completion signal while issues remain open without next action.",
    recommendedDecisionPath:
      "Re-open completion gate, document issue owner, schedule customer comms or service recovery.",
    expectedOwnershipPosture: "Quality lead owns until closure criteria met",
    followUpExpectation: "Issue transitioned to closed or tracked recovery within SLA.",
    escalationLevel: "L2",
    whenDeviationAcceptable:
      "Issue is cosmetic, customer waived in writing, and waiver is attached.",
  },
  {
    id: "std_overloaded_supervision",
    title: "Overloaded FO with elevated supervision",
    scenarioSignature: "Overload flag with supervision tier already elevated.",
    recommendedDecisionPath:
      "Reduce inbound assignments, pair with coach, and require daily checkpoint until load normalizes.",
    expectedOwnershipPosture: "Capacity lead + FO coach",
    followUpExpectation: "Load metrics back to steady band within agreed window.",
    escalationLevel: "L3",
    whenDeviationAcceptable:
      "Short burst overload with documented customer-approved deferrals.",
  },
  {
    id: "std_severity_comm_gap",
    title: "High-severity outcome with communication gap",
    scenarioSignature: "Quality drag elevated without aligned customer/admin comms trail.",
    recommendedDecisionPath:
      "Mandate structured customer update, align FO narrative, and attach resolution plan.",
    expectedOwnershipPosture: "Ops lead on comms; FO executes",
    followUpExpectation: "Customer-facing update logged before next milestone.",
    escalationLevel: "L3",
    whenDeviationAcceptable:
      "Customer unreachable with documented attempts meeting attempt policy.",
  },
  {
    id: "std_rework_compressed",
    title: "Rework-heavy FO in compressed window",
    scenarioSignature: "Multiple reworks with compressed schedule context.",
    recommendedDecisionPath:
      "Insert quality pause, swap crew if needed, and require supervisor sign-off on next visit.",
    expectedOwnershipPosture: "Quality lead sign-off",
    followUpExpectation: "Next visit checklist completed and stored.",
    escalationLevel: "L2",
    whenDeviationAcceptable:
      "Reworks stem from customer scope change with signed change order.",
  },
  {
    id: "std_completion_review_lag",
    title: "Completion review required with documentation lag",
    scenarioSignature: "Completion review pending plus documentation drift.",
    recommendedDecisionPath:
      "Block payout triggers until documentation pack is complete or waived per policy.",
    expectedOwnershipPosture: "Admin reviewer owns queue position",
    followUpExpectation: "Documentation complete or policy waiver recorded.",
    escalationLevel: "L1",
    whenDeviationAcceptable: "Automated documentation import pending <24h with ticket.",
  },
  {
    id: "std_policy_no_owner",
    title: "Policy hit with no owner action",
    scenarioSignature: "Policy violation flagged without owner assignment.",
    recommendedDecisionPath:
      "Assign owner immediately, document corrective plan, and link to playbook step.",
    expectedOwnershipPosture: "Policy owner from roster",
    followUpExpectation: "Owner acknowledgment + dated next step in system.",
    escalationLevel: "L2",
    whenDeviationAcceptable: "Duplicate automated flag already cleared by playbook.",
  },
  {
    id: "std_stale_ack",
    title: "Stale acknowledged issue with no update",
    scenarioSignature: "Acknowledged issue aging without progress signal.",
    recommendedDecisionPath:
      "Force status refresh, customer touchpoint or internal escalation per aging ladder.",
    expectedOwnershipPosture: "Supervisor reclaims thread",
    followUpExpectation: "Fresh timestamped update within SLA.",
    escalationLevel: "L2",
    whenDeviationAcceptable: "Waiting on third-party with documented dependency ticket.",
  },
];
