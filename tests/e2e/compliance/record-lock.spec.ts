import { test, expect, navigateTo } from '../../fixtures/leos';

// The flagship compliance flow through the real UI: admit a student, open the
// profile's Compliance tab, advance the CBSE lock lifecycle, and confirm the
// change is reflected in the lock badge and the audit trail.
test.describe('student record-lock (UI)', () => {
  test('advance the lock lifecycle and see it audited', async ({ authedPage }) => {
    const page = authedPage;
    const last = `Lockui-${Date.now()}`;

    await navigateTo(page, 'people', 'students');

    // Admit a fresh student (starts in Draft).
    await page.getByTestId('student-admit-button').click();
    await page.getByTestId('student-first_name').fill('Lock');
    await page.getByTestId('student-last_name').fill(last);
    await page.getByTestId('student-form-save-button').click();
    await expect(page.getByTestId('student-first_name')).toBeHidden();

    // Open the profile.
    await page.getByTestId('students-search-input').fill(last);
    const row = page.getByTestId('student-row').filter({ hasText: last });
    await expect(row).toBeVisible();
    await row.click();

    // Compliance tab → lifecycle starts at Draft.
    await page.getByRole('tab', { name: 'Compliance' }).click();
    await expect(page.getByTestId('lock-state')).toHaveText('Draft');

    // Advance one stage.
    await page.getByTestId('lock-advance').click();
    await expect(page.getByTestId('lock-state')).toHaveText('Parent Verified');

    // The transition is recorded in the audit trail.
    await expect(page.getByTestId('audit-timeline')).toContainText('Lock advanced');
  });
});
