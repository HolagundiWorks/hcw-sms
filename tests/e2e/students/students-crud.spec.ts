import { test, expect, navigateTo } from '../../fixtures/leos';

// Create a student through the real UI, confirm it appears in the list, and
// confirm it actually reached the backend. This is the end-to-end proof that
// the browser-mode harness exercises UI -> HTTP API -> SQLite.
test.describe('students CRUD (UI)', () => {
  test('admit a new student and see it in the list + backend', async ({ authedPage, serverApi }) => {
    const page = authedPage;
    const stamp = Date.now();
    const last = `Uitest-${stamp}`;

    await navigateTo(page, 'people', 'students');
    await expect(page.getByTestId('students-search-input')).toBeVisible();

    // Create (tabbed admit form — Identity tab is the default).
    await page.getByTestId('student-admit-button').click();
    await page.getByTestId('student-first_name').fill('Playwright');
    await page.getByTestId('student-last_name').fill(last);
    await page.getByTestId('student-form-save-button').click();

    // The modal closes on success; then find the new row via search.
    await expect(page.getByTestId('student-first_name')).toBeHidden();
    await page.getByTestId('students-search-input').fill(last);

    const row = page.getByTestId('student-row').filter({ hasText: last });
    await expect(row).toBeVisible();

    // Backend confirmation — the student exists via the API too.
    const res = await serverApi.get<{ students: { last_name: string }[] }>(
      `/students?q=${encodeURIComponent(last)}`,
    );
    expect(res.ok).toBe(true);
    expect(res.body.students.some((s) => s.last_name === last)).toBe(true);
  });
});
