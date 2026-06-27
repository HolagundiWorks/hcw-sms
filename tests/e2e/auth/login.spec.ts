import { test, expect, passGate, login } from '../../fixtures/leos';

test.describe('login', () => {
  test('wrong password shows an error and stays on the login form', async ({ page }) => {
    await passGate(page);
    await page.getByTestId('login-username-input').fill('admin');
    await page.getByTestId('login-password-input').fill('wrong-password');
    await page.getByTestId('login-submit-button').click();

    await expect(page.getByTestId('login-error')).toBeVisible();
    await expect(page.getByTestId('login-form')).toBeVisible();
  });

  test('valid admin credentials open the cockpit', async ({ page }) => {
    await passGate(page);
    await login(page); // asserts cockpit-shell becomes visible
    await expect(page.getByTestId('cockpit-shell')).toBeVisible();
  });
});
