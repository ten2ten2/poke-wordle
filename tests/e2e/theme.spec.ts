import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cookie-consent', 'declined'));
  await page.route('**/_vercel/**', (route) => route.fulfill({ body: '', contentType: 'application/javascript' }));
});

test('stored theme applies before React loads, even when it differs from the system', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.addInitScript(() => {
    localStorage.setItem('poke-wordle-theme', 'dark');
    window.addEventListener('poke-wordle-theme-change', () => performance.mark('theme-applied'), { once: true });
  });
  await page.route('**/_next/static/**/*.js', (route) => route.abort());
  await page.route('**/theme.js', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.continue();
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(17, 19, 24)');
  await expect(page.locator('header').first()).toHaveCSS('background-color', 'rgb(27, 30, 36)');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#111318');
  await expect(page.locator('button:has(.theme-sun)')).toBeDisabled();
  await expect.poll(() => page.evaluate(() => performance.getEntriesByName('first-contentful-paint').length)).toBe(1);
  const timing = await page.evaluate(() => ({
    theme: performance.getEntriesByName('theme-applied')[0].startTime,
    paint: performance.getEntriesByName('first-contentful-paint')[0].startTime,
  }));
  expect(timing.theme).toBeLessThanOrEqual(timing.paint);
});

test('theme persists across all page types, language changes and reloads', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && /hydrat|script tag while rendering React component/i.test(message.text())) errors.push(message.text());
  });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Switch to dark mode', exact: true });
  await expect(toggle.locator('.theme-sun')).toBeVisible();
  await expect(toggle.locator('.theme-moon')).toBeHidden();
  await toggle.click();
  await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Switch to light mode' }).locator('.theme-moon')).toBeVisible();
  await page.getByRole('link', { name: 'Knowledge', exact: true }).click();
  await expect(page).toHaveURL('/knowledge');
  await page.getByRole('link', { name: /Why do forms have different Mega Evolution tags/ }).click();
  await expect(page).toHaveURL(/\/knowledge\//);
  await page.getByRole('button', { name: 'Language', exact: true }).click();
  await page.getByRole('link', { name: 'Switch to 简体中文', exact: true }).click();
  await expect(page).toHaveURL(/\/zh-hans\/knowledge\//);
  await expect(page.getByRole('button', { name: '切换到日间模式', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '切换到日间模式', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: '切换到夜间模式', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(errors).toEqual([]);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('.card').first()).toHaveCSS('background-color', 'rgb(27, 30, 36)');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#111318');
  await page.goto('/privacy-and-terms');
  await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible();
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await expect(page.locator('.card').first()).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  expect(errors).toEqual([]);
});

test('system changes apply until a manual choice, and changes sync across tabs', async ({ page, context }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible();
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await page.emulateMedia({ colorScheme: 'light' });
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  const other = await context.newPage();
  await other.goto('/privacy-and-terms');
  await other.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await other.evaluate(() => localStorage.removeItem('poke-wordle-theme'));
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await other.close();
});

test('the toggle still works when browser storage is unavailable', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } }));
  await page.goto('/knowledge');
  await page.getByRole('button', { name: 'Decline', exact: true }).click();
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('the extra header control fits at 320px in every language', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  for (const locale of ['', 'ja', 'zh-hans', 'zh-hant', 'ko', 'fr', 'de', 'it', 'es']) {
    await page.goto(`/${locale}`);
    const nav = page.getByRole('navigation').first();
    await expect(nav.locator('button')).toHaveCount(4);
    await expect(async () => {
      const [, , theme, language] = await nav.locator('button').evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().toJSON()));
      expect(theme.width).toBeGreaterThanOrEqual(44);
      expect(language.width).toBeGreaterThanOrEqual(44);
      expect(theme.right).toBeLessThanOrEqual(language.left);
      expect(language.right).toBeLessThanOrEqual(320);
    }).toPass();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
