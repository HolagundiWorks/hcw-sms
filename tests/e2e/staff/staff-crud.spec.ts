import { test, expect, navigateTo } from '../../fixtures/leos';

// Add a staff member through the real UI, then edit them — exercising the
// shared StaffFormModal in both create and edit mode — and confirm via the API.
test.describe('staff CRUD (UI)', () => {
  test('add then edit a staff member', async ({ authedPage, serverApi }) => {
    const page = authedPage;
    const stamp = Date.now();
    const last = `UIStaff-${stamp}`;

    await navigateTo(page, 'people', 'staff');
    await expect(page.getByTestId('staff-search-input')).toBeVisible();

    // Create
    await page.getByTestId('staff-add-button').click();
    await page.getByTestId('staff-first-name-input').fill('Edie');
    await page.getByTestId('staff-last-name-input').fill(last);
    await page.getByTestId('staff-phone-input').fill('+91 90000 10101');
    await page.getByTestId('staff-form-save-button').click();
    await expect(page.getByTestId('staff-first-name-input')).toBeHidden();

    // Find the new row via search
    await page.getByTestId('staff-search-input').fill(last);
    const row = page.getByTestId('staff-row').filter({ hasText: last });
    await expect(row).toBeVisible();

    // Edit: clicking the row opens the same modal in edit mode
    await row.click();
    await expect(page.getByTestId('staff-first-name-input')).toHaveValue('Edie');
    await page.getByTestId('staff-phone-input').fill('+91 90000 20202');
    await page.getByTestId('staff-form-save-button').click();
    await expect(page.getByTestId('staff-first-name-input')).toBeHidden();

    // Backend confirmation of the edit
    const res = await serverApi.get<{ staff: { last_name: string; phone: string }[] }>(
      `/staff?q=${encodeURIComponent(last)}`,
    );
    const created = res.body.staff.find((s) => s.last_name === last);
    expect(created?.phone).toBe('+91 90000 20202');
  });
});
