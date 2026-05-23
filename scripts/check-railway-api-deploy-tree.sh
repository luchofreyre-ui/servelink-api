#!/usr/bin/env bash
# Fail fast before `railway up`: contaminated API/prisma/package paths or
# missing runtime metadata proof inputs cannot ship.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

FAIL=0

UNTRACKED_SRC_PRISMA="$(
  git ls-files --others --exclude-standard -- services/api/src services/api/prisma 2>/dev/null || true
)"

CHANGED_CRITICAL="$(
  git diff --name-only HEAD -- \
    services/api/src \
    services/api/prisma \
    services/api/package.json \
    services/api/package-lock.json \
    package.json \
    package-lock.json 2>/dev/null || true
)"

WEB_UNTRACKED="$(git ls-files --others --exclude-standard -- apps/web 2>/dev/null || true)"
WEB_CHANGED="$(git diff --name-only HEAD -- apps/web 2>/dev/null || true)"

EXPECTED_SHA="$(git rev-parse origin/main 2>/dev/null || git rev-parse HEAD)"
LOCAL_HEAD="$(git rev-parse HEAD)"
CLI_METADATA_VAR=""
CLI_METADATA_VALUE=""

if [[ -n "${GIT_COMMIT_SHA:-}" ]]; then
  CLI_METADATA_VAR="GIT_COMMIT_SHA"
  CLI_METADATA_VALUE="$GIT_COMMIT_SHA"
elif [[ -n "${COMMIT_SHA:-}" ]]; then
  CLI_METADATA_VAR="COMMIT_SHA"
  CLI_METADATA_VALUE="$COMMIT_SHA"
fi

echo "=== Railway API deploy tree check ==="

if [[ -n "$UNTRACKED_SRC_PRISMA" ]]; then
  echo "FAIL: untracked paths under services/api/src or services/api/prisma:"
  printf '%s\n' "$UNTRACKED_SRC_PRISMA" | sed 's/^/  /'
  FAIL=1
fi

if [[ -n "$CHANGED_CRITICAL" ]]; then
  echo "FAIL: tracked paths modified vs HEAD (commit or revert before railway up):"
  printf '%s\n' "$CHANGED_CRITICAL" | sed 's/^/  /'
  FAIL=1
fi

if [[ -n "$WEB_UNTRACKED" || -n "$WEB_CHANGED" ]]; then
  echo "WARN: apps/web has untracked or modified files — not an API compile blocker; review separately for web deploys:"
  if [[ -n "$WEB_UNTRACKED" ]]; then
    printf '%s\n' "$WEB_UNTRACKED" | sed 's/^/  untracked: /'
  fi
  if [[ -n "$WEB_CHANGED" ]]; then
    printf '%s\n' "$WEB_CHANGED" | sed 's/^/  modified: /'
  fi
fi

if [[ "$LOCAL_HEAD" != "$EXPECTED_SHA" ]]; then
  echo "FAIL: HEAD does not match origin/main for a CLI API deploy."
  echo "      Fetch main and deploy only from the exact origin/main SHA."
  echo "      expected origin/main short SHA: ${EXPECTED_SHA:0:7}"
  echo "      local HEAD short SHA: ${LOCAL_HEAD:0:7}"
  FAIL=1
fi

if [[ -z "$CLI_METADATA_VAR" ]]; then
  echo "FAIL: CLI API deploy metadata is missing."
  echo "      Provide GIT_COMMIT_SHA or COMMIT_SHA equal to origin/main before railway up."
  echo "      GitHub-connected Railway deploys should rely on RAILWAY_GIT_COMMIT_SHA instead of this CLI path."
  FAIL=1
elif [[ "$CLI_METADATA_VALUE" != "$EXPECTED_SHA" ]]; then
  echo "FAIL: $CLI_METADATA_VAR does not match origin/main."
  echo "      expected origin/main short SHA: ${EXPECTED_SHA:0:7}"
  echo "      provided $CLI_METADATA_VAR short SHA: ${CLI_METADATA_VALUE:0:7}"
  FAIL=1
else
  echo "PASS: $CLI_METADATA_VAR matches origin/main short SHA ${EXPECTED_SHA:0:7}."
  echo "      Ensure the deploy path carries $CLI_METADATA_VAR into the API runtime environment."
fi

if [[ -z "${BUILD_TIME:-}" ]]; then
  echo "WARN: BUILD_TIME is not set; API version buildTime will be unknown."
  echo "      BUILD_TIME improves evidence quality but is not a substitute for SHA parity."
fi

if [[ "$FAIL" -ne 0 ]]; then
  echo "FAIL: resolve API deploy-critical issues above before railway up."
  exit 1
fi

echo "PASS: services/api/src, services/api/prisma, and package lockfiles match HEAD with no stray untracked files."
echo "      (Untracked services/api/test/* does not block this check.)"
exit 0
