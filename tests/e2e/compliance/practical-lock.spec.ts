import { test, expect, navigateTo } from '../../fixtures/leos';

// Drive the practical-exam SOP through the UI: schedule -> upload a mark -> lock.
// Proves the irreversible-lock workflow (the distinctive compliance feature)
// works end to end and the mark-entry form disappears once locked.
test.describe('practical-exam lock (UI)', () => {
  test('schedule, add a mark, then lock it', async ({ authedPage }) => {
    const page = authedPage;
    const subject = `Physics-${Date.now()}`;

    await navigateTo(page, 'system', 'practical-exams');

    // Schedule
    await page.getByTestId('practical-new').click();
    await page.getByTestId('practical-subject').fill(subject);
    await page.getByTestId('practical-save').click();

    // Open the new session from the register
    const row = page.getByTestId('practical-table').locator('tr', { hasText: subject });
    await expect(row).toBeVisible();
    await row.click();

    // Upload a mark, then lock
    await page.getByTestId('practical-mark-name').fill('Aarav');
    await page.getByTestId('practical-mark-add').click();
    await expect(page.getByText('Aarav')).toBeVisible();

    await page.getByTestId('practical-lock').click();

    // Locked: confirmation shown and the lock button is gone (cannot re-lock/edit).
    await expect(page.getByText(/Marks locked/i)).toBeVisible();
    await expect(page.getByTestId('practical-lock')).toHaveCount(0);
    await expect(page.getByTestId('practical-mark-add')).toHaveCount(0);
  });
});
