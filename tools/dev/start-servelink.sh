#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${HOME}/Desktop/servelink"
API_DIR="${ROOT_DIR}/services/api"
WEB_DIR="${ROOT_DIR}/apps/web"

API_PORT=3001
WEB_PORT=3000

kill_port() {
  local port="$1"
  local pids
  pids="$(lsof -ti tcp:${port} || true)"
  if [[ -n "${pids}" ]]; then
    echo "Killing processes on port ${port}: ${pids}"
    kill -9 ${pids} || true
    sleep 1
  fi
}

open_terminal_tab() {
  local cmd="$1"
  osascript <<OSA
tell application "Terminal"
  activate
  tell application "System Events" to keystroke "t" using command down
  do script "$cmd" in selected tab of the front window
end tell
OSA
}

wait_for_url() {
  local url="$1"
  local label="$2"
  local attempts="${3:-60}"

  echo "Waiting for ${label} at ${url} ..."
  for ((i=1; i<=attempts; i++)); do
    if curl -sSfL "$url" >/dev/null 2>&1; then
      echo "${label} is ready."
      return 0
    fi
    sleep 1
  done

  echo "Timed out waiting for ${label} at ${url}"
  return 1
}

echo "Root: ${ROOT_DIR}"
echo "API:  ${API_DIR}"
echo "WEB:  ${WEB_DIR}"

if [[ ! -d "${API_DIR}" ]]; then
  echo "Missing API dir: ${API_DIR}"
  exit 1
fi

if [[ ! -d "${WEB_DIR}" ]]; then
  echo "Missing web dir: ${WEB_DIR}"
  exit 1
fi

kill_port "${API_PORT}"
kill_port "${WEB_PORT}"

API_CMD="cd '${API_DIR}' && npm run dev"
WEB_CMD="cd '${WEB_DIR}' && npm run dev"

echo "Starting API in a new Terminal tab..."
open_terminal_tab "${API_CMD}"

wait_for_url "http://localhost:${API_PORT}/api/v1/health" "API" 90

echo "Starting web in a new Terminal tab..."
open_terminal_tab "${WEB_CMD}"

wait_for_url "http://localhost:${WEB_PORT}" "web app" 90

echo
echo "Servelink is up:"
echo "  API: http://localhost:${API_PORT}"
echo "  WEB: http://localhost:${WEB_PORT}"
echo "  Admin: http://localhost:${WEB_PORT}/admin/auth"
