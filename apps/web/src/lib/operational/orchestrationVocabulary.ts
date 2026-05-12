/**
 * Phase 18 — shared orchestration language across admin / FO / customer surfaces.
 * Customers remain on redacted digest copy; admin strips use the same posture semantics.
 */
export const ORCHESTRATION_UX = {
  coordinationCardTitle: "Operational coordination",
  coordinationCardSubtitle:
    "Servelink records governed operational signals after deliveries commit — nothing here auto-changes your booking or dispatches crews.",
  portfolioStripTitle: "Portfolio orchestration (deterministic)",
  portfolioStripSubtitle:
    "Snapshot counts across workflows — not prioritized or auto-routed.",
  timingRailTitle: "Orchestration timing (read-only)",
  timingRailSubtitle:
    "Wake schedules are deterministic — nothing here auto-approves or changes bookings.",
  recordedStepsTitle: "Recorded steps (latest run)",
  policySnapshotTitle: "Operational policy snapshot (deterministic)",
  approvalsOnFileTitle: "Approvals on file",
  deterministicRecommendationsTitle: "What to watch next (deterministic)",
  trustBoundaryTitle: "Trust boundary",
  trustBoundaryBody:
    "Recommendations explain persisted signals — they do not execute transitions, payments, or dispatch. Customers and crews still act only through explicit Servelink-controlled flows.",
  operationalIntelligenceStripTitle: "Operational intelligence (deterministic)",
  operationalIntelligenceStripSubtitle:
    "Live counts plus optional warehouse snapshots — nothing here auto-optimizes routing or billing.",
  approvalQueueStripTitle: "Approval queue posture (deterministic)",
  approvalQueueStripSubtitle:
    "Aggregates only — no bulk approve; review bookings individually.",
  orchestrationDryRunTitle: "Orchestration dry-run (simulation)",
  orchestrationDryRunSubtitle:
    "Deterministic preview of governance posture and digest signals for the selected workflow execution.",
  orchestrationDryRunGovernanceRail:
    "Simulation only — nothing here executes workflows, booking transitions, dispatch, billing, or customer-facing automation.",
  orchestrationGuidedActivationTitle: "Guided orchestration activation",
  orchestrationGuidedActivationSubtitle:
    "Register → second-operator approve → approver invoke. Booking transitions still flow through the existing guarded adapter only after both human steps.",
  orchestrationGuidedActivationRail:
    "Two-operator separation by default (approver cannot be the registrant unless ALLOW_ORCHESTRATION_ACTIVATION_SELF_APPROVE=1). Optional dry-run id enforces a completed simulation before invoke.",
  orchestrationSafetyPortfolioSubtitle:
    "Pressure mirrors — activations, failed dry-runs, simulation completions, and delivery posture (admin-only delivery rolls up globally).",
  orchestrationDeterministicSimulationTitle:
    "Deterministic orchestration safety simulation",
  orchestrationDeterministicSimulationSubtitle:
    "Runs read-only posture projections — persists scenario rows and safety evaluations; never invokes workflows, approvals, dispatch, or billing.",
  orchestrationDeterministicSimulationRail:
    "Governed simulation substrate — observe and explain only. No autonomous orchestration, optimization, or AI execution authority.",
  operationalLoadBalancingStripSubtitle:
    "Deterministic congestion mirrors plus sequencing hints — humans decide priority; nothing auto-reorders approvals or bookings.",
  prioritizationSignalsCardTitle: "Prioritization signals (explain-only)",
  prioritizationSignalsCardSubtitle:
    "Stable sort keys do not execute reordering — open approvals individually.",
  persistedBalancingCardTitle: "Persisted balancing batch",
  workflowCongestionCardTitle: "Workflow-type backlog mirrors",
  closedLoopOperationalIntelligenceCardTitle:
    "Closed-loop operational intelligence (persisted)",
  closedLoopOperationalIntelligenceCardSubtitle:
    "Warehouse refresh writes deterministic outcome samples, simulation-vs-live mirrors, and consecutive refresh deltas — humans interpret; nothing auto-optimizes.",
  operationalExperimentationCardTitle:
    "Operational experimentation & benchmarking (persisted)",
  operationalExperimentationCardSubtitle:
    "Deterministic experiment snapshots plus simulation benchmark anchors per warehouse refresh — disclosed metrics only; no hidden rankings or self-tuning.",
  operationalSimulationLabCardTitle:
    "Operational simulation lab + certification (persisted)",
  operationalSimulationLabCardSubtitle:
    "Lab frames mirror benchmarks; certifications gate observational trust; attribution rows are associative-only — never causal verdicts, never autonomous orchestration.",
  longitudinalOperationalIntelligenceCardTitle:
    "Longitudinal operational intelligence (persisted)",
  longitudinalOperationalIntelligenceCardSubtitle:
    "Consecutive-batch experiment lineage, counterfactual-safe contrast scaffolding, and replay inventory alignment — deterministic disclosures only; no autonomous optimization science.",
  operationalScienceCardTitle: "Operational science — cohorts & intervention sandboxes (persisted)",
  operationalScienceCardSubtitle:
    "Normalized cohort mirrors, non-executing activation observation frames, and deterministic evaluation labels per warehouse refresh — explainable comparators only; no dispatch, billing, hidden ranking, or self-tuning.",
  operationalInterventionValidityCardTitle:
    "Intervention governance — assignments & validity certification (persisted)",
  operationalInterventionValidityCardSubtitle:
    "Deterministic control vs comparison-mirror labels derived from sandbox frames, cohort inventory summaries, and balance/manifest certifications — not causal proof, not autonomous optimization, and not execution authority.",
  /** Phase 29 — paired with commandCenterVocabulary.ts for `/admin/ops` cognition copy */
  commandCenterCognitionCrossRefNote:
    "See command-center vocabulary for situation landmarks, attention zones, and severity labels on the admin operations command center.",
} as const;
