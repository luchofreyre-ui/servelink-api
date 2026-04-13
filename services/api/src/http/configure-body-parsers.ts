import type { Express, Request, RequestHandler } from "express";
import { json, urlencoded } from "express";

/** Must match `SystemTestsAdminController` + `@Post("report")` (no global prefix). */
export const ADMIN_SYSTEM_TESTS_REPORT_PATH = "/api/v1/admin/system-tests/report";

/**
 * Playwright JSON ingest is admin + JWT only. Default JSON stays small to limit abuse
 * surface; this route alone accepts larger bodies (slim client payload + headroom).
 */
const ADMIN_SYSTEM_TESTS_REPORT_JSON_LIMIT = "12mb";
const DEFAULT_JSON_LIMIT = "100kb";

const BODY_PARSER_LOG_PREFIX = "[SERVELINK_BODY_PARSER]";

/**
 * Use `originalUrl` pathname (not `req.path`): with Nest/Express, `req.path` can be wrong
 * relative to mount points; trailing slashes also broke strict `===` vs the controller route.
 */
export function normalizedRequestPathname(req: Request): string {
  const raw = req.originalUrl ?? req.url ?? "/";
  try {
    const pathname = new URL(raw, "http://servelink.internal").pathname || "/";
    if (pathname.length > 1) {
      return pathname.replace(/\/+$/, "") || "/";
    }
    return pathname;
  } catch {
    return "/";
  }
}

function shouldUseLargeReportJsonParser(req: Request): boolean {
  return req.method === "POST" && normalizedRequestPathname(req) === ADMIN_SYSTEM_TESTS_REPORT_PATH;
}

function maybeLogBodyParserDecision(req: Request, largeBranch: boolean): void {
  if (req.method !== "POST") {
    return;
  }
  const pathname = normalizedRequestPathname(req);
  const target = ADMIN_SYSTEM_TESTS_REPORT_PATH;
  if (pathname !== target && !pathname.startsWith(`${target}/`)) {
    return;
  }
  console.log(
    `${BODY_PARSER_LOG_PREFIX} method=${req.method} pathname=${pathname} originalUrl=${req.originalUrl ?? req.url} largeJsonLimitBranch=${largeBranch}`,
  );
}

export function applyBodyParserMiddleware(expressApp: Express): void {
  const largeReportJsonParser = json({ limit: ADMIN_SYSTEM_TESTS_REPORT_JSON_LIMIT });
  const defaultJsonParser = json({ limit: DEFAULT_JSON_LIMIT });

  const chooseJson: RequestHandler = (req, res, next) => {
    const large = shouldUseLargeReportJsonParser(req);
    maybeLogBodyParserDecision(req, large);
    if (large) {
      return largeReportJsonParser(req, res, next);
    }
    return defaultJsonParser(req, res, next);
  };

  expressApp.use(chooseJson);
  expressApp.use(urlencoded({ extended: true, limit: DEFAULT_JSON_LIMIT }));
}
