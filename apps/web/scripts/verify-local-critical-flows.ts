/**
 * Critical end-to-end workflow validation (Playwright + CDP).
 * Deeper than verify-local-all-routes: multi-step flows, primary UI checks, light interactions.
 *
 * Usage:
 *   npm run verify:local-critical-flows
 *   BASE_URL=http://localhost:3000 npm run verify:local-critical-flows
 *   SKIP_ADMIN_FLOWS=1 npm run verify:local-critical-flows   # skip flows that need Nest + admin login
 *
 * Requires: local Next (:3000 default), Playwright chromium, Nest API for admin flows (unless SKIP_ADMIN_FLOWS=1).
 */

import { chromium, type BrowserContext, type Page, type Response } from "playwright";

const SERVELINK_ACCESS_TOKEN_COOKIE = "servelink_access_token";

function baseUrl(): string {
  const raw = process.env.BASE_URL?.trim() || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

/** Resolves Nest `/api/v1` base (same idea as tests/playwright/helpers/env). */
function playwrightApiV1Base(): string {
  const explicit = process.env.PLAYWRIGHT_API_BASE_URL?.trim();
  if (explicit) {
    let s = explicit.replace(/\/+$/, "");
    while (s.endsWith("/api/v1")) {
      s = s.slice(0, -"/api/v1".length).replace(/\/+$/, "");
    }
    return `${s}/api/v1`;
  }
  const nest =
    process.env.PLAYWRIGHT_NEST_API_ORIGIN?.replace(/\/+$/, "") || "http://127.0.0.1:3001";
  return `${nest}/api/v1`;
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

function ignoreConsoleNoise(msg: string): boolean {
  const n = msg.replace(/\s+/g, " ").trim();
  if (/chrome-extension|moz-extension|React DevTools|Grammarly|LastPass/i.test(n)) return true;
  if (/Content Security Policy.*blocked|violates the following Content Security Policy directive/i.test(n))
    return true;
  // Next dev / HMR: stale chunk refs, dynamic import of app/error-*.js, ChunkLoadError.
  if (
    /loading chunk/i.test(n) ||
    /chunkloaderror/i.test(n) ||
    /chunks\/app\/error-[^/ ]+\.js/i.test(n) ||
    /\/_next\/static\//i.test(n)
  )
    return true;
  if (/Failed to load resource:.*404|status of 404 \(Not Found\)/i.test(n)) return true;
  return false;
}

/** Narrow signals — avoid matching normal copy that contains words like “error”. */
async function bodyHasSevereCrashText(page: Page): Promise<boolean> {
  const t = (await page.locator("body").innerText().catch(() => "")).trim();
  return (
    /\bInternal Server Error\b/i.test(t) ||
    /\bUnhandled Runtime Error\b/i.test(t)
  );
}

type FlowResult = {
  id: string;
  working: boolean;
  issues: string[];
  failedRequests: string[];
  consoleErrors: string[];
  durationMs: number;
};

function attachListeners(page: Page, failedRequests: string[], consoleErrors: string[]): void {
  const apiPatterns = apiOriginPatterns();
  const webOrigin = new URL(baseUrl()).origin;

  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const t = msg.text();
    if (ignoreConsoleNoise(t)) return;
    consoleErrors.push(t);
  });
  page.on("pageerror", (err) => {
    if (ignoreConsoleNoise(err.message)) return;
    consoleErrors.push(err.message);
  });
  page.on("response", (res: Response) => {
    const url = res.url();
    const status = res.status();
    if (status < 400) return;
    // Stale dev / hot-reload: old HTML referencing a chunk that no longer exists.
    if (status === 404 && url.includes("/_next/static/")) return;
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

type AdminCreds = { email: string; password: string; userJson: string };

async function resolveAdminCreds(): Promise<AdminCreds | null> {
  let email = process.env.PLAYWRIGHT_ADMIN_EMAIL?.trim();
  let password = process.env.PLAYWRIGHT_ADMIN_PASSWORD?.trim();
  const api = playwrightApiV1Base();
  if (!email || !password) {
    const res = await fetch(`${api}/dev/playwright/admin-scenario`, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      scenario?: { adminEmail?: string; adminPassword?: string };
    };
    const s = json?.scenario;
    if (!s?.adminEmail || !s?.adminPassword) return null;
    email = s.adminEmail;
    password = s.adminPassword;
  }
  const userJson = JSON.stringify({
    id: "playwright-admin",
    email,
    role: "admin" as const,
  });
  return { email, password, userJson };
}

async function getAdminSession(): Promise<{ token: string; userJson: string } | null> {
  const creds = await resolveAdminCreds();
  if (!creds) return null;
  const api = playwrightApiV1Base();
  const res = await fetch(`${api}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: creds.email, password: creds.password }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { token?: string; accessToken?: string };
  const token = (json.token ?? json.accessToken)?.trim();
  if (!token) return null;
  return { token, userJson: creds.userJson };
}

async function gotoAuthedPath(page: Page, token: string, userJson: string, path: string): Promise<void> {
  const origin = new URL(baseUrl()).origin;
  await page.context().addCookies([
    {
      name: SERVELINK_ACCESS_TOKEN_COOKIE,
      value: token,
      url: `${origin}/`,
    },
  ]);
  await page.goto(`${origin}/`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.evaluate(
    ({
      value,
      uj,
      name,
    }: {
      value: string;
      uj: string;
      name: string;
    }) => {
      window.localStorage.setItem("token", value);
      window.localStorage.setItem("servelink_user", uj);
      document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    },
    {
      value: token,
      uj: userJson,
      name: SERVELINK_ACCESS_TOKEN_COOKIE,
    },
  );
  const p = path.startsWith("/") ? path : `/${path}`;
  await page.goto(`${origin}${p}`, { waitUntil: "load", timeout: 90_000 });
  await page.waitForLoadState("networkidle", { timeout: 45_000 }).catch(() => {});
  await page.waitForSelector("main", { state: "visible", timeout: 25_000 }).catch(() => {});
}

/** Prefer <main>; allow substantial body if layout is div-only (product PDP pattern). */
async function expectReadableSurface(
  page: Page,
  issues: string[],
  minMain = 40,
  minBodyFallback = 80,
): Promise<void> {
  await page.waitForSelector("main", { state: "visible", timeout: 25_000 }).catch(() => {});
  const main = page.locator("main").first();
  if (await main.isVisible().catch(() => false)) {
    const text = (await main.innerText().catch(() => "")).trim();
    if (text.length < minMain) {
      issues.push(`<main> content shorter than expected (${text.length} chars)`);
    }
    return;
  }
  const body = (await page.locator("body").innerText().catch(() => "")).trim();
  if (body.length < minBodyFallback) {
    issues.push(`no readable primary surface (body ${body.length} chars)`);
  }
}

async function runFlow(
  context: BrowserContext,
  id: string,
  fn: (page: Page, issues: string[]) => Promise<void>,
): Promise<FlowResult> {
  const failedRequests: string[] = [];
  const consoleErrors: string[] = [];
  const issues: string[] = [];
  const page = await context.newPage();
  attachListeners(page, failedRequests, consoleErrors);
  const started = Date.now();
  try {
    await fn(page, issues);
    if (await bodyHasSevereCrashText(page)) {
      issues.push("severe crash copy detected in body (e.g. Internal Server Error)");
    }
    const durationMs = Date.now() - started;
    const working =
      issues.length === 0 && consoleErrors.length === 0 && failedRequests.length === 0;
    await page.close();
    return {
      id,
      working,
      issues: working ? [] : issues,
      failedRequests: [...failedRequests],
      consoleErrors: [...consoleErrors],
      durationMs,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    issues.push(`flow error: ${msg}`);
    const durationMs = Date.now() - started;
    await page.close().catch(() => {});
    return {
      id,
      working: false,
      issues,
      failedRequests: [...failedRequests],
      consoleErrors: [...consoleErrors],
      durationMs,
    };
  }
}

function printReport(results: FlowResult[]): void {
  for (const r of results) {
    console.log(`WORKFLOW: ${r.id}`);
    console.log(`- status: ${r.working ? "working" : "broken"}`);
    console.log(`- issues:`);
    if (r.issues.length === 0) console.log(`  - (none)`);
    else for (const i of r.issues) console.log(`  - ${i}`);
    console.log(`- failed requests:`);
    if (r.failedRequests.length === 0) console.log(`  - (none)`);
    else for (const f of r.failedRequests) console.log(`  - ${f}`);
    console.log(`- console errors:`);
    if (r.consoleErrors.length === 0) console.log(`  - (none)`);
    else for (const c of r.consoleErrors) console.log(`  - ${c}`);
    console.log("");
  }

  const total = results.length;
  const working = results.filter((x) => x.working).length;
  const broken = total - working;
  const slowest = [...results].sort((a, b) => b.durationMs - a.durationMs)[0];

  console.log("SUMMARY:");
  console.log(`- total workflows checked: ${total}`);
  console.log(`- total working: ${working}`);
  console.log(`- total broken: ${broken}`);
  console.log(
    `- highest-priority weakness: ${broken > 0 ? "fix failing workflows (issues / network / console) before expanding coverage" : slowest ? `latency tail on ${slowest.id} (${slowest.durationMs}ms)` : "none flagged"}`,
  );
  console.log(
    `- recommended next hardening target: ${broken > 0 ? "stabilize API/session for admin flows or selectors" : "optional: profile slowest flow or add CI threshold"}`,
  );
}

async function main(): Promise<void> {
  const skipAdmin = process.env.SKIP_ADMIN_FLOWS === "1" || process.env.SKIP_ADMIN_FLOWS === "true";
  console.log(`verify-local-critical-flows: ${baseUrl()} (Playwright)\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const boot = await context.newPage();
  const cdp = await context.newCDPSession(boot);
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await boot.close();

  const results: FlowResult[] = [];

  let adminSession: { token: string; userJson: string } | null = null;
  if (!skipAdmin) {
    adminSession = await getAdminSession();
  }

  // —— Public / encyclopedia / product (no admin token) —— //

  results.push(
    await runFlow(context, "encyclopedia-index-to-detail", async (page, issues) => {
      await page.goto(`${baseUrl()}/encyclopedia`, {
        waitUntil: "load",
        timeout: 60_000,
      });
      await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
      const link = page.locator('main a[href*="/encyclopedia/"]').first();
      if (!(await link.isVisible().catch(() => false))) {
        issues.push("no encyclopedia detail link found on index");
        return;
      }
      await Promise.all([
        page.waitForURL(/\/encyclopedia\/.+/, { timeout: 30_000 }),
        link.click(),
      ]);
      await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
      await expectReadableSurface(page, issues);
    }),
  );

  results.push(
    await runFlow(context, "problem-hub-to-related", async (page, issues) => {
      await page.goto(`${baseUrl()}/problems/soap-scum`, {
        waitUntil: "load",
        timeout: 60_000,
      });
      await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
      const productLink = page.locator('main a[href*="/products/"]').first();
      const compareLink = page.locator('main a[href*="/compare/"]').first();
      const ok =
        (await productLink.isVisible().catch(() => false)) ||
        (await compareLink.isVisible().catch(() => false));
      if (!ok) {
        issues.push("expected at least one /products/ or /compare/ link in problem hub main");
      }
      await expectReadableSurface(page, issues);
    }),
  );

  results.push(
    await runFlow(context, "product-index-to-pdp", async (page, issues) => {
      await page.goto(`${baseUrl()}/products`, { waitUntil: "load", timeout: 60_000 });
      await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
      const pdpLink = page.locator('main a[href^="/products/"]:not([href="/products"])').first();
      if (!(await pdpLink.isVisible().catch(() => false))) {
        issues.push("no product PDP link found on /products index");
        return;
      }
      await Promise.all([
        page.waitForURL(/\/products\/[^/]+$/, { timeout: 30_000 }),
        pdpLink.click(),
      ]);
      await page.waitForLoadState("networkidle", { timeout: 45_000 }).catch(() => {});
      await expectReadableSurface(page, issues, 30, 80);
    }),
  );

  /** PDP with known authority comparison + purchase metadata (see productAuthorityContext tests). */
  const samplePdp = "/products/clr-calcium-lime-rust";

  results.push(
    await runFlow(context, "pdp-to-compare", async (page, issues) => {
      await page.goto(`${baseUrl()}${samplePdp}`, {
        waitUntil: "load",
        timeout: 90_000,
      });
      await page.waitForLoadState("networkidle", { timeout: 45_000 }).catch(() => {});
      await page
        .waitForSelector('a[href^="/compare/products/"]', { state: "attached", timeout: 30_000 })
        .catch(() => {});
      const compareHref = await page.evaluate(() => {
        const a = document.querySelector(
          'a[href^="/compare/products/"]',
        ) as HTMLAnchorElement | null;
        return a?.getAttribute("href") ?? null;
      });
      if (!compareHref) {
        issues.push("no /compare/products/ link in DOM on PDP");
        return;
      }
      await page.goto(`${baseUrl()}${compareHref}`, {
        waitUntil: "load",
        timeout: 60_000,
      });
      await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
      await expectReadableSurface(page, issues);
    }),
  );

  results.push(
    await runFlow(context, "pdp-outbound-buy-link", async (page, issues) => {
      await page.goto(`${baseUrl()}${samplePdp}`, {
        waitUntil: "load",
        timeout: 90_000,
      });
      await page.waitForLoadState("networkidle", { timeout: 45_000 }).catch(() => {});
      await page
        .waitForSelector('a[href*="amazon"], [href*="amzn"]', { state: "attached", timeout: 30_000 })
        .catch(() => {});
      const amazon = page.locator('main a[href*="amazon"]').first();
      const byText = page.getByRole("link", { name: /amazon/i }).first();
      const ok =
        (await amazon.isVisible().catch(() => false)) || (await byText.isVisible().catch(() => false));
      if (!ok) {
        issues.push("expected Amazon outbound link on PDP (href or accessible name)");
      }
      await expectReadableSurface(page, issues, 30, 80);
    }),
  );

  results.push(
    await runFlow(context, "customer-auth-shell", async (page, issues) => {
      await page.goto(`${baseUrl()}/customer/auth`, {
        waitUntil: "load",
        timeout: 60_000,
      });
      await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
      const email = page.locator("#email");
      if (!(await email.isVisible().catch(() => false))) {
        issues.push("customer auth email field #email not visible");
      }
      await page.goto(`${baseUrl()}/customer`, { waitUntil: "load", timeout: 60_000 });
      await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
      if (await bodyHasSevereCrashText(page)) issues.push("severe crash copy on /customer");
    }),
  );

  // —— Admin (token) —— //

  if (skipAdmin || !adminSession) {
    const reason = skipAdmin
      ? "SKIP_ADMIN_FLOWS set"
      : "could not obtain admin session (API / scenario / login)";
    for (const id of [
      "admin-ops-dashboard",
      "admin-exceptions-queue",
      "admin-anomalies",
      "admin-activity",
      "admin-system-tests-compare",
      "admin-system-tests-incidents",
      "admin-system-tests-automation",
      "admin-auth-page-then-ops",
    ]) {
      results.push({
        id,
        working: false,
        issues: [reason],
        failedRequests: [],
        consoleErrors: [],
        durationMs: 0,
      });
    }
  } else {
    const token = adminSession.token;
    const uj = adminSession.userJson;

    results.push(
      await runFlow(context, "admin-ops-dashboard", async (page, issues) => {
        await gotoAuthedPath(page, token, uj, "/admin/ops");
        await expectReadableSurface(page, issues);
      }),
    );

    results.push(
      await runFlow(context, "admin-exceptions-queue", async (page, issues) => {
        await gotoAuthedPath(page, token, uj, "/admin/exceptions");
        await expectReadableSurface(page, issues);
        const tab = page.getByRole("tab").first();
        if (await tab.isVisible().catch(() => false)) {
          await tab.click().catch(() => {});
          await sleep(400);
        }
      }),
    );

    results.push(
      await runFlow(context, "admin-anomalies", async (page, issues) => {
        await gotoAuthedPath(page, token, uj, "/admin/anomalies");
        await expectReadableSurface(page, issues);
      }),
    );

    results.push(
      await runFlow(context, "admin-activity", async (page, issues) => {
        await gotoAuthedPath(page, token, uj, "/admin/activity");
        await expectReadableSurface(page, issues);
      }),
    );

    for (const path of [
      "/admin/system-tests/compare",
      "/admin/system-tests/incidents",
      "/admin/system-tests/automation",
    ] as const) {
      const short = path.replace("/admin/system-tests/", "admin-system-tests-");
      results.push(
        await runFlow(context, short, async (page, issues) => {
          await gotoAuthedPath(page, token, uj, path);
          await expectReadableSurface(page, issues);
        }),
      );
    }

    results.push(
      await runFlow(context, "admin-auth-page-then-ops", async (page, issues) => {
        await page.goto(`${baseUrl()}/admin/auth`, {
          waitUntil: "load",
          timeout: 60_000,
        });
        await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
        // Client page: wait for hydrated heading (avoids flake on fast networkidle).
        await page
          .locator("main h1")
          .first()
          .waitFor({ state: "visible", timeout: 20_000 })
          .catch(() => {});
        const h1 = page.locator("main h1").first();
        if (!(await h1.isVisible().catch(() => false))) {
          issues.push("admin auth main h1 not visible");
        }
        await gotoAuthedPath(page, token, uj, "/admin/ops");
        await expectReadableSurface(page, issues);
      }),
    );
  }

  await browser.close();

  printReport(results);

  if (results.some((r) => !r.working)) {
    process.exit(1);
  }
}

void main();
