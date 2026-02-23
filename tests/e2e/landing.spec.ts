import { expect, test } from "@playwright/test";

test("landing page shows CTA", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: /open dashboard/i }),
  ).toBeVisible();
});
