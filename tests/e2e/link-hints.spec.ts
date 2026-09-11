import { readFile } from 'node:fs/promises';
import { test, expect, type Page } from '@playwright/test';

async function expectHints(page: Page) {
  // Headless UI's invisible focus guards are not user-facing controls.
  const missing = await page.locator('a[href]:visible, button:not([data-headlessui-focus-guard]):visible, input:visible, select:visible, textarea:visible').evaluateAll((nodes) => nodes
    .filter((node) => !node.getAttribute('title')?.trim())
    .map((node) => node.outerHTML.slice(0, 240)));
  expect(missing).toEqual([]);
}

test('home, consent and dialogs have localized link and control hints in every language', async ({ page }) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && /MISSING_MESSAGE|hydrat|script tag while rendering/i.test(message.text())) errors.push(message.text());
  });
  await page.route('**/_vercel/**', (route) => route.fulfill({ body: '', contentType: 'application/javascript' }));
  for (const locale of ['en', 'ja', 'zh-hans', 'zh-hant', 'ko', 'fr', 'de', 'it', 'es']) {
    const messages = JSON.parse(await readFile(`src/messages/${locale}.json`, 'utf8'));
    await page.goto(locale === 'en' ? '/' : `/${locale}`);
    await expect(page.getByRole('combobox')).toBeEnabled();
    await expectHints(page);
    const decline = page.getByRole('button', { name: messages.cookieConsent.decline, exact: true });
    if (await decline.isVisible()) await decline.click();
    for (const dialog of ['about', 'settings', 'language']) {
      await page.getByRole('button', { name: messages.navbar[dialog], exact: true }).click();
      await expect(page.getByRole('dialog').getByRole('heading', { level: 2 }).first()).toBeVisible();
      await expectHints(page);
      if (dialog === 'language') {
        const current = page.getByRole('dialog').locator('a[aria-current="page"]');
        await expect(current).toHaveAttribute('hreflang', locale);
        await current.click();
      } else {
        await page.getByRole('dialog').getByRole('button', { name: messages.common.close, exact: true }).click();
      }
      await expect(page.getByRole('dialog')).toHaveCount(0);
    }
  }
  expect(errors).toEqual([]);
});
