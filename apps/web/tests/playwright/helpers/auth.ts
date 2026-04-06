import { Page, request } from "@playwright/test";
import { SERVELINK_ACCESS_TOKEN_COOKIE } from "@/lib/auth";
import { PLAYWRIGHT_API_BASE_URL, PLAYWRIGHT_BASE_URL } from "./env";

const SESSION_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7;

type LoginResult = {
  token: string;
};

/**
 * Login must hit the API origin with path `/api/v1/auth/login`.
 * Do not rely on request baseURL + relative `auth/login` without a trailing slash on base —
 * URL resolution would drop `/v1` and post to `/api/auth/login` instead.
 */
export async function loginViaApi(email: string, password: string): Promise<string> {
  const loginUrl = `${PLAYWRIGHT_API_BASE_URL}/auth/login`;
  const apiContext = await request.newContext();

  const response = await apiContext.post(loginUrl, {
    data: { email, password },
  });

  if (!response.ok()) {
    throw new Error(`Login failed for ${email}: ${response.status()} ${response.statusText()}`);
  }

  const json = (await response.json()) as LoginResult | { accessToken?: string; token?: string };

  const token =
    (json as { token?: string }).token ||
    (json as { accessToken?: string }).accessToken;

  if (!token) {
    throw new Error("Login response did not include token/accessToken");
  }

  await apiContext.dispose();
  return token;
}

type PrimedRole = "admin" | "fo" | "customer";

function servelinkUserJsonForRole(role: PrimedRole): string {
  const users: Record<PrimedRole, { id: string; email: string; role: PrimedRole }> = {
    admin: {
      id: "playwright-admin",
      email: "playwright@servelink.test",
      role: "admin",
    },
    fo: {
      id: "playwright-fo",
      email: "playwright-fo@servelink.test",
      role: "fo",
    },
    customer: {
      id: "playwright-customer",
      email: "playwright-customer@servelink.test",
      role: "customer",
    },
  };
  return JSON.stringify(users[role]);
}

function roleFromNavPath(path: string): PrimedRole {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized.startsWith("/customer")) return "customer";
  if (normalized.startsWith("/fo")) return "fo";
  if (normalized.startsWith("/admin")) return "admin";
  return "admin";
}

function playwrightOrigin(): string {
  return PLAYWRIGHT_BASE_URL.replace(/\/$/, "");
}

/**
 * Seeds the same keys/cookie shape as production login (`token`, `servelink_token`, `servelink_user`,
 * `servelink_access_token` cookie). Called in-page so storage exists before React hydrates on the next navigation.
 */
async function seedSessionInPage(
  page: Page,
  token: string,
  role: PrimedRole,
): Promise<void> {
  const userJson = servelinkUserJsonForRole(role);
  await page.evaluate(
    ({
      value,
      maxAge,
      userJson: uj,
      cookieName,
    }: {
      value: string;
      maxAge: number;
      userJson: string;
      cookieName: string;
    }) => {
      window.localStorage.setItem("token", value);
      window.localStorage.setItem("servelink_token", value);
      window.localStorage.setItem("servelink_user", uj);
      const encoded = encodeURIComponent(value);
      document.cookie = `${cookieName}=${encoded}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
    },
    {
      value: token,
      maxAge: SESSION_COOKIE_MAX_AGE_SEC,
      userJson,
      cookieName: SERVELINK_ACCESS_TOKEN_COOKIE,
    },
  );
}

export async function gotoAuthedPage(page: Page, path: string, token: string): Promise<void> {
  const trimmed = token.trim();
  const primedRole = roleFromNavPath(path);
  const origin = playwrightOrigin();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  await page.context().addCookies([
    {
      name: SERVELINK_ACCESS_TOKEN_COOKIE,
      value: trimmed,
      url: `${origin}/`,
    },
  ]);

  await page.goto(`${origin}/`, { waitUntil: "domcontentloaded" });
  await seedSessionInPage(page, trimmed, primedRole);

  await page.goto(`${origin}${normalizedPath}`, {
    waitUntil: "load",
  });
}

export async function gotoAuthedAdminPage(page: Page, path: string, token: string): Promise<void> {
  await gotoAuthedPage(page, path.startsWith("/admin") ? path : `/admin${path}`, token);
}
