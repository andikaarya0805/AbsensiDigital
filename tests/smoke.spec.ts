import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  // Since it's a login-protected app or a landing page, we expect something relevant to HadirMu
  await expect(page).toHaveTitle(/HadirMu|Login|Presensi/i);
});

test('login page loads', async ({ page }) => {
  await page.goto('/login');
  // Basic check for common login elements
  const bodyText = await page.innerText('body');
  expect(bodyText).toMatch(/NIS|NIP|Nomor Induk/i);
});
