import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

const MOBILE_BOOKING_ID = "x7-mobile-booking";
const MOBILE_CUSTOMER_TOKEN = "x7-mobile-customer-token";
const MOBILE_BOOKING = {
  id: MOBILE_BOOKING_ID,
  customerId: "playwright-customer",
  status: "pending_payment",
  hourlyRateCents: 7500,
  estimatedHours: 3,
  currency: "usd",
  scheduledStart: "2026-06-15T14:00:00.000Z",
  notes: "Team prep: focus on kitchen counters and entry floors.",
  createdAt: "2026-05-24T12:00:00.000Z",
  updatedAt: "2026-05-24T12:00:00.000Z",
  quotedTotal: "225.00",
  paymentStatus: "checkout_created",
  paymentCheckoutUrl: "/checkout/mobile-proof",
  paymentAmountCents: 22500,
  paymentCurrency: "usd",
  customer: {
    id: "playwright-customer",
    email: "playwright-customer@example.test",
    phone: null,
    role: "customer",
  },
  fo: {
    id: "playwright-fo",
    userId: "playwright-fo",
    displayName: "Nu Standard owner-operator",
  },
};
const MOBILE_NAVIGATION = { waitUntil: "domcontentloaded" } as const;

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    return Math.max(doc.scrollWidth - doc.clientWidth, body.scrollWidth - window.innerWidth);
  });
  expect(overflow).toBeLessThanOrEqual(1);
}

async function mockCustomerBookingApi(page: Page) {
  await page.route("**/api/v1/bookings**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const headers = {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "authorization,content-type",
      "access-control-allow-methods": "GET,OPTIONS",
      "content-type": "application/json",
    };

    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers });
      return;
    }

    if (url.pathname.endsWith(`/api/v1/bookings/${MOBILE_BOOKING_ID}`)) {
      await route.fulfill({
        status: 200,
        headers,
        body: JSON.stringify({ ok: true, item: MOBILE_BOOKING }),
      });
      return;
    }

    if (url.pathname.endsWith("/api/v1/bookings")) {
      await route.fulfill({
        status: 200,
        headers,
        body: JSON.stringify({ ok: true, items: [MOBILE_BOOKING] }),
      });
      return;
    }

    await route.fulfill({
      status: 404,
      headers,
      body: JSON.stringify({ ok: false, message: "Unhandled X7 mobile booking mock route" }),
    });
  });
}

async function openMockedCustomerPage(page: Page, path: string) {
  await page.goto("/", MOBILE_NAVIGATION);
  await page.evaluate((token) => {
    window.localStorage.setItem("token", token);
    window.localStorage.setItem(
      "servelink_user",
      JSON.stringify({
        id: "playwright-customer",
        email: "playwright-customer@example.test",
        role: "customer",
      }),
    );
    document.cookie = `servelink_access_token=${encodeURIComponent(token)}; Path=/; Max-Age=604800; SameSite=Lax`;
  }, MOBILE_CUSTOMER_TOKEN);
  await page.goto(path, MOBILE_NAVIGATION);
}

test.describe("launch mobile proof", () => {
  test.setTimeout(180_000);

  test.beforeEach(async ({ page }) => {
    page.setDefaultNavigationTimeout(120_000);
  });

  test("public launch surfaces are usable on mobile", async ({ page }) => {
    await page.goto("/", MOBILE_NAVIGATION);
    await expect(page.getByRole("link", { name: /book your cleaning/i })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto("/book", MOBILE_NAVIGATION);
    await expect(page.getByRole("heading", { name: /choose your service/i })).toBeVisible();
    await expect(page.getByTestId("booking-public-service-options")).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto("/book/confirmation", MOBILE_NAVIGATION);
    await expect(page.getByRole("heading", { name: /continue your booking/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /return to booking/i })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("customer portal launch surfaces are usable on mobile", async ({ page }) => {
    await mockCustomerBookingApi(page);

    await page.goto("/customer/auth");
    await expect(
      page.getByRole("heading", { name: /sign in to your Nu Standard visit home/i }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await openMockedCustomerPage(page, "/customer");
    await expect(page.getByRole("heading", { name: /^your visits$/i })).toBeVisible();
    await expect(page.getByText(/Need help with billing or scheduling/i)).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await openMockedCustomerPage(page, `/customer/bookings/${MOBILE_BOOKING_ID}`);
    await expect(page.getByRole("heading", { name: /finish secure checkout/i })).toBeVisible();
    await expect(page.getByText(/What happens next:/i)).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
