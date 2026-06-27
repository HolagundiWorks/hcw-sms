// LEOS Playwright fixtures.
//
// Provides reusable entry points so specs don't re-implement the two pre-app
// gates (open school file -> unlock master key) and login every time:
//   * page         — raw page (from @playwright/test)
//   * gatedPage    — past the welcome/master-key gate, sitting on the login form
//   * authedPage   — logged in as admin, cockpit shell visible
//   * serverApi    — ApiClient pointed at the same isolated server the UI uses
//   * dbPath       — path to that server's live SQLite, for persistence asserts
import { test as base, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import { ApiClient } from '../helpers/api';
import { ADMIN_PASS, ADMIN_USER, DEFAULT_SCHOOL_FILE, MASTER_KEY } from '../helpers/env';
import { SERVER_INFO_FILE } from '../global/playwright-global';

interface ServerInfo {
  baseUrl: string;
  dbPath: string;
  dataDir: string;
}

function serverInfo(): ServerInfo {
  return JSON.parse(fs.readFileSync(SERVER_INFO_FILE, 'utf8')) as ServerInfo;
}

/** Open the school file and unlock it with the master key. Lands on login. */
export async function passGate(page: Page) {
  await page.goto('/');
  await page.getByTestId('school-file-input').fill(DEFAULT_SCHOOL_FILE);
  await page.getByTestId('open-school-file-button').click();
  await page.getByTestId('master-key-input').fill(MASTER_KEY);
  await page.getByTestId('unlock-continue-button').click();
  await expect(page.getByTestId('login-form')).toBeVisible();
}

/** From the login form, sign in as admin and wait for the cockpit shell. */
export async function login(page: Page, username = ADMIN_USER, password = ADMIN_PASS) {
  await page.getByTestId('login-username-input').fill(username);
  await page.getByTestId('login-password-input').fill(password);
  await page.getByTestId('login-submit-button').click();
  await expect(page.getByTestId('cockpit-shell')).toBeVisible();
}

/** Navigate to a module via the ribbon: select its tab, then its action. */
export async function navigateTo(page: Page, tabId: string, moduleKey: string) {
  await page.getByTestId(`ribbon-tab-${tabId}`).click();
  await page.getByTestId(`nav-${moduleKey}`).click();
}

export const test = base.extend<{
  gatedPage: Page;
  authedPage: Page;
  serverApi: ApiClient;
  dbPath: string;
}>({
  gatedPage: async ({ page }, use) => {
    await passGate(page);
    await use(page);
  },
  authedPage: async ({ page }, use) => {
    await passGate(page);
    await login(page);
    await use(page);
  },
  serverApi: async ({}, use) => {
    const client = new ApiClient(serverInfo().baseUrl);
    await client.login();
    await use(client);
  },
  dbPath: async ({}, use) => {
    await use(serverInfo().dbPath);
  },
});

export { expect };
