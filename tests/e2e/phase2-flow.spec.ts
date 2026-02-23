import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

function readEnvFileValue(key: string) {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    return undefined;
  }

  const lines = fs.readFileSync(envPath, "utf-8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const [entryKey, ...rest] = trimmed.split("=");
    if (entryKey === key) {
      return rest.join("=").trim();
    }
  }

  return undefined;
}

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? readEnvFileValue("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? readEnvFileValue("SUPABASE_SERVICE_ROLE_KEY");
const hasAdminEnv = Boolean(supabaseUrl && serviceRoleKey);

test.describe("Phase 2 flow", () => {
  test.skip(!hasAdminEnv, "Supabase admin env vars are required for deterministic E2E.");

  test("create project -> session -> upload -> analyze -> actions", async ({ page }) => {
    const supabaseAdmin = createClient(supabaseUrl!, serviceRoleKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const suffix = Date.now();
    const email = `pitchloop-e2e-${suffix}@example.com`;
    const password = `Pitchloop!${suffix}`;

    const { data: createdUser, error: createUserError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
    expect(createUserError).toBeNull();
    const userId = createdUser.user?.id;

    try {
      await page.goto("/login");
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password").fill(password);
      await page.getByRole("button", { name: "Sign in" }).click();
      await expect(page).toHaveURL(/\/dashboard\/projects/);

      const projectTitle = `E2E Project ${suffix}`;
      await page.getByRole("button", { name: "Create project" }).click();
      await page.getByLabel("Title").fill(projectTitle);
      await page.getByLabel("Goal").fill("Validate transcript-first rehearsal loop");
      await page.getByLabel("Audience").fill("Demo panel");
      await page.getByLabel("Target duration (seconds)").fill("180");
      await page.getByRole("button", { name: "Save project" }).click();
      const projectCard = page.locator("div").filter({ hasText: projectTitle }).first();
      await expect(projectCard).toBeVisible();
      await projectCard.getByRole("link", { name: "View project" }).click();

      const sessionTitle = `Session ${suffix}`;
      await page.getByRole("button", { name: "New session" }).click();
      await page.getByLabel("Session title").fill(sessionTitle);
      await page.getByRole("button", { name: "Save session" }).click();
      const sessionCard = page.locator("div").filter({ hasText: sessionTitle }).first();
      await expect(sessionCard).toBeVisible();
      await sessionCard.getByRole("link", { name: "Open session" }).click();

      await page.locator('input[name="media"]').setInputFiles({
        name: "sample.wav",
        mimeType: "audio/wav",
        buffer: Buffer.from("RIFF....WAVEfmt ", "utf-8"),
      });
      await page.getByRole("button", { name: "Upload media" }).click();
      await expect(page.getByText("MB")).toBeVisible();

      await page
        .locator('textarea[name="transcriptText"]')
        .fill("um like this is a test transcript uh with fillers and structure");
      await page.getByRole("button", { name: "Run Analysis" }).click();

      await expect(page.getByText(/WPM/)).toBeVisible();
      await expect(page.getByRole("heading", { name: "Feedback" })).toBeVisible();
      await expect(page.locator("li").first()).toBeVisible();

      await page.getByRole("button", { name: "Generate Next Actions" }).click();
      await expect(page.getByRole("heading", { name: "Action checklist" })).toBeVisible();
      await expect(
        page.getByText("No action items yet. Add your first improvement."),
      ).toHaveCount(0);
    } finally {
      if (userId) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      }
    }
  });
});
