import {
  expect,
  foKnowledgeHubPath,
  openFoAuthedPath,
  test,
} from "../fixtures/fo.fixture";
import { knowledgeTestIds } from "../selectors/knowledge";

test.describe("FO smoke", () => {
  test("FO auth page renders", async ({ page }) => {
    await page.goto("/fo/auth");
    await expect(page.getByRole("heading", { name: /franchise owner sign in/i })).toBeVisible();
    await expect(
      page.getByText(/sign in to open your work queue/i),
    ).toBeVisible();
  });

  test("FO dashboard loads with real token", async ({ page, foToken }) => {
    await openFoAuthedPath(page, foToken, "/fo");
    await expect(page.getByRole("heading", { name: /^my work$/i })).toBeVisible();
    await expect(page.getByText(/queue rows:/i)).toBeVisible();
  });

  test("/fo/knowledge shell loads", async ({ page, foToken }) => {
    await openFoAuthedPath(page, foToken, foKnowledgeHubPath());
    await expect(page.getByTestId(knowledgeTestIds.foKnowledgePage)).toBeVisible();
    await expect(page.getByTestId(knowledgeTestIds.foKnowledgeSearchPanel)).toBeVisible();
    await expect(page.getByTestId(knowledgeTestIds.foQuickSolveForm)).toBeVisible();
  });
});
