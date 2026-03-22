#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${ROOT_DIR:-$HOME/Desktop/servelink}"
API_DIR="$ROOT_DIR/services/api"
WEB_DIR="$ROOT_DIR/apps/web"

API_PORT="${API_PORT:-3001}"
WEB_PORT="${WEB_PORT:-3000}"

cleanup() {
  if [[ -n "${API_PID:-}" ]]; then
    kill "$API_PID" >/dev/null 2>&1 || true
  fi
  if [[ -n "${WEB_PID:-}" ]]; then
    kill "$WEB_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

echo ""
echo "============================================================"
echo "Servelink local boot"
echo "============================================================"
echo "Root: $ROOT_DIR"
echo "API:  $API_DIR"
echo "Web:  $WEB_DIR"
echo "API Port: $API_PORT"
echo "Web Port: $WEB_PORT"
echo ""

if [[ ! -d "$API_DIR" ]]; then
  echo "Missing API directory: $API_DIR"
  exit 1
fi

if [[ ! -d "$WEB_DIR" ]]; then
  echo "Missing web directory: $WEB_DIR"
  exit 1
fi

echo "Stopping any existing listeners on $API_PORT and $WEB_PORT ..."
for port in "$API_PORT" "$WEB_PORT"; do
  if lsof -ti ":$port" >/dev/null 2>&1; then
    lsof -ti ":$port" | xargs kill -9 >/dev/null 2>&1 || true
  fi
done

echo ""
echo "Starting API on port $API_PORT ..."
(
  cd "$API_DIR"
  PORT="$API_PORT" npm run dev
) &
API_PID=$!

echo "Starting web on port $WEB_PORT ..."
(
  cd "$WEB_DIR"
  npm run dev -- -p "$WEB_PORT"
) &
WEB_PID=$!

echo ""
echo "API PID: $API_PID"
echo "WEB PID: $WEB_PID"
echo ""
echo "Waiting for services to come up ..."
echo ""

wait_for_url() {
  local name="$1"
  local url="$2"
  local attempts=60
  local i=1

  until curl -sSfL "$url" >/dev/null 2>&1; do
    if [[ $i -ge $attempts ]]; then
      echo "$name did not become ready in time: $url"
      exit 1
    fi
    sleep 1
    i=$((i + 1))
  done

  echo "$name ready: $url"
}

wait_for_url "API" "http://localhost:$API_PORT/docs"
wait_for_url "Web" "http://localhost:$WEB_PORT/admin/auth"

echo ""
echo "============================================================"
echo "Servelink is up"
echo "============================================================"
echo "API docs:    http://localhost:$API_PORT/docs"
echo "Admin auth:  http://localhost:$WEB_PORT/admin/auth"
echo "Admin:       http://localhost:$WEB_PORT/admin"
echo ""

wait
