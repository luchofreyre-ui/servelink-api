/**
 * System integrity validation: API, auth, HTML content, sampled links, assets, runtime safety.
 * Complements route/flow sweeps by catching breakage that navigation alone can miss.
 *
 * Usage:
 *   npm run verify:local-system-integrity
 *   BASE_URL=http://localhost:3000 npm run verify:local-system-integrity
 *
 * Requires: Next on BASE_URL (default :3000), Nest API on PLAYWRIGHT_NEST_API_ORIGIN (default :3001),
 * and dev admin scenario or PLAYWRIGHT_ADMIN_EMAIL / PLAYWRIGHT_ADMIN_PASSWORD for auth checks.
 */

import { chromium, type Page, type Response } from "playwright";

const SLOW_CHECK_WARN_MS = 5_000;
const HARD_TIMEOUT_MS = 30_000;
const LINK_PROBE_LIMIT = 25;
const LINK_PROBE_TIMEOUT_MS = 12_000;

function baseUrl(): string {
  const raw = process.env.BASE_URL?.trim() || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

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

type CheckResult = {
  id: string;
  working: boolean;
  issues: string[];
  failedRequests: string[];
  consoleErrors: string[];
  durationMs: number;
};

async function timed<T>(fn: () => Promise<T>): Promise<{ value: T; ms: number }> {
  const t0 = Date.now();
  const value = await fn();
  return { value, ms: Date.now() - t0 };
}

function emptyResult(id: string, ms: number): CheckResult {
  return {
    id,
    working: false,
    issues: [],
    failedRequests: [],
    consoleErrors: [],
    durationMs: ms,
  };
}

async function resolveAdminCreds(): Promise<{ email: string; password: string } | null> {
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
  return { email, password };
}

async function fetchText(
  url: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; text: string; contentType: string }> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), HARD_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: {
        accept: "text/html,application/json;q=0.9,*/*;q=0.8",
        ...(init?.headers as Record<string, string>),
      },
    });
    const contentType = res.headers.get("content-type") ?? "";
    const text = await res.text();
    return { ok: res.ok, status: res.status, text, contentType };
  } finally {
    clearTimeout(id);
  }
}

function extractInternalPaths(html: string, originPathPrefix = ""): string[] {
  const out = new Set<string>();
  const re = /\bhref=(["'])(\/[^"'#?]+)\1/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const p = m[2];
    if (p.startsWith("//")) continue;
    if (/\.(ico|png|jpg|jpeg|gif|webp|svg|woff2?|ttf|eot)(\?|$)/i.test(p)) continue;
    out.add(p.split("#")[0] ?? p);
  }
  return [...out];
}

const RUNTIME_BAD_PATTERNS: RegExp[] = [
  /Hydration failed/i,
  /Text content does not match server-rendered HTML/i,
  /did not match the server/i,
  /There was an error while hydrating/i,
  /Application error:\s*a client-side exception/i,
  /\bInternal Server Error\b/i,
  /ChunkLoadError/i,
  /\bUnhandled Runtime Error\b/i,
];

function bodyHasRuntimeRisk(text: string): string[] {
  const hits: string[] = [];
  for (const re of RUNTIME_BAD_PATTERNS) {
    if (re.test(text)) hits.push(`matched: ${re.source}`);
  }
  return hits;
}

function printCheck(r: CheckResult): void {
  console.log("SYSTEM INTEGRITY:");
  console.log(`- check: ${r.id}`);
  console.log(`- status: ${r.working ? "working" : "broken"}`);
  console.log("- issues:");
  if (r.issues.length === 0) console.log("  - (none)");
  else for (const i of r.issues) console.log(`  - ${i}`);
  console.log("- failed requests:");
  if (r.failedRequests.length === 0) console.log("  - (none)");
  else for (const f of r.failedRequests) console.log(`  - ${f}`);
  console.log("- console errors:");
  if (r.consoleErrors.length === 0) console.log("  - (none)");
  else for (const c of r.consoleErrors) console.log(`  - ${c}`);
  console.log(`- duration: ${r.durationMs}ms`);
  if (r.durationMs >= SLOW_CHECK_WARN_MS) {
    console.log(`- performance note: exceeds ${SLOW_CHECK_WARN_MS}ms warn threshold (not a failure)`);
  }
  console.log("");
}

function printSummary(
  results: CheckResult[],
  slowest: { id: string; ms: number } | null,
  perfWeakness: string,
): void {
  const total = results.length;
  const ok = results.filter((x) => x.working).length;
  const broken = total - ok;
  console.log("SUMMARY:");
  console.log(`- total checks: ${total}`);
  console.log(`- total working: ${ok}`);
  console.log(`- total broken: ${broken}`);
  console.log(
    `- highest-priority weakness: ${broken > 0 ? results.find((r) => !r.working)?.id ?? "unknown" : slowest ? `latency tail (${slowest.id} ${slowest.ms}ms)` : perfWeakness}`,
  );
  console.log(
    `- recommended repair target: ${broken > 0 ? `fix broken check(s), starting with ${results.find((r) => !r.working)?.id}` : "optional: reduce slowest check latency or raise local resources"}`,
  );
}

async function main(): Promise<void> {
  const web = baseUrl();
  const api = playwrightApiV1Base();
  const origin = new URL(web).origin;

  const results: CheckResult[] = [];

  // —— A. API HEALTH —— //
  {
    const { ms, value: health } = await timed(async () => {
      const res = await fetch(`${api}/health`, {
        method: "GET",
        headers: { accept: "application/json" },
        redirect: "manual",
      });
      let body: unknown = null;
      try {
        body = await res.json();
      } catch {
        body = null;
      }
      return { res, body };
    });
    const r = emptyResult("api-health", ms);
    if (health.res.status !== 200) {
      r.issues.push(`expected 200 from GET /api/v1/health, got ${health.res.status}`);
    }
    const b = health.body as { status?: string; db?: string } | null;
    if (!b || b.status !== "ok" || b.db !== "ok") {
      r.issues.push("health JSON missing { status: ok, db: ok }");
    }
    r.working = r.issues.length === 0;
    results.push(r);
  }

  // —— B. AUTH —— //
  let adminToken: string | null = null;
  {
    const { ms, value } = await timed(async () => {
      const creds = await resolveAdminCreds();
      if (!creds) return { ok: false as const, reason: "no admin credentials (env or /dev/playwright/admin-scenario)" };
      const res = await fetch(`${api}/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ email: creds.email, password: creds.password }),
        redirect: "manual",
      });
      const text = await res.text();
      let json: { token?: string; accessToken?: string } | null = null;
      try {
        json = JSON.parse(text) as { token?: string; accessToken?: string };
      } catch {
        json = null;
      }
      const token = (json?.token ?? json?.accessToken)?.trim() ?? null;
      if (!res.ok || !token) {
        return {
          ok: false as const,
          reason: `login failed: status ${res.status}, hasToken=${Boolean(token)}, bodySnippet=${text.slice(0, 120)}`,
        };
      }
      return { ok: true as const, token };
    });
    const r = emptyResult("auth-login", ms);
    if (value.ok) {
      adminToken = value.token;
    } else {
      r.issues.push(value.reason);
    }
    r.working = r.issues.length === 0;
    results.push(r);
  }

  {
    const { ms, value } = await timed(async () => {
      if (!adminToken) {
        return { ok: false as const, issue: "skipped (no token from auth-login)" };
      }
      const url = `${api}/admin/system-tests/summary`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          accept: "application/json",
          authorization: `Bearer ${adminToken}`,
        },
        redirect: "manual",
      });
      const text = await res.text();
      const ct = res.headers.get("content-type") ?? "";
      if (res.status >= 300 && res.status < 400) {
        return { ok: false as const, issue: `redirect ${res.status} on protected GET (possible mis-route)` };
      }
      if (res.status !== 200) {
        return { ok: false as const, issue: `GET ${url} -> ${res.status}` };
      }
      if (!/json/i.test(ct)) {
        return {
          ok: false as const,
          issue: `expected application/json, got content-type=${ct || "(empty)"} (possible HTML error page)`,
        };
      }
      let parsed: { suiteBreakdown?: unknown } | null = null;
      try {
        parsed = JSON.parse(text) as { suiteBreakdown?: unknown };
      } catch {
        return { ok: false as const, issue: "response body is not JSON" };
      }
      if (!parsed || typeof parsed !== "object" || !("suiteBreakdown" in parsed)) {
        return { ok: false as const, issue: "JSON missing suiteBreakdown (unexpected shape / fake success)" };
      }
      return { ok: true as const };
    });
    const r = emptyResult("auth-protected-admin-endpoint", ms);
    if (!value.ok) r.issues.push(value.issue);
    r.working = r.issues.length === 0;
    results.push(r);
  }

  // —— C. CONTENT (HTML) —— //
  const encPath = "/encyclopedia/methods/degreasing";
  const pdpPath = "/products/clr-calcium-lime-rust";
  const comparePath =
    "/compare/products/clr-calcium-lime-rust-vs-zep-calcium-lime-rust-remover";

  {
    const { ms, value: ft } = await timed(() => fetchText(`${web}${encPath}`));
    const r = emptyResult("content-encyclopedia-html", ms);
    if (!ft.ok || ft.status !== 200) {
      r.failedRequests.push(`GET ${encPath} -> ${ft.status}`);
      r.issues.push("encyclopedia sample page not HTTP 200");
    }
    const html = ft.text;
    if (html.length < 800) r.issues.push(`HTML too short (${html.length} chars)`);
    if (!/<main[\s>]/i.test(html) && !/encyclopedia/i.test(html)) {
      r.issues.push("missing <main> or encyclopedia markers");
    }
    if (/<title[^>]*>[^<]*404/i.test(html) || /This page could not be found/i.test(html)) {
      r.issues.push("page looks like Next not-found");
    }
    r.working = r.issues.length === 0 && r.failedRequests.length === 0;
    results.push(r);
  }

  {
    const { ms, value: ft } = await timed(() => fetchText(`${web}${pdpPath}`));
    const r = emptyResult("content-product-pdp-html", ms);
    if (!ft.ok || ft.status !== 200) {
      r.failedRequests.push(`GET ${pdpPath} -> ${ft.status}`);
      r.issues.push("PDP not HTTP 200");
    }
    const html = ft.text;
    if (!/<h1[\s>]/i.test(html)) r.issues.push("missing <h1> (title)");
    if (!/Related products|Product library|Buy this option/i.test(html)) {
      r.issues.push("missing expected product section markers (related / buy / library)");
    }
    r.working = r.issues.length === 0 && r.failedRequests.length === 0;
    results.push(r);
  }

  {
    const { ms, value: ft } = await timed(() => fetchText(`${web}${comparePath}`));
    const r = emptyResult("content-compare-html", ms);
    if (!ft.ok || ft.status !== 200) {
      r.failedRequests.push(`GET ${comparePath} -> ${ft.status}`);
      r.issues.push("compare page not HTTP 200");
    }
    const html = ft.text;
    const hasVs = / vs\.? | vs |versus/i.test(html);
    const hasClr = /CLR|Zep/i.test(html);
    if (!hasVs && !hasClr) {
      r.issues.push("compare page missing both-side product markers (vs / product names)");
    }
    if (!/compare|comparison|stack/i.test(html)) {
      r.issues.push("missing comparison content markers");
    }
    r.working = r.issues.length === 0 && r.failedRequests.length === 0;
    results.push(r);
  }

  // —— D. LINK INTEGRITY —— //
  {
    const { ms, value: linkOutcome } = await timed(async () => {
      const seeds = [`${web}${encPath}`, `${web}${pdpPath}`, `${web}${comparePath}`, `${web}/encyclopedia`];
      const paths = new Set<string>();
      for (const u of seeds) {
        const ft = await fetchText(u);
        if (ft.ok) for (const p of extractInternalPaths(ft.text)) paths.add(p);
      }
      const list = [...paths].slice(0, LINK_PROBE_LIMIT);
      const bad: string[] = [];
      for (const p of list) {
        const ctrl = new AbortController();
        const to = setTimeout(() => ctrl.abort(), LINK_PROBE_TIMEOUT_MS);
        try {
          const res = await fetch(`${web}${p}`, {
            method: "GET",
            redirect: "manual",
            signal: ctrl.signal,
            headers: { accept: "*/*" },
          });
          const st = res.status;
          if (st === 404 || st >= 500) bad.push(`${st} ${p}`);
        } catch (e) {
          bad.push(`err ${p}: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
          clearTimeout(to);
        }
      }
      return { probed: list.length, bad };
    });
    const r = emptyResult("link-sample-integrity", ms);
    if (linkOutcome.bad.length > 0) {
      for (const b of linkOutcome.bad) r.failedRequests.push(b);
      r.issues.push("one or more sampled links returned 404/5xx or failed");
    }
    r.working = linkOutcome.bad.length === 0;
    results.push(r);
  }

  // —— E + F + G: Playwright assets + runtime (one browser pass, two reported checks) —— //
  {
    const { ms, value: browserOutcome } = await timed(async () => {
      const browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const boot = await context.newPage();
      const cdp = await context.newCDPSession(boot);
      await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
      await boot.close();

      const page = await context.newPage();
      const chunkFailures: string[] = [];
      const faviconFailures: string[] = [];
      const otherStaticFailures: string[] = [];
      const consoleErrors: string[] = [];
      const seenAssetFailureLines = new Set<string>();

      const pushUnique = (arr: string[], line: string) => {
        if (seenAssetFailureLines.has(line)) return;
        seenAssetFailureLines.add(line);
        arr.push(line);
      };

      page.on("response", (res: Response) => {
        const url = res.url();
        const st = res.status();
        if (st < 400) return;
        let u: URL;
        try {
          u = new URL(url);
        } catch {
          return;
        }
        if (u.origin !== origin) return;
        const isStatic = u.pathname.includes("/_next/static/");
        const isFav = /\/favicon\.ico$/i.test(u.pathname);
        if (!isStatic && !isFav) return;

        const line = `${st} ${res.request().method()} ${url}`;
        if (isFav) {
          pushUnique(faviconFailures, line);
          return;
        }
        if (!/\.(css|js|mjs)(\?|$)/i.test(u.pathname)) return;
        if (/\/chunks\//i.test(u.pathname)) pushUnique(chunkFailures, line);
        else pushUnique(otherStaticFailures, line);
      });

      page.on("console", (msg) => {
        if (msg.type() !== "error") return;
        consoleErrors.push(msg.text());
      });
      page.on("pageerror", (err) => {
        consoleErrors.push(err.message);
      });

      const runtimeIssues: string[] = [];
      const urls = [`${web}${encPath}`, `${web}${pdpPath}`, `${web}${comparePath}`];

      for (const u of urls) {
        await page.goto(u, { waitUntil: "load", timeout: HARD_TIMEOUT_MS });
        await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
        const bodyText = await page.locator("body").innerText().catch(() => "");
        const hits = bodyHasRuntimeRisk(bodyText);
        if (hits.length) {
          runtimeIssues.push(`${u}: ${hits.join("; ")}`);
        }
      }

      await page.close();
      await browser.close();

      return {
        chunkFailures,
        faviconFailures,
        otherStaticFailures,
        consoleErrors,
        runtimeIssues,
      };
    });

    const assetIssues: string[] = [];
    const ra = emptyResult("browser-asset-integrity", ms);
    if (browserOutcome.chunkFailures.length) {
      assetIssues.push(`chunk JS/CSS failures: ${browserOutcome.chunkFailures.length}`);
      for (const c of browserOutcome.chunkFailures.slice(0, 12)) ra.failedRequests.push(c);
    }
    if (browserOutcome.faviconFailures.length) {
      assetIssues.push(`favicon failures: ${browserOutcome.faviconFailures.length}`);
      for (const c of browserOutcome.faviconFailures) ra.failedRequests.push(c);
    }
    if (browserOutcome.otherStaticFailures.length) {
      assetIssues.push(`other _next/static css/js failures: ${browserOutcome.otherStaticFailures.length}`);
      for (const c of browserOutcome.otherStaticFailures.slice(0, 8)) ra.failedRequests.push(c);
    }
    if (assetIssues.length) for (const a of assetIssues) ra.issues.push(a);
    ra.working =
      browserOutcome.chunkFailures.length === 0 &&
      browserOutcome.faviconFailures.length === 0 &&
      browserOutcome.otherStaticFailures.length === 0;
    results.push(ra);

    const runtimeConsoleBad = browserOutcome.consoleErrors.filter((msg) => {
      const n = msg.replace(/\s+/g, " ");
      if (/chrome-extension|Content Security Policy.*blocked|violates the following Content Security Policy/i.test(n))
        return false;
      if (/loading chunk/i.test(n) || /chunks\/app\/error-/i.test(n) || /_next\/static\//i.test(n)) return false;
      return (
        /ChunkLoadError|Application error:\s*a client-side exception|Hydration|did not match|Unhandled Runtime/i.test(n)
      );
    });

    const rr = emptyResult("browser-runtime-safety", ms);
    if (runtimeConsoleBad.length) {
      for (const c of runtimeConsoleBad.slice(0, 12)) rr.consoleErrors.push(c);
      rr.issues.push(`runtime console errors (${runtimeConsoleBad.length})`);
    }
    if (browserOutcome.runtimeIssues.length) {
      for (const x of browserOutcome.runtimeIssues) rr.issues.push(x);
    }
    rr.working = browserOutcome.runtimeIssues.length === 0 && runtimeConsoleBad.length === 0;
    results.push(rr);
  }

  let slowest: { id: string; ms: number } | null = null;
  for (const x of results) {
    if (!slowest || x.durationMs > slowest.ms) slowest = { id: x.id, ms: x.durationMs };
  }

  const perfWeakness =
    slowest && slowest.ms >= SLOW_CHECK_WARN_MS
      ? `slowest check ${slowest.id} (${slowest.ms}ms)`
      : "none beyond threshold";

  for (const r of results) printCheck(r);

  printSummary(results, slowest, perfWeakness);

  if (results.some((x) => !x.working)) {
    process.exit(1);
  }
}

void main();
