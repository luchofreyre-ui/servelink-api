#!/usr/bin/env bash
# Fail fast before `railway up`: contaminated API/prisma/package paths cannot ship.
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

if [[ "$FAIL" -ne 0 ]]; then
  echo "FAIL: resolve API deploy-critical issues above before railway up."
  exit 1
fi

echo "PASS: services/api/src, services/api/prisma, and package lockfiles match HEAD with no stray untracked files."
echo "      (Untracked services/api/test/* does not block this check.)"
exit 0
