# Playwright system tests — operator runbook

## Lanes

| Lane | Playwright project | What runs |
|------|-------------------|-----------|
| **Fast** | `--project=fast` | All specs under `tests/playwright` **except** `content.quality.spec.ts` and `pipeline.integrity.spec.ts`. |
| **Deep** | `--project=deep` | Only `content.quality.spec.ts` and `pipeline.integrity.spec.ts` (full-corpus / pipeline integrity). |
| **Full suite** | both projects (default local `npm run test:e2e`) | Fast + deep; same coverage as running both projects in one go. |

## When to run which

| Situation | Run |
|-----------|-----|
| PR / routine CI gate / quick regression | **Fast** |
| After encyclopedia data / promotion / search-index changes | **Full** (or **Deep** if you only touched pipeline or corpus quality) |
| Daily integrity / scheduled automation | **Full** (see CI below) |
| Local debugging one area | Use existing path scripts (`test:e2e:smoke`, etc.) or `playwright test <path>`; lane still applies if you use `--project` |

**Admin ops inline actions** (`regression/admin/admin-ops-inline-actions.spec.ts`): the spec extends the admin fixture with `fetchFreshPlaywrightScenario()` so each run re-seeds `GET /api/v1/dev/playwright/admin-scenario` and restores `bookingIds.review` for a deterministic “Clear review” path (SSR row must show an enabled button). If that row is missing and the drilldown probe finds no eligible action, the test skips.

**Local commands (`apps/web`):**

- Fast: `npm run test:e2e:fast`
- Deep: `npm run test:e2e:deep`
- Full: `npm run test:e2e`

## CI workflow: `System tests (Playwright)`

- **Manual (`workflow_dispatch`):** default lane **fast** (`playwright_lane`). Optional: **deep**, **full**, or **playwright_paths** override (replaces lane).
- **Schedule (daily):** **full suite** (`--project=fast --project=deep`).
- **Hosted upload:** unless `skip_upload` is set; ingest uses `source` like `github-actions|lane=<slug>`.

## Artifacts (GitHub Actions)

After each run, download from the job’s **Artifacts** section:

- `playwright-artifacts-<lane_slug>` — traces, video, screenshots under `test-results`
- `playwright-json-report-<lane_slug>` — JSON report path used for upload

**`lane_slug` values:** `fast`, `deep`, `full`, `full-suite` (scheduled full), `custom-<8-char hash>` (when `playwright_paths` override is used).

## Reading lane labels in CI

1. **Job summary** — section **“Playwright lane triage”**: event, lane description, `lane_slug`, optional `playwright_paths` override (fenced), final shell command.
2. **Annotations** — `::notice` titled **Playwright lane** with slug and short label.
3. **Step log** — same triage block repeated as plain text before `npx playwright test` runs.
4. **Upload step summary** — **“System-tests upload context”** with `PLAYWRIGHT_LANE` and label when ingest runs.

## When a run fails — do this first

1. Note **`lane_slug`** from the summary or artifact name — know whether you’re in fast-only vs deep vs full.
2. Open the **failed test** in the log; note **project** `[fast]` vs `[deep]` in the reporter line.
3. Download **`playwright-artifacts-<lane_slug>`** and open **trace** (Playwright trace viewer: `npx playwright show-trace <file>.zip`).
4. If the failure is **upload / hosted API**, check ingest logs and secrets; the test run may still have passed.
5. **Deep** failures: expect long runtime and data/API coupling — confirm API + web stack match the same `review-store` / env as local before re-running.
