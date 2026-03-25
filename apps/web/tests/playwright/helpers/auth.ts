import { Page, request } from "@playwright/test";
import { SERVELINK_ACCESS_TOKEN_COOKIE } from "@/lib/auth";
import { PLAYWRIGHT_API_BASE_URL, PLAYWRIGHT_BASE_URL } from "./env";

const LOGIN_PATH = "auth/login";

type LoginResult = {
  token: string;
};

export async function loginViaApi(email: string, password: string): Promise<string> {
  const apiContext = await request.newContext({
    baseURL: PLAYWRIGHT_API_BASE_URL,
  });

  const response = await apiContext.post(LOGIN_PATH, {
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

const SESSION_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7;

/** Match {@link setStoredAccessToken}: localStorage for client fetches + cookie for RSC `apiFetch`. */
export async function primeLocalStorageToken(page: Page, token: string): Promise<void> {
  await page.addInitScript(
    ({ value, maxAge }: { value: string; maxAge: number }) => {
      window.localStorage.setItem("token", value);
      const encoded = encodeURIComponent(value);
      document.cookie = `servelink_access_token=${encoded}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
    },
    { value: token, maxAge: SESSION_COOKIE_MAX_AGE_SEC },
  );
}

function playwrightOrigin(): string {
  return PLAYWRIGHT_BASE_URL.replace(/\/$/, "");
}

export async function gotoAuthedPage(page: Page, path: string, token: string): Promise<void> {
  const trimmed = token.trim();
  // Middleware + RSC read the cookie on the *first* request; addInitScript runs too late for that.
  await page.context().addCookies([
    {
      name: SERVELINK_ACCESS_TOKEN_COOKIE,
      value: trimmed,
      url: `${playwrightOrigin()}/`,
    },
  ]);
  await primeLocalStorageToken(page, trimmed);
  await page.goto(`${playwrightOrigin()}${path.startsWith("/") ? path : `/${path}`}`, {
    waitUntil: "networkidle",
  });
}

export async function gotoAuthedAdminPage(page: Page, path: string, token: string): Promise<void> {
  await gotoAuthedPage(page, path.startsWith("/admin") ? path : `/admin${path}`, token);
}
