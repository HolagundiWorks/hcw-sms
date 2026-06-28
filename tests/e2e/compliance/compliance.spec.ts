import { test, expect, navigateTo } from '../../fixtures/leos';

// Smoke-navigate to every Compliance screen and prove it renders, then drive a
// full certificate create flow end-to-end (UI -> HTTP -> SQLite). Guards against
// the kind of ribbon/route wiring regression that silently breaks new screens.
test.describe('compliance suite (UI)', () => {
  test('each compliance screen loads from the ribbon', async ({ authedPage }) => {
    const page = authedPage;
    const screens: [string, string][] = [
      ['compliance-certs', 'cert-new'],
      ['board-eligibility', 'eligibility-table'],
      ['statutory-returns', 'affiliation-no'],
      ['exam-archive', 'archive-new'],
      ['public-disclosure', 'disclosure-print'],
      ['practical-exams', 'practical-new'],
    ];
    for (const [key, marker] of screens) {
      await navigateTo(page, 'system', key);
      // Each screen exposes at least one unique testid; board-eligibility may show
      // an empty state instead of its table, so fall back to its heading.
      const byTestId = page.getByTestId(marker);
      if (key === 'board-eligibility') {
        await expect(page.getByText('Board Exam Eligibility')).toBeVisible();
      } else {
        await expect(byTestId).toBeVisible();
      }
    }
  });

  test('add a compliance certificate and see it in the register', async ({ authedPage, serverApi }) => {
    const page = authedPage;
    await navigateTo(page, 'system', 'compliance-certs');

    await page.getByTestId('cert-new').click();
    // Modal defaults: scope=school, type=Fire Safety. Just set an expiry + save.
    await page.getByTestId('cert-expiry').fill('2030-01-31');
    await page.getByTestId('cert-save').click();

    // It appears in the register table…
    await expect(page.getByTestId('cert-table')).toContainText('Fire Safety');

    // …and reached the backend.
    const res = await serverApi.get<{ certificates: { cert_type: string }[] }>('/compliance-certs?scope=school');
    expect(res.ok).toBe(true);
    expect(res.body.certificates.some((c) => c.cert_type === 'Fire Safety')).toBe(true);
  });
});
