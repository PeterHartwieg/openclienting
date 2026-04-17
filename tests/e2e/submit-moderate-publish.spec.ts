/**
 * Suite 5 — Playwright smoke: submit → moderate → publish
 *
 * Golden path:
 *   1. Mint a magic-link for the seeded moderator via dev-login.mjs
 *   2. Sign in by navigating to the magic-link URL
 *   3. Submit a new problem via the /submit form
 *   4. Navigate to the moderation queue and approve the problem
 *   5. Navigate to /problems and assert the title is visible
 *   6. Cleanup: delete the seeded problem via admin Supabase client
 *
 * Guards:
 *   - Skipped unless PLAYWRIGHT_BASE_URL is set (or a dev server is reachable).
 *     In practice the playwright.config.ts will start `npm run dev` automatically
 *     when reuseExistingServer is true, so local runs work without the env var.
 *   - afterAll deletes any rows with the "e2e-smoke-" prefix older than 1 hour
 *     as a safety net for aborted runs.
 *
 * Run:
 *   PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test tests/e2e/submit-moderate-publish.spec.ts
 *
 * Or simply:
 *   npm run test:e2e
 * (playwright.config.ts starts npm run dev automatically when no server is running)
 */

import { test, expect } from "@playwright/test";
import { execSync } from "child_process";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// ---------------------------------------------------------------------------
// Load .env.local so we can reach Supabase for cleanup
// ---------------------------------------------------------------------------
function loadEnv() {
  const envPath = resolve(__dirname, "../../.env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.+)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

function adminClient() {
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ---------------------------------------------------------------------------
// Guard: skip when the preview server is not configured / reachable.
// The PLAYWRIGHT_BASE_URL env var is the signal that a live server exists.
// When running via `npm run test:e2e` locally, playwright.config.ts starts
// npm run dev automatically (reuseExistingServer: true), so you don't need
// to set PLAYWRIGHT_BASE_URL explicitly — but CI must set it.
// ---------------------------------------------------------------------------
const SKIP_E2E = !process.env.PLAYWRIGHT_BASE_URL && process.env.CI === "true";

// Use describe.skip to avoid silent false-positives when no server is available
const maybeDescribe = SKIP_E2E ? test.describe.skip : test.describe;

maybeDescribe("submit → moderate → publish", () => {
  const SMOKE_PREFIX = "e2e-smoke-";
  let problemTitle: string;
  let problemId: string | null = null;

  // -------------------------------------------------------------------------
  // afterAll: delete any e2e-smoke-* problems older than 1 hour (safety net)
  // -------------------------------------------------------------------------
  test.afterAll(async () => {
    if (!SERVICE_KEY) return;
    const admin = adminClient();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    // Delete the specific problem we created
    if (problemId) {
      await admin.from("problem_templates").delete().eq("id", problemId);
    }

    // Cleanup any orphaned smoke rows older than 1 hour
    await admin
      .from("problem_templates")
      .delete()
      .like("title", `${SMOKE_PREFIX}%`)
      .lt("created_at", oneHourAgo);
  });

  test("full golden path", async ({ page }) => {
    // Unique title to identify this test's row
    problemTitle = `${SMOKE_PREFIX}${Date.now()}`;

    // -----------------------------------------------------------------------
    // Step 1: Mint magic-link for seeded moderator
    // dev-login.mjs prints the URL on its last line
    // -----------------------------------------------------------------------
    const loginOutput = execSync(
      `node scripts/dev-login.mjs --role=moderator --port=3000 --next=/en/submit`,
      { cwd: resolve(__dirname, "../.."), encoding: "utf-8" },
    );
    const loginUrl = loginOutput.trim().split("\n").at(-1)?.trim();
    expect(loginUrl).toMatch(/^http:\/\/localhost:\d+\/auth\/confirm/);

    // -----------------------------------------------------------------------
    // Step 2: Navigate to magic-link → authenticated as moderator
    // -----------------------------------------------------------------------
    await page.goto(loginUrl!);
    // After auth confirm the app redirects to /en/submit
    await page.waitForURL("**/en/submit", { timeout: 15_000 });

    // -----------------------------------------------------------------------
    // Step 3: Fill the submit form
    // The form requires title, description, and at least one tag.
    // -----------------------------------------------------------------------
    await page.getByLabel(/title/i).fill(problemTitle);
    await page.getByLabel(/description/i).fill(
      "This is an automated e2e smoke test problem. It will be approved and then deleted.",
    );

    // Select the first available tag (tag selector renders checkboxes/buttons)
    // Attempt to click the first tag option visible in the TagSelector
    const firstTag = page.locator('[data-tag-selector] input[type="checkbox"]').first();
    if (await firstTag.isVisible()) {
      await firstTag.check();
    } else {
      // Fallback: click the first tag button/label rendered by TagSelector
      await page.locator("text=/^[A-Z]/" ).first().click({ timeout: 3000 }).catch(() => {});
    }

    // Submit the form
    await page.getByRole("button", { name: /submit/i }).click();

    // Wait for navigation away from /submit (success redirects or shows confirmation)
    await page.waitForURL(/problems|dashboard|moderate/, { timeout: 15_000 });

    // -----------------------------------------------------------------------
    // Step 4: Navigate to moderation problems queue and approve our problem
    // -----------------------------------------------------------------------
    await page.goto("/en/moderate/problems");
    await page.waitForLoadState("networkidle");

    // Find the card matching our title
    const problemCard = page.locator(`text="${problemTitle}"`).first();
    await expect(problemCard).toBeVisible({ timeout: 10_000 });

    // Click through to the detail page
    await problemCard.click();
    await page.waitForLoadState("networkidle");

    // Capture the problem ID from the URL: /en/moderate/problems/<uuid>
    const url = page.url();
    const idMatch = url.match(/\/moderate\/problems\/([0-9a-f-]{36})/);
    if (idMatch) problemId = idMatch[1];

    // Click Approve
    await page.getByRole("button", { name: /approve/i }).click();

    // Wait for the page to refresh after approval
    await page.waitForLoadState("networkidle");

    // -----------------------------------------------------------------------
    // Step 5: Navigate to public problems list and assert title is visible
    // -----------------------------------------------------------------------
    await page.goto("/en/problems");
    await page.waitForLoadState("networkidle");

    await expect(page.locator(`text="${problemTitle}"`).first()).toBeVisible({ timeout: 10_000 });
  });
});

// ---------------------------------------------------------------------------
// Note for CI / missing preview server:
//   Set PLAYWRIGHT_BASE_URL=https://your-preview.vercel.app before running.
//   The test suite will be SKIPPED (not failed) when CI=true and
//   PLAYWRIGHT_BASE_URL is not set, to avoid blocking the PR pipeline.
//
// Manual run command:
//   PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test tests/e2e/submit-moderate-publish.spec.ts
// ---------------------------------------------------------------------------
