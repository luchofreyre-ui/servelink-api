#!/usr/bin/env bash
# Lightweight guardrail: required governance artifacts exist and retain anchor content.
# Does not parse Markdown deeply — intentional minimalism.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REGISTRY="docs/governance/ARCHITECTURE_PRIMITIVE_REGISTRY_V1.md"
PROTOCOL="docs/governance/PHASE_0_AND_PRIMITIVE_CLASSIFICATION_V1.md"
INDEX="docs/governance/README.md"

die() {
  echo "check-architecture-governance-v1: $*" >&2
  exit 1
}

for f in "$REGISTRY" "$PROTOCOL" "$INDEX"; do
  [[ -f "$f" ]] || die "missing required file: $f"
done

grep -q "OperationalAnalyticsRefreshRun" "$REGISTRY" || die "registry missing OperationalAnalyticsRefreshRun anchor"
grep -q "CronRunLedger" "$REGISTRY" || die "registry missing CronRunLedger anchor"
grep -q "WorkflowExecution" "$REGISTRY" || die "registry missing WorkflowExecution anchor"

grep -q "REUSE_EXISTING_PRIMITIVE" "$PROTOCOL" || die "protocol missing classification REUSE_EXISTING_PRIMITIVE"
grep -q "STOP_CONFLICTING_AUTHORITIES" "$PROTOCOL" || die "protocol missing STOP_CONFLICTING_AUTHORITIES"
grep -q "Phase 0" "$PROTOCOL" || die "protocol missing Phase 0 reference"

echo "OK — governance docs present (architecture primitive registry + Phase 0 protocol)."
