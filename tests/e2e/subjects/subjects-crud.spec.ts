import { test, expect, navigateTo } from '../../fixtures/leos';

// Create a subject through the UI, then delete it (the row's trash icon deletes
// immediately — no confirm dialog), and confirm both against the backend.
test.describe('subjects CRUD (UI)', () => {
  test('create then delete a subject', async ({ authedPage, serverApi }) => {
    const page = authedPage;
    const name = `UISubject-${Date.now()}`;

    await navigateTo(page, 'academics', 'subjects');
    await expect(page.getByTestId('subject-search-input')).toBeVisible();

    // Create
    await page.getByTestId('subject-new-button').click();
    await page.getByTestId('subject-name-input').fill(name);
    await page.getByTestId('subject-code-input').fill('UIT');
    await page.getByTestId('subject-form-save-button').click();
    await expect(page.getByTestId('subject-name-input')).toBeHidden();

    // Isolate the new row via search
    await page.getByTestId('subject-search-input').fill(name);
    const row = page.getByTestId('subject-row').filter({ hasText: name });
    await expect(row).toBeVisible();

    // Confirm it reached the backend
    let res = await serverApi.get<{ subjects: { name: string }[] }>(
      `/subjects?q=${encodeURIComponent(name)}`,
    );
    expect(res.body.subjects.some((s) => s.name === name)).toBe(true);

    // Delete (immediate)
    await row.getByTestId('subject-delete-button').click();
    await expect(page.getByTestId('subject-row').filter({ hasText: name })).toHaveCount(0);

    // Confirm it's gone from the backend too
    res = await serverApi.get<{ subjects: { name: string }[] }>(
      `/subjects?q=${encodeURIComponent(name)}`,
    );
    expect(res.body.subjects.some((s) => s.name === name)).toBe(false);
  });
});
