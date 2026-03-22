import { Page, request } from "@playwright/test";
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

export async function primeLocalStorageToken(page: Page, token: string): Promise<void> {
  await page.addInitScript((value: string) => {
    window.localStorage.setItem("token", value);
  }, token);
}

export async function gotoAuthedPage(page: Page, path: string, token: string): Promise<void> {
  await primeLocalStorageToken(page, token);
  await page.goto(`${PLAYWRIGHT_BASE_URL}${path}`, {
    waitUntil: "networkidle",
  });
}

export async function gotoAuthedAdminPage(page: Page, path: string, token: string): Promise<void> {
  await gotoAuthedPage(page, path.startsWith("/admin") ? path : `/admin${path}`, token);
}
