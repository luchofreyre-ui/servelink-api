/**
 * Full-platform local route validation (Playwright + CDP).
 * Browser-driven: final document HTTP 200; primary content via <main>, [role=main], or
 * substantial body text (product PDP uses div-only layout); crash-copy scan; console
 * (CSP image blocks filtered) + same-origin/API 4xx/5xx; cache disabled; best-effort clicks.
 * Product index `/products` is listed under PUBLIC (same URL for PRODUCT index).
 *
 * Usage:
 *   npm run verify:local-all-routes
 *   BASE_URL=http://127.0.0.1:3000 npm run verify:local-all-routes
 *
 * Requires: local Next (default :3000) and Playwright browsers (`npx playwright install chromium`).
 */

import { chromium, type BrowserContext, type Page, type Response } from "playwright";

type GroupId = "PUBLIC" | "ENCYCLOPEDIA" | "PRODUCT" | "AUTH / APP SHELL" | "ADMIN";

type RouteSpec = {
  group: GroupId;
  path: string;
  note?: string;
};

/** Stable slugs from taxonomy / authority registry / product seeds. */
const ROUTES: RouteSpec[] = [
  { group: "PUBLIC", path: "/" },
  { group: "PUBLIC", path: "/problems" },
  { group: "PUBLIC", path: "/surfaces" },
  { group: "PUBLIC", path: "/products" },
  { group: "PUBLIC", path: "/guides" },
  { group: "ENCYCLOPEDIA", path: "/encyclopedia" },
  { group: "ENCYCLOPEDIA", path: "/encyclopedia/methods/degreasing", note: "sample encyclopedia detail" },
  { group: "ENCYCLOPEDIA", path: "/problems/soap-scum", note: "sample problem hub" },
  { group: "PRODUCT", path: "/products/bar-keepers-friend-cleanser", note: "sample product PDP" },
  {
    group: "PRODUCT",
    path: "/compare/products/bona-hard-surface-floor-cleaner-vs-zep-neutral-ph-floor-cleaner",
    note: "sample product comparison",
  },
  { group: "AUTH / APP SHELL", path: "/customer/auth", note: "login equivalent (no top-level /login)" },
  { group: "AUTH / APP SHELL", path: "/customer", note: "dashboard entry (may redirect when logged out)" },
  { group: "ADMIN", path: "/admin/ops" },
  { group: "ADMIN", path: "/admin/activity" },
  { group: "ADMIN", path: "/admin/exceptions" },
  { group: "ADMIN", path: "/admin/anomalies" },
  { group: "ADMIN", path: "/admin/system-tests" },
  { group: "ADMIN", path: "/admin/system-tests/incidents" },
  { group: "ADMIN", path: "/admin/system-tests/compare" },
  { group: "ADMIN", path: "/admin/system-tests/automation" },
];

function baseUrl(): string {
  const raw = process.env.BASE_URL?.trim() || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

function apiOriginPatterns(): string[] {
  const fromEnv = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  const origins = new Set<string>();
  try {
    if (fromEnv) {
      const u = new URL(fromEnv.includes("://") ? fromEnv : `http://${fromEnv}`);
      origins.add(`${u.protocol}//${u.host}`);
    }
  } catch {
    /* ignore */
  }
  origins.add("http://localhost:3001");
  origins.add("http://127.0.0.1:3001");
  return [...origins];
}

function ignoreExtensionNoise(msg: string): boolean {
  if (/chrome-extension|moz-extension|React DevTools|Grammarly|LastPass/i.test(msg)) {
    return true;
  }
  // Next CSP may block third-party product images; not an application exception.
  if (/Content Security Policy.*blocked|violates the following Content Security Policy directive/i.test(msg)) {
    return true;
  }
  return false;
}

const CRASH_RE =
  /Internal Server Error|Application error|Unhandled Runtime|Something went wrong|An error occurred in the application/i;

type RouteResult = {
  path: string;
  note?: string;
  working: boolean;
  issues: string[];
  failedRequests: string[];
  consoleErrors: string[];
  durationMs: number;
};

function attachListeners(page: Page, failedRequests: string[], consoleErrors: string[]): void {
  const apiPatterns = apiOriginPatterns();
  const webBase = baseUrl();
  let webOrigin: string;
  try {
    webOrigin = new URL(webBase).origin;
  } catch {
    webOrigin = webBase;
  }

  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const t = msg.text();
    if (ignoreExtensionNoise(t)) return;
    consoleErrors.push(t);
  });
  page.on("pageerror", (err) => {
    consoleErrors.push(err.message);
  });

  page.on("response", (res: Response) => {
    const url = res.url();
    const status = res.status();
    if (status < 400) return;
    let relevant = false;
    try {
      const u = new URL(url);
      if (u.origin === webOrigin) relevant = true;
      else if (apiPatterns.some((o) => url.startsWith(o))) relevant = true;
    } catch {
      return;
    }
    if (!relevant) return;
    failedRequests.push(`${status} ${res.request().method()} ${url}`);
  });
}

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

/** Best-effort clicks; failures do not fail the route (per validation sweep rules). */
async function tryInteraction(page: Page): Promise<void> {
  const root = page.locator("main").first();
  const hasMain = await root.isVisible().catch(() => false);
  const scope = hasMain ? root : page.locator("body");
  const candidates = scope.locator(
    'button:visible, a[href^="/"]:visible, [role="tab"]:visible',
  );
  const n = await candidates.count();
  if (n === 0) return;
  const max = Math.min(n, 3);
  for (let i = 0; i < max; i++) {
    try {
      await candidates.nth(i).click({ timeout: 3000 });
      await sleep(250);
    } catch {
      /* ignore */
    }
  }
}

async function validateRoute(context: BrowserContext, spec: RouteSpec): Promise<RouteResult> {
  const failedRequests: string[] = [];
  const consoleErrors: string[] = [];
  const issues: string[] = [];

  const page = await context.newPage();
  attachListeners(page, failedRequests, consoleErrors);

  const url = `${baseUrl()}${spec.path}`;
  const started = Date.now();

  try {
    const response = await page.goto(url, {
      waitUntil: "load",
      timeout: 60_000,
    });
    await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
    await page.waitForSelector("main", { state: "visible", timeout: 20_000 }).catch(() => {});

    const status = response?.status() ?? 0;
    if (status !== 200) {
      issues.push(`document HTTP status ${status} (expected 200)`);
    }

    const main = page.locator("main").first();
    const roleMain = page.locator('[role="main"]').first();

    let primaryText = "";
    if (await main.isVisible().catch(() => false)) {
      primaryText = (await main.innerText().catch(() => "")).trim();
    } else if (await roleMain.isVisible().catch(() => false)) {
      primaryText = (await roleMain.innerText().catch(() => "")).trim();
    }

    if (primaryText.length < 20) {
      primaryText = (await page.locator("body").innerText().catch(() => "")).trim();
      if (primaryText.length < 80) {
        issues.push(
          "no substantial primary content (<main>, [role=main], or body text too short — some routes use div-only layouts)",
        );
      }
    }

    const bodyText = (await page.locator("body").innerText().catch(() => "")).trim();
    if (bodyText.length < 30) {
      issues.push("body text unexpectedly short (possible blank render)");
    }
    if (CRASH_RE.test(bodyText)) {
      issues.push("crash-style error copy detected in page text");
    }

    await tryInteraction(page);

    const durationMs = Date.now() - started;

    const working =
      issues.length === 0 &&
      consoleErrors.length === 0 &&
      failedRequests.length === 0 &&
      status === 200;

    await page.close();

    return {
      path: spec.path,
      note: spec.note,
      working,
      issues: working ? [] : issues,
      failedRequests: [...failedRequests],
      consoleErrors: [...consoleErrors],
      durationMs,
    };
  } catch (e) {
    const durationMs = Date.now() - started;
    const msg = e instanceof Error ? e.message : String(e);
    await page.close().catch(() => {});
    return {
      path: spec.path,
      note: spec.note,
      working: false,
      issues: [`navigation or check failed: ${msg}`],
      failedRequests: [...failedRequests],
      consoleErrors: [...consoleErrors],
      durationMs,
    };
  }
}

function printReport(results: RouteResult[]): void {
  const byGroup = new Map<GroupId, RouteResult[]>();
  for (const g of [
    "PUBLIC",
    "ENCYCLOPEDIA",
    "PRODUCT",
    "AUTH / APP SHELL",
    "ADMIN",
  ] as const) {
    byGroup.set(g, []);
  }
  for (const r of results) {
    const spec = ROUTES.find((x) => x.path === r.path);
    if (!spec) continue;
    byGroup.get(spec.group)?.push(r);
  }

  for (const group of [
    "PUBLIC",
    "ENCYCLOPEDIA",
    "PRODUCT",
    "AUTH / APP SHELL",
    "ADMIN",
  ] as const) {
    console.log(`${group}:`);
    for (const r of byGroup.get(group) ?? []) {
      const label = r.note ? `${r.path} (${r.note})` : r.path;
      console.log(`- route: ${label} → ${r.working ? "working" : "broken"}`);
      console.log(`  issues:`);
      if (r.issues.length === 0) console.log(`  - (none)`);
      else for (const i of r.issues) console.log(`  - ${i}`);
      console.log(`  failed requests:`);
      if (r.failedRequests.length === 0) console.log(`  - (none)`);
      else for (const f of r.failedRequests) console.log(`  - ${f}`);
      console.log(`  console errors:`);
      if (r.consoleErrors.length === 0) console.log(`  - (none)`);
      else for (const c of r.consoleErrors) console.log(`  - ${c}`);
    }
    console.log("");
  }

  const total = results.length;
  const working = results.filter((x) => x.working).length;
  const broken = total - working;
  const slow = results.filter((x) => x.durationMs > 15_000);
  const slowest = [...results].sort((a, b) => b.durationMs - a.durationMs)[0];

  console.log("SUMMARY:");
  console.log(`- total routes checked: ${total}`);
  console.log(`- total working: ${working}`);
  console.log(`- total broken: ${broken}`);
  console.log(
    `- highest risk area: ${broken > 0 ? "see broken routes above; fix before relying on CI" : slow.length ? `slow navigations (>${15_000}ms): ${slow.map((s) => s.path).join(", ")}` : "none flagged in this run"}`,
  );
  console.log(
    `- recommended next focus: ${broken > 0 ? "repair failing routes/API/CORS, then re-run" : slowest ? `profile slowest route (${slowest.path}, ${slowest.durationMs}ms) if latency matters` : "keep running this script after deploys"}`,
  );
}

async function main(): Promise<void> {
  const base = baseUrl();
  console.log(`verify-local-all-routes: ${base} (${ROUTES.length} routes, Playwright)\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const bootstrap = await context.newPage();
  const cdp = await context.newCDPSession(bootstrap);
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await bootstrap.close();

  const results: RouteResult[] = [];
  for (const spec of ROUTES) {
    results.push(await validateRoute(context, spec));
  }

  await browser.close();

  printReport(results);

  if (results.some((x) => !x.working)) {
    process.exit(1);
  }
}

void main();
