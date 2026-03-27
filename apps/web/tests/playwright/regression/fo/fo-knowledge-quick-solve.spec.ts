import {
  expect,
  foKnowledgeHubPath,
  openFoAuthedPath,
  test,
} from "../../fixtures/fo.fixture";
import { knowledgeTestIds } from "../../selectors/knowledge";

const GLASS_SOAP_HEAVY_PREFILL =
  "surfaceId=glass_shower_door&problemId=soap_scum&severity=heavy";

test.describe("FO knowledge Quick Solve", () => {
  test("knowledge page renders search panel + Quick Solve form", async ({ page, foToken }) => {
    await openFoAuthedPath(page, foToken, foKnowledgeHubPath());

    await expect(page.getByTestId(knowledgeTestIds.foKnowledgePage)).toBeVisible();

    // wait for boot to complete by waiting for Quick Solve form (stronger signal)
    await expect(page.getByTestId(knowledgeTestIds.foQuickSolveForm)).toBeVisible({
      timeout: 15_000,
    });

    await expect(page.getByTestId(knowledgeTestIds.foKnowledgeSearchPanel)).toBeVisible();
  });

  test("prefill params populate controls", async ({ page, foToken }) => {
    const path = `${foKnowledgeHubPath()}?${GLASS_SOAP_HEAVY_PREFILL}`;
    await openFoAuthedPath(page, foToken, path);

    await expect(page.getByTestId(knowledgeTestIds.foQuickSolveSurfaceSelect)).toHaveValue(
      "glass_shower_door",
    );
    await expect(page.getByTestId(knowledgeTestIds.foQuickSolveProblemSelect)).toHaveValue("soap_scum");
    await expect(page.getByTestId(knowledgeTestIds.foQuickSolveSeverityHeavy)).toHaveClass(/bg-slate-900/);
  });

  test("submitting Quick Solve renders result card", async ({ page, foToken }) => {
    const path = `${foKnowledgeHubPath()}?${GLASS_SOAP_HEAVY_PREFILL}`;
    await openFoAuthedPath(page, foToken, path);

    await page.getByTestId(knowledgeTestIds.foQuickSolveSubmit).click();

    await expect(page.getByTestId(knowledgeTestIds.foQuickSolveResult)).toBeVisible({
      timeout: 30_000,
    });
  });

  test("prefill banner appears when structured params provided", async ({ page, foToken }) => {
    const path = `${foKnowledgeHubPath()}?${GLASS_SOAP_HEAVY_PREFILL}`;
    await openFoAuthedPath(page, foToken, path);

    await expect(page.getByTestId(knowledgeTestIds.foQuickSolvePrefillBanner)).toBeVisible();
    await expect(page.getByTestId(knowledgeTestIds.foQuickSolvePrefillBanner)).toContainText(
      /prefilled from your current context/i,
    );
  });

  test("focusQuickSolve=1 path lands correctly", async ({ page, foToken }) => {
    const path = `${foKnowledgeHubPath()}?${GLASS_SOAP_HEAVY_PREFILL}&focusQuickSolve=1`;
    await openFoAuthedPath(page, foToken, path);

    await expect(page).toHaveURL(/focusQuickSolve=1/);
    await expect(page.getByTestId(knowledgeTestIds.foQuickSolveForm)).toBeVisible();
    await expect(page.getByTestId(knowledgeTestIds.foQuickSolveSurfaceSelect)).toHaveValue(
      "glass_shower_door",
    );
  });
});
