import { test, expect, type BrowserContext } from '@playwright/test';

const measurementId = process.env.GA4_E2E_MEASUREMENT_ID;
const tagURL = 'https://www.googletagmanager.com/gtag/js?*';
// Initial and history events can differ in whether they include the local port.
function analyticsURL(url: string) {
  const location = new URL(url);
  location.port = '';
  return location.href;
}

const collectURL = /https:\/\/([a-z0-9.-]*google-analytics\.com|analytics\.google\.com)\/.*collect/;

async function captureAnalytics(context: BrowserContext) {
  const events: Record<string, string>[] = [];
  // Load the real Google tag, but never send test traffic to the GA property.
  await context.route(collectURL, async (route) => {
    const request = route.request();
    for (const line of (request.postData() ?? '').split('\n')) {
      const params = new URLSearchParams(new URL(request.url()).search);
      for (const [key, value] of new URLSearchParams(line)) params.set(key, value);
      events.push(Object.fromEntries(params));
    }
    await route.fulfill({ status: 204 });
  });
  await context.route('**/_vercel/**', (route) => route.fulfill({ body: '', contentType: 'application/javascript' }));
  return events;
}

test('privacy preferences can be reopened on every page without changing the saved choice', async ({ page, context }) => {
  await context.route(tagURL, (route) => route.abort());
  await context.route(collectURL, (route) => route.fulfill({ status: 204 }));
  await page.addInitScript(() => localStorage.setItem('cookie-consent', 'declined'));
  for (const path of ['/', '/knowledge', '/knowledge/late-bloomers-pokemon', '/privacy-and-terms']) {
    await page.goto(path);
    const banner = page.getByRole('complementary', { name: 'Privacy preferences' });
    await page.locator('footer').getByRole('button', { name: 'Privacy preferences' }).click();
    await expect(banner).toBeVisible();
    await banner.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(banner).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem('cookie-consent'))).toBe('declined');
  }
});

test.describe('GA4 with the real Google tag', () => {
  test.skip(!measurementId, 'Build with NEXT_PUBLIC_GA_MEASUREMENT_ID and set GA4_E2E_MEASUREMENT_ID to the same ID.');
  test.setTimeout(120_000);

  test('default collection, SPA page views, opt-out and re-enabling', async ({ page, context }) => {
    const events = await captureAnalytics(context);
    const pageViews = () => events.filter((event) => event.en === 'page_view');
    await page.goto('/');
    await expect.poll(() => pageViews().length, { timeout: 20_000 }).toBe(1);
    expect({ ...pageViews()[0], dl: analyticsURL(pageViews()[0].dl) }).toMatchObject({ tid: measurementId, dl: analyticsURL(page.url()), dt: await page.title() });
    expect((await context.cookies()).some((cookie) => cookie.name === '_ga')).toBe(true);

    const banner = page.getByRole('complementary', { name: 'Privacy preferences' });
    await banner.getByRole('button', { name: 'Close', exact: true }).click();
    expect(await page.evaluate(() => localStorage.getItem('cookie-consent'))).toBeNull();
    await page.locator('footer').getByRole('button', { name: 'Privacy preferences' }).click();
    await banner.getByRole('button', { name: 'Accept', exact: true }).click();

    await page.locator('footer a[href="/knowledge"]').click();
    await expect(page).toHaveURL('/knowledge');
    await expect.poll(() => pageViews().length, { timeout: 20_000 }).toBe(2);
    expect({ ...pageViews()[1], dl: analyticsURL(pageViews()[1].dl) }).toMatchObject({ dl: analyticsURL(page.url()), dt: await page.title() });
    await page.locator('main a[href^="/knowledge/"]').first().click();
    await expect(page).toHaveURL(/\/knowledge\/[^/]+$/);
    await expect.poll(() => pageViews().length, { timeout: 20_000 }).toBe(3);
    expect({ ...pageViews()[2], dl: analyticsURL(pageViews()[2].dl) }).toMatchObject({ dl: analyticsURL(page.url()), dt: await page.title() });

    await page.getByRole('button', { name: 'Language', exact: true }).click();
    await page.getByRole('link', { name: 'Switch to 简体中文', exact: true }).click();
    await expect(page).toHaveURL(/\/zh-hans\/knowledge\//);
    await expect.poll(() => pageViews().length, { timeout: 20_000 }).toBe(4);
    expect({ ...pageViews()[3], dl: analyticsURL(pageViews()[3].dl) }).toMatchObject({ dl: analyticsURL(page.url()), dt: await page.title() });

    await page.locator('footer').getByRole('button', { name: '隐私偏好' }).click();
    await page.getByRole('button', { name: '拒绝', exact: true }).click();
    await expect.poll(() => page.evaluate((id) => window[`ga-disable-${id}`], measurementId)).toBe(true);
    expect((await context.cookies()).filter((cookie) => /^_ga(?:_|$)/.test(cookie.name))).toEqual([]);
    // Let events collected before opt-out finish their existing batch.
    await page.waitForTimeout(7000);
    const countBeforeNavigation = events.length;
    await page.locator('footer a[href="/zh-hans/knowledge"]').click();
    await expect(page).toHaveURL('/zh-hans/knowledge');
    // Google batches events; allow time for an unwanted request to surface.
    await page.waitForTimeout(7000);
    expect(events).toHaveLength(countBeforeNavigation);

    await page.locator('footer').getByRole('button', { name: '隐私偏好' }).click();
    await page.getByRole('button', { name: '接受', exact: true }).click();
    await page.locator('footer a[href="/zh-hans/privacy-and-terms"]').click();
    await expect(page).toHaveURL('/zh-hans/privacy-and-terms');
    await expect.poll(() => pageViews().length, { timeout: 20_000 }).toBe(5);
    expect({ ...pageViews()[4], dl: analyticsURL(pageViews()[4].dl) }).toMatchObject({ dl: analyticsURL(page.url()), dt: await page.title() });
  });

  test('a saved decline prevents loading the tag and changes sync across tabs', async ({ page, context }) => {
    const events = await captureAnalytics(context);
    const tagRequests: string[] = [];
    context.on('request', (request) => {
      if (request.url().startsWith('https://www.googletagmanager.com/gtag/js')) tagRequests.push(request.url());
    });
    await context.addInitScript(() => localStorage.setItem('cookie-consent', 'declined'));
    await page.goto('/');
    await expect(page.getByRole('combobox')).toBeEnabled();
    await page.waitForTimeout(1000);
    expect(tagRequests).toEqual([]);
    expect(events).toEqual([]);
    const other = await context.newPage();
    await other.goto('/privacy-and-terms');
    await other.locator('footer').getByRole('button', { name: 'Privacy preferences' }).click();
    await other.getByRole('button', { name: 'Accept', exact: true }).click();
    await expect.poll(() => events.filter((event) => event.en === 'page_view').length, { timeout: 20_000 }).toBe(2);
    await other.locator('footer').getByRole('button', { name: 'Privacy preferences' }).click();
    await other.getByRole('button', { name: 'Decline', exact: true }).click();
    await expect.poll(() => page.evaluate((id) => window[`ga-disable-${id}`], measurementId)).toBe(true);
    await other.close();
  });

  test('opting out during tag loading does not initialize analytics', async ({ page, context }) => {
    const events = await captureAnalytics(context);
    let release!: () => void;
    const hold = new Promise<void>((resolve) => { release = resolve; });
    let requested = false;
    await context.route(tagURL, async (route) => {
      requested = true;
      await hold;
      await route.continue();
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect.poll(() => requested).toBe(true);
    await page.getByRole('button', { name: 'Decline', exact: true }).click();
    const loaded = page.waitForResponse((response) => response.url().startsWith('https://www.googletagmanager.com/gtag/js'));
    release();
    await loaded;
    await page.waitForTimeout(7000);
    expect(events).toEqual([]);
    expect((await context.cookies()).filter((cookie) => /^_ga(?:_|$)/.test(cookie.name))).toEqual([]);
    await page.locator('footer').getByRole('button', { name: 'Privacy preferences' }).click();
    await page.getByRole('button', { name: 'Accept', exact: true }).click();
    await expect.poll(() => events.filter((event) => event.en === 'page_view').length, { timeout: 20_000 }).toBe(1);
  });

  test('opting out still stops collection when browser storage is unavailable', async ({ page, context }) => {
    const events = await captureAnalytics(context);
    await page.addInitScript(() => Object.defineProperty(window, 'localStorage', {
      get() { throw new DOMException('Blocked', 'SecurityError'); },
    }));
    await page.goto('/');
    await expect.poll(() => events.filter((event) => event.en === 'page_view').length, { timeout: 20_000 }).toBe(1);
    await page.getByRole('button', { name: 'Decline', exact: true }).click();
    await expect.poll(() => page.evaluate((id) => window[`ga-disable-${id}`], measurementId)).toBe(true);
    await page.waitForTimeout(7000);
    const count = events.length;
    await page.locator('footer a[href="/knowledge"]').click();
    await expect(page).toHaveURL('/knowledge');
    await page.waitForTimeout(7000);
    expect(events).toHaveLength(count);
  });
});
