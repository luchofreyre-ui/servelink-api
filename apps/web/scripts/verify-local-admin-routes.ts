/**
 * Fails fast when the local Next server returns 5xx on key admin routes (same paths as the
 * validation sweep). Does not authenticate; matches the sweep’s “page loads” gate.
 *
 * Usage:
 *   npm run verify:local-admin-routes
 *   BASE_URL=http://127.0.0.1:3002 npm run verify:local-admin-routes
 */

const ROUTES = [
  "/admin/activity",
  "/admin/exceptions",
  "/admin/anomalies",
  "/admin/system-tests/incidents",
  "/admin/system-tests/compare",
  "/admin/system-tests/automation",
] as const;

function baseUrl(): string {
  const raw = process.env.BASE_URL?.trim() || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

async function check(path: string): Promise<{ path: string; ok: boolean; status: number; detail: string }> {
  const url = `${baseUrl()}${path}`;
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow" });
    const ok = res.status < 500;
    return {
      path,
      ok,
      status: res.status,
      detail: ok ? "ok" : `HTTP ${res.status}`,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { path, ok: false, status: 0, detail: msg };
  }
}

async function main(): Promise<void> {
  const base = baseUrl();
  console.log(`verify-local-admin-routes: GET ${base} (+ ${ROUTES.length} paths)`);

  const results = await Promise.all(ROUTES.map((p) => check(p)));
  let failed = false;
  for (const r of results) {
    if (!r.ok) {
      failed = true;
      console.error(`  FAIL ${r.path} → ${r.detail} (status ${r.status})`);
    } else {
      console.log(`  ok   ${r.path} → ${r.status}`);
    }
  }

  if (failed) {
    console.error(
      "\nAt least one route failed: fix or restart the web server before UI/e2e validation.",
    );
    process.exit(1);
  }
}

void main();
