#!/usr/bin/env bash
set -u

ROOT_DIR="${ROOT_DIR:-$HOME/Desktop/servelink}"
API_DIR="$ROOT_DIR/services/api"
WEB_DIR="$ROOT_DIR/apps/web"
REPORT_DIR="$ROOT_DIR/tools/validation/reports"

TIMESTAMP="$(date +"%Y%m%d-%H%M%S")"
REPORT_FILE="$REPORT_DIR/validation-report-$TIMESTAMP.md"
JSON_REPORT_FILE="$REPORT_DIR/validation-report-$TIMESTAMP.json"
RAW_LOG_FILE="$REPORT_DIR/validation-raw-$TIMESTAMP.log"

API_BASE_URL="${API_BASE_URL:-http://localhost:3001}"
WEB_BASE_URL="${WEB_BASE_URL:-http://localhost:3000}"

ADMIN_EMAIL="${ADMIN_EMAIL:-admin@servelink.local}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Passw0rd!}"

TEST_BOOKING_ID="${TEST_BOOKING_ID:-}"
TARGET_FO_ID="${TARGET_FO_ID:-}"

VALIDATION_MODE="${VALIDATION_MODE:-full}"
FAIL_FAST="${FAIL_FAST:-0}"

RUN_WRITE_SMOKE="${RUN_WRITE_SMOKE:-1}"
RUN_API_TESTS="${RUN_API_TESTS:-}"
RUN_WEB_BUILD="${RUN_WEB_BUILD:-}"
RUN_API_BUILD="${RUN_API_BUILD:-1}"

mkdir -p "$REPORT_DIR"

if [ "$VALIDATION_MODE" = "fast" ]; then
  RUN_API_TESTS="${RUN_API_TESTS:-0}"
  RUN_WEB_BUILD="${RUN_WEB_BUILD:-0}"
else
  RUN_API_TESTS="${RUN_API_TESTS:-1}"
  RUN_WEB_BUILD="${RUN_WEB_BUILD:-1}"
fi

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

PASS_ITEMS=()
FAIL_ITEMS=()
WARN_ITEMS=()

PHASE_NAMES=()
PHASE_DURATIONS=()

CURRENT_PHASE=""
CURRENT_PHASE_START=0

PHASE_PASS_ITEMS=()
PHASE_FAIL_ITEMS=()
PHASE_WARN_ITEMS=()

PHASE_PASS_MAP=()
PHASE_FAIL_MAP=()
PHASE_WARN_MAP=()

LAST_RESPONSE_BODY_FILE="/tmp/servelink_validation_body.txt"
ACTION_RESULTS=()

log() {
  echo "$@" | tee -a "$RAW_LOG_FILE"
}

json_escape() {
  node -e '
const input = process.argv[1] ?? "";
process.stdout.write(JSON.stringify(input));
' "$1"
}

mark_failure_and_maybe_exit() {
  if [ "$FAIL_FAST" = "1" ]; then
    end_phase
    write_report
    write_json_report
    log ""
    log "Fail-fast enabled. Exiting immediately after first failure."
    exit 1
  fi
}

start_phase() {
  CURRENT_PHASE="$1"
  CURRENT_PHASE_START="$(date +%s)"
  PHASE_NAMES+=("$CURRENT_PHASE")
  PHASE_PASS_ITEMS=()
  PHASE_FAIL_ITEMS=()
  PHASE_WARN_ITEMS=()

  log ""
  log "============================================================"
  log "$CURRENT_PHASE"
  log "============================================================"
}

end_phase() {
  local now
  now="$(date +%s)"
  local duration=$((now - CURRENT_PHASE_START))
  PHASE_DURATIONS+=("$duration")
  PHASE_PASS_MAP+=("$(printf '%s\n' "${PHASE_PASS_ITEMS[@]-}")")
  PHASE_FAIL_MAP+=("$(printf '%s\n' "${PHASE_FAIL_ITEMS[@]-}")")
  PHASE_WARN_MAP+=("$(printf '%s\n' "${PHASE_WARN_ITEMS[@]-}")")
  log "PHASE DURATION: ${duration}s"
}

add_pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  PASS_ITEMS+=("$1")
  PHASE_PASS_ITEMS+=("$1")
  log "PASS: $1"
}

add_fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  FAIL_ITEMS+=("$1")
  PHASE_FAIL_ITEMS+=("$1")
  log "FAIL: $1"
  mark_failure_and_maybe_exit
}

add_warn() {
  WARN_COUNT=$((WARN_COUNT + 1))
  WARN_ITEMS+=("$1")
  PHASE_WARN_ITEMS+=("$1")
  log "WARN: $1"
}

require_path() {
  local path="$1"
  local label="$2"

  if [ -e "$path" ]; then
    add_pass "$label exists at $path"
  else
    add_fail "$label missing at $path"
  fi
}

require_command() {
  local cmd="$1"
  if command -v "$cmd" >/dev/null 2>&1; then
    add_pass "Command available: $cmd"
  else
    add_fail "Command missing: $cmd"
  fi
}

run_and_capture() {
  local title="$1"
  shift
  log ""
  log "--- RUNNING: $title ---"
  log "CMD: $*"
  "$@" >>"$RAW_LOG_FILE" 2>&1
  local status=$?
  log "--- EXIT CODE: $status ($title) ---"
  return $status
}

http_status() {
  local method="$1"
  local url="$2"
  shift 2
  curl -L -sS -o "$LAST_RESPONSE_BODY_FILE" -w "%{http_code}" -X "$method" "$url" "$@"
}

extract_json_field() {
  local file="$1"
  local field="$2"
  node -e '
const fs = require("fs");
const file = process.argv[1];
const field = process.argv[2];
try {
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  const value = field.split(".").reduce((acc, key) => acc?.[key], json);
  if (value === undefined || value === null) process.exit(2);
  process.stdout.write(String(value));
} catch {
  process.exit(1);
}
' "$file" "$field"
}

record_http_body() {
  local label="$1"
  log "--- HTTP BODY ($label) ---"
  if [ -f "$LAST_RESPONSE_BODY_FILE" ]; then
    cat "$LAST_RESPONSE_BODY_FILE" | tee -a "$RAW_LOG_FILE"
    log ""
  else
    log "No body file found."
  fi
  log "--- END HTTP BODY ($label) ---"
}

record_action_result() {
  local action="$1"
  local status="$2"
  local outcome="$3"
  local detail="$4"
  ACTION_RESULTS+=("$action|$status|$outcome|$detail")
}

seed_admin_user() {
  (
    cd "$API_DIR" && ADMIN_EMAIL="$ADMIN_EMAIL" ADMIN_PASSWORD="$ADMIN_PASSWORD" node -e '
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

(async () => {
  const db = new PrismaClient();
  const email = process.env.ADMIN_EMAIL || "admin@servelink.local";
  const password = process.env.ADMIN_PASSWORD || "Passw0rd!";
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await db.user.upsert({
    where: { email },
    update: { passwordHash, role: "admin" },
    create: { email, passwordHash, role: "admin" },
  });

  console.log(JSON.stringify({ ok: true, email, id: user.id, role: user.role }));
  await db.$disconnect();
})();
' >>"$RAW_LOG_FILE" 2>&1
  )
}

discover_target_fo_id() {
  (
    cd "$API_DIR" && TEST_BOOKING_ID="$TEST_BOOKING_ID" node -e '
const { PrismaClient } = require("@prisma/client");

(async () => {
  const db = new PrismaClient();
  const bookingId = process.env.TEST_BOOKING_ID;

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: { foId: true }
  });

  if (booking?.foId) {
    process.stdout.write(String(booking.foId));
    await db.$disconnect();
    return;
  }

  // Booking.foId references FranchiseOwner.id (not User.id)
  const fo = await db.franchiseOwner.findFirst({
    select: { id: true },
    orderBy: { createdAt: "asc" }
  });

  if (fo?.id) {
    process.stdout.write(String(fo.id));
  }

  await db.$disconnect();
})();
'
  )
}

write_json_array_from_lines() {
  local input="$1"
  if [ -z "$input" ]; then
    echo "[]"
    return
  fi

  node -e '
const raw = process.argv[1] ?? "";
const arr = raw.split("\n").filter(Boolean);
process.stdout.write(JSON.stringify(arr));
' "$input"
}

write_action_results_json() {
  if [ ${#ACTION_RESULTS[@]} -eq 0 ]; then
    echo "[]"
    return
  fi

  printf '%s\n' "${ACTION_RESULTS[@]}" | node -e '
const fs = require("fs");
const lines = fs.readFileSync(0, "utf8").split("\n").filter(Boolean);
const arr = lines.map((line) => {
  const [action, status, outcome, detail] = line.split("|");
  return { action, status, outcome, detail };
});
process.stdout.write(JSON.stringify(arr));
'
}

write_report() {
  {
    echo "# Servelink Validation Report"
    echo ""
    echo "- Generated: $(date)"
    echo "- Mode: $VALIDATION_MODE"
    echo "- Fail-fast: $FAIL_FAST"
    echo "- API base URL: $API_BASE_URL"
    echo "- Web base URL: $WEB_BASE_URL"
    echo "- Admin email: $ADMIN_EMAIL"
    echo "- Test booking ID: ${TEST_BOOKING_ID:-not provided}"
    echo "- Target FO ID: ${TARGET_FO_ID:-not provided}"
    echo "- Write smoke enabled: $RUN_WRITE_SMOKE"
    echo "- API build enabled: $RUN_API_BUILD"
    echo "- API tests enabled: $RUN_API_TESTS"
    echo "- Web build enabled: $RUN_WEB_BUILD"
    echo ""
    echo "## Summary"
    echo ""
    echo "- Pass: $PASS_COUNT"
    echo "- Fail: $FAIL_COUNT"
    echo "- Warn: $WARN_COUNT"
    echo ""
    echo "## Phase timings"
    echo ""
    for i in "${!PHASE_NAMES[@]}"; do
      echo "- ${PHASE_NAMES[$i]}: ${PHASE_DURATIONS[$i]:-0}s"
    done
    echo ""
    echo "## Action results"
    echo ""
    if [ ${#ACTION_RESULTS[@]} -eq 0 ]; then
      echo "- None"
    else
      for line in "${ACTION_RESULTS[@]}"; do
        IFS='|' read -r action status outcome detail <<< "$line"
        echo "- $action — status $status — $outcome — $detail"
      done
    fi
    echo ""
    echo "## Passes"
    echo ""
    if [ ${#PASS_ITEMS[@]} -eq 0 ]; then
      echo "- None"
    else
      for item in "${PASS_ITEMS[@]}"; do
        echo "- $item"
      done
    fi
    echo ""
    echo "## Failures"
    echo ""
    if [ ${#FAIL_ITEMS[@]} -eq 0 ]; then
      echo "- None"
    else
      for item in "${FAIL_ITEMS[@]}"; do
        echo "- $item"
      done
    fi
    echo ""
    echo "## Warnings"
    echo ""
    if [ ${#WARN_ITEMS[@]} -eq 0 ]; then
      echo "- None"
    else
      for item in "${WARN_ITEMS[@]}"; do
        echo "- $item"
      done
    fi
    echo ""
    echo "## Outputs"
    echo ""
    echo "- Markdown report: $REPORT_FILE"
    echo "- JSON report: $JSON_REPORT_FILE"
    echo "- Raw log: $RAW_LOG_FILE"
  } >"$REPORT_FILE"
}

write_json_report() {
  {
    echo "{"
    echo "  \"generatedAt\": $(json_escape "$(date)"),"
    echo "  \"mode\": $(json_escape "$VALIDATION_MODE"),"
    echo "  \"failFast\": $(json_escape "$FAIL_FAST"),"
    echo "  \"apiBaseUrl\": $(json_escape "$API_BASE_URL"),"
    echo "  \"webBaseUrl\": $(json_escape "$WEB_BASE_URL"),"
    echo "  \"adminEmail\": $(json_escape "$ADMIN_EMAIL"),"
    echo "  \"testBookingId\": $(json_escape "$TEST_BOOKING_ID"),"
    echo "  \"targetFoId\": $(json_escape "$TARGET_FO_ID"),"
    echo "  \"summary\": {"
    echo "    \"pass\": $PASS_COUNT,"
    echo "    \"fail\": $FAIL_COUNT,"
    echo "    \"warn\": $WARN_COUNT"
    echo "  },"
    echo "  \"actionResults\": $(write_action_results_json),"
    echo "  \"passes\": $(write_json_array_from_lines "$(printf '%s\n' "${PASS_ITEMS[@]-}")"),"
    echo "  \"failures\": $(write_json_array_from_lines "$(printf '%s\n' "${FAIL_ITEMS[@]-}")"),"
    echo "  \"warnings\": $(write_json_array_from_lines "$(printf '%s\n' "${WARN_ITEMS[@]-}")"),"
    echo "  \"phases\": ["
    for i in "${!PHASE_NAMES[@]}"; do
      sep=","
      if [ "$i" -eq $((${#PHASE_NAMES[@]} - 1)) ]; then sep=""; fi
      echo "    {"
      echo "      \"name\": $(json_escape "${PHASE_NAMES[$i]}"),"
      echo "      \"durationSeconds\": ${PHASE_DURATIONS[$i]:-0},"
      echo "      \"passes\": $(write_json_array_from_lines "${PHASE_PASS_MAP[$i]:-}"),"
      echo "      \"failures\": $(write_json_array_from_lines "${PHASE_FAIL_MAP[$i]:-}"),"
      echo "      \"warnings\": $(write_json_array_from_lines "${PHASE_WARN_MAP[$i]:-}")"
      echo "    }$sep"
    done
    echo "  ],"
    echo "  \"outputs\": {"
    echo "    \"markdownReportFile\": $(json_escape "$REPORT_FILE"),"
    echo "    \"jsonReportFile\": $(json_escape "$JSON_REPORT_FILE"),"
    echo "    \"rawLogFile\": $(json_escape "$RAW_LOG_FILE")"
    echo "  }"
    echo "}"
  } >"$JSON_REPORT_FILE"
}

post_dispatch_decision() {
  local action="$1"
  local rationale="$2"
  local extra_json="${3:-}"

  local body
  if [ -n "$extra_json" ]; then
    body="{\"bookingId\":\"$TEST_BOOKING_ID\",\"action\":\"$action\",\"submittedAt\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",\"submittedByRole\":\"admin\",\"source\":\"admin_booking_detail\",\"rationale\":\"$rationale\",$extra_json}"
  else
    body="{\"bookingId\":\"$TEST_BOOKING_ID\",\"action\":\"$action\",\"submittedAt\":\"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",\"submittedByRole\":\"admin\",\"source\":\"admin_booking_detail\",\"rationale\":\"$rationale\"}"
  fi

  http_status POST "$API_BASE_URL/api/v1/admin/dispatch-decisions" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    --data "$body"
}

ACCESS_TOKEN=""

start_phase "PHASE 1 — FILESYSTEM + COMMAND CHECKS"
require_path "$ROOT_DIR" "Repo root"
require_path "$API_DIR" "API app"
require_path "$WEB_DIR" "Web app"
require_path "$ROOT_DIR/tools/validation" "Validation tools folder"
require_command "node"
require_command "npm"
require_command "curl"
end_phase

start_phase "PHASE 2 — API + WEB REACHABILITY"
API_STATUS="$(http_status GET "$API_BASE_URL/docs")"
if [ "$API_STATUS" = "200" ]; then
  add_pass "API docs reachable at $API_BASE_URL/docs"
else
  add_fail "API docs not reachable at $API_BASE_URL/docs (status $API_STATUS)"
  record_http_body "api-docs"
fi

WEB_STATUS="$(http_status GET "$WEB_BASE_URL/admin/auth")"
if [ "$WEB_STATUS" = "200" ]; then
  add_pass "Web admin auth reachable at $WEB_BASE_URL/admin/auth"
else
  add_fail "Web admin auth not reachable at $WEB_BASE_URL/admin/auth (status $WEB_STATUS)"
  record_http_body "web-admin-auth"
fi
end_phase

start_phase "PHASE 3 — ADMIN USER SEED / RESET"
if seed_admin_user; then
  add_pass "Admin user seeded/reset successfully"
else
  add_fail "Admin user seed/reset failed"
fi
end_phase

start_phase "PHASE 4 — AUTH LOGIN VALIDATION"
LOGIN_STATUS="$(http_status POST "$API_BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  --data "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")"

if [ "$LOGIN_STATUS" = "201" ] || [ "$LOGIN_STATUS" = "200" ]; then
  add_pass "Admin login endpoint returned success ($LOGIN_STATUS)"
else
  add_fail "Admin login endpoint failed ($LOGIN_STATUS)"
  record_http_body "auth-login"
fi

if ACCESS_TOKEN="$(extract_json_field "$LAST_RESPONSE_BODY_FILE" accessToken 2>/dev/null)"; then
  add_pass "Access token returned by login endpoint"
else
  add_fail "Access token missing from login response"
  record_http_body "auth-login-token"
fi
end_phase

start_phase "PHASE 5 — LIVE ADMIN SCREEN DATA ENDPOINTS"
if [ -n "$ACCESS_TOKEN" ]; then
  EXCEPTIONS_STATUS="$(http_status GET "$API_BASE_URL/api/v1/admin/dispatch/exceptions?limit=10" \
    -H "Authorization: Bearer $ACCESS_TOKEN")"
  if [ "$EXCEPTIONS_STATUS" = "200" ]; then
    add_pass "Dispatch exceptions endpoint returned 200"
  else
    add_fail "Dispatch exceptions endpoint failed ($EXCEPTIONS_STATUS)"
    record_http_body "dispatch-exceptions"
  fi

  ACTIVITY_STATUS="$(http_status GET "$API_BASE_URL/api/v1/admin/activity?limit=10" \
    -H "Authorization: Bearer $ACCESS_TOKEN")"
  if [ "$ACTIVITY_STATUS" = "200" ]; then
    add_pass "Admin activity endpoint returned 200"
  else
    add_fail "Admin activity endpoint failed ($ACTIVITY_STATUS)"
    record_http_body "admin-activity"
  fi
else
  add_fail "Skipped admin screen data validation because access token was unavailable"
fi
end_phase

start_phase "PHASE 6 — BOOKING-LEVEL ADMIN READ MODELS"
if [ -n "$ACCESS_TOKEN" ] && [ -n "$TEST_BOOKING_ID" ]; then
  BOOKING_STATUS="$(http_status GET "$API_BASE_URL/api/v1/bookings/$TEST_BOOKING_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN")"
  if [ "$BOOKING_STATUS" = "200" ]; then
    add_pass "Booking detail endpoint returned 200 for $TEST_BOOKING_ID"
  else
    add_fail "Booking detail endpoint failed for $TEST_BOOKING_ID ($BOOKING_STATUS)"
    record_http_body "booking-detail"
  fi

  EXCEPTION_DETAIL_STATUS="$(http_status GET "$API_BASE_URL/api/v1/bookings/$TEST_BOOKING_ID/dispatch-exception-detail" \
    -H "Authorization: Bearer $ACCESS_TOKEN")"
  if [ "$EXCEPTION_DETAIL_STATUS" = "200" ]; then
    add_pass "Dispatch exception detail returned 200 for $TEST_BOOKING_ID"
  else
    add_fail "Dispatch exception detail failed for $TEST_BOOKING_ID ($EXCEPTION_DETAIL_STATUS)"
    record_http_body "dispatch-exception-detail"
  fi

  TIMELINE_STATUS="$(http_status GET "$API_BASE_URL/api/v1/bookings/$TEST_BOOKING_ID/dispatch-timeline" \
    -H "Authorization: Bearer $ACCESS_TOKEN")"
  if [ "$TIMELINE_STATUS" = "200" ]; then
    add_pass "Dispatch timeline returned 200 for $TEST_BOOKING_ID"
  else
    add_fail "Dispatch timeline failed for $TEST_BOOKING_ID ($TIMELINE_STATUS)"
    record_http_body "dispatch-timeline"
  fi

  EXPLAINER_STATUS="$(http_status GET "$API_BASE_URL/api/v1/bookings/$TEST_BOOKING_ID/dispatch-explainer" \
    -H "Authorization: Bearer $ACCESS_TOKEN")"
  if [ "$EXPLAINER_STATUS" = "200" ]; then
    add_pass "Dispatch explainer returned 200 for $TEST_BOOKING_ID"
  else
    add_fail "Dispatch explainer failed for $TEST_BOOKING_ID ($EXPLAINER_STATUS)"
    record_http_body "dispatch-explainer"
  fi
else
  add_warn "Skipped booking-level admin read models because TEST_BOOKING_ID was not provided"
fi
end_phase

start_phase "PHASE 7 — BOOKING-LEVEL WRITE SMOKE"
if [ "$RUN_WRITE_SMOKE" != "1" ]; then
  add_warn "Skipped write smoke because RUN_WRITE_SMOKE=$RUN_WRITE_SMOKE"
elif [ -z "$ACCESS_TOKEN" ] || [ -z "$TEST_BOOKING_ID" ]; then
  add_warn "Skipped write smoke because access token or TEST_BOOKING_ID was unavailable"
else
  NOTE_STATUS="$(http_status POST "$API_BASE_URL/api/v1/bookings/$TEST_BOOKING_ID/dispatch-operator-notes" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    --data '{"note":"Validation harness operator note smoke test."}')"
  if [ "$NOTE_STATUS" = "201" ] || [ "$NOTE_STATUS" = "200" ]; then
    add_pass "Operator note write succeeded for $TEST_BOOKING_ID"
    record_action_result "operator_note" "$NOTE_STATUS" "pass" "operator note write succeeded"
  else
    add_fail "Operator note write failed for $TEST_BOOKING_ID ($NOTE_STATUS)"
    record_action_result "operator_note" "$NOTE_STATUS" "fail" "operator note write failed"
    record_http_body "operator-note"
  fi

  HOLD_STATUS="$(post_dispatch_decision "hold" "Validation harness applied admin hold for smoke verification.")"
  if [ "$HOLD_STATUS" = "201" ] || [ "$HOLD_STATUS" = "200" ]; then
    add_pass "Hold decision write succeeded for $TEST_BOOKING_ID"
    record_action_result "hold" "$HOLD_STATUS" "pass" "hold decision write succeeded"
  else
    add_fail "Hold decision write failed for $TEST_BOOKING_ID ($HOLD_STATUS)"
    record_action_result "hold" "$HOLD_STATUS" "fail" "hold decision write failed"
    record_http_body "hold-decision"
  fi

  REVIEW_STATUS="$(post_dispatch_decision "request_review" "Validation harness requested dispatch review for smoke verification.")"
  if [ "$REVIEW_STATUS" = "201" ] || [ "$REVIEW_STATUS" = "200" ]; then
    add_pass "Request review decision write succeeded for $TEST_BOOKING_ID"
    record_action_result "request_review" "$REVIEW_STATUS" "pass" "request review decision write succeeded"
  else
    add_fail "Request review decision write failed for $TEST_BOOKING_ID ($REVIEW_STATUS)"
    record_action_result "request_review" "$REVIEW_STATUS" "fail" "request review decision write failed"
    record_http_body "request-review-decision"
  fi

  if [ -z "$TARGET_FO_ID" ]; then
    TARGET_FO_ID="$(discover_target_fo_id)"
    if [ -n "$TARGET_FO_ID" ]; then
      add_pass "Auto-discovered TARGET_FO_ID=$TARGET_FO_ID"
    else
      add_warn "Skipped approve/reassign smoke because TARGET_FO_ID could not be auto-discovered"
    fi
  fi

  if [ -n "$TARGET_FO_ID" ]; then
    APPROVE_STATUS="$(post_dispatch_decision "approve_assignment" "Validation harness approved assignment for smoke verification." "\"targetFoId\":\"$TARGET_FO_ID\"")"
    if [ "$APPROVE_STATUS" = "201" ] || [ "$APPROVE_STATUS" = "200" ]; then
      add_pass "Approve assignment decision write succeeded for $TEST_BOOKING_ID using $TARGET_FO_ID"
      record_action_result "approve_assignment" "$APPROVE_STATUS" "pass" "approve assignment succeeded"
    else
      add_fail "Approve assignment decision write failed for $TEST_BOOKING_ID using $TARGET_FO_ID ($APPROVE_STATUS)"
      record_action_result "approve_assignment" "$APPROVE_STATUS" "fail" "approve assignment failed"
      record_http_body "approve-assignment-decision"
    fi

    REASSIGN_STATUS="$(post_dispatch_decision "reassign" "Validation harness requested reassignment for smoke verification." "\"targetFoId\":\"$TARGET_FO_ID\"")"
    if [ "$REASSIGN_STATUS" = "201" ] || [ "$REASSIGN_STATUS" = "200" ]; then
      add_pass "Reassign decision write succeeded for $TEST_BOOKING_ID using $TARGET_FO_ID"
      record_action_result "reassign" "$REASSIGN_STATUS" "pass" "reassign succeeded"
    else
      add_fail "Reassign decision write failed for $TEST_BOOKING_ID using $TARGET_FO_ID ($REASSIGN_STATUS)"
      record_action_result "reassign" "$REASSIGN_STATUS" "fail" "reassign failed"
      record_http_body "reassign-decision"
    fi
  fi
fi
end_phase

start_phase "PHASE 8 — BACKEND BUILD + TESTS"
if [ "$RUN_API_BUILD" = "1" ]; then
  if run_and_capture "API build" bash -lc "cd \"$API_DIR\" && npm run build"; then
    add_pass "API build passed"
  else
    add_fail "API build failed"
  fi
else
  add_warn "Skipped API build because RUN_API_BUILD=$RUN_API_BUILD"
fi

if [ "$RUN_API_TESTS" = "1" ]; then
  if run_and_capture "API tests" bash -lc "cd \"$API_DIR\" && npm test"; then
    add_pass "API tests passed"
  else
    add_fail "API tests failed"
  fi
else
  add_warn "Skipped API tests because RUN_API_TESTS=$RUN_API_TESTS"
fi
end_phase

start_phase "PHASE 9 — WEB BUILD"
if [ "$RUN_WEB_BUILD" = "1" ]; then
  if run_and_capture "Web build" bash -lc "cd \"$WEB_DIR\" && npm run build"; then
    add_pass "Web build passed"
  else
    add_fail "Web build failed"
  fi
else
  add_warn "Skipped web build because RUN_WEB_BUILD=$RUN_WEB_BUILD"
fi
end_phase

start_phase "PHASE 10 — RESULT"
write_report
write_json_report

log ""
log "Validation complete."
log "Report: $REPORT_FILE"
log "JSON report: $JSON_REPORT_FILE"
log "Raw log: $RAW_LOG_FILE"
end_phase

if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
fi

exit 0
