import { test, expect, passGate } from '../../fixtures/leos';

// @smoke — the fastest "is the app fundamentally alive" checks.
test.describe('@smoke app boot', () => {
  test('welcome / school-file gate renders', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('school-file-input')).toBeVisible();
    await expect(page.getByTestId('open-school-file-button')).toBeVisible();
  });

  test('opening the demo school file reaches the login form', async ({ page }) => {
    await passGate(page);
    await expect(page.getByTestId('login-form')).toBeVisible();
    await expect(page.getByTestId('login-submit-button')).toBeVisible();
  });
});
