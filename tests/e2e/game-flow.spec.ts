import { test, expect, type Page } from '@playwright/test';
import pokemon from '../../src/data/pokemon_data.json';
import knowledge from '../../src/data/knowledge_data.json';

const target = pokemon.find((p) => p.name === 'charmander')!;
const settings = {
  maxGuesses: 10,
  selectedGenerations: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  isPrankster: false,
  isGenArrow: false,
  guessOrder: 'reverse',
};

async function guess(page: Page, name: string) {
  await page.getByRole('textbox').fill(name);
  const response = page.waitForResponse('/api/checkGuess');
  await page.getByRole('textbox').press('Enter');
  expect((await response).ok()).toBeTruthy();
  await expect(page.getByRole('textbox')).toBeEnabled();
}

test.beforeEach(async ({ page }) => {
  // Gameplay tests are independent of remote artwork and hosting analytics.
  await page.route('**/_next/image?**', (route) =>
    route.fulfill({
      path: 'public/images/icon-96x96.png',
      contentType: 'image/png',
    }),
  );
  await page.route('**/_vercel/**', (route) =>
    route.fulfill({ body: '', contentType: 'application/javascript' }),
  );
  await page.addInitScript(
    ({ target, settings }) => {
      for (const locale of [
        'en',
        'ja',
        'zh-hans',
        'zh-hant',
        'fr',
        'de',
        'es',
        'it',
        'ko',
      ])
        localStorage.setItem(`hasSeenAbout_${locale}`, 'true');
      localStorage.setItem('cookie-consent', 'declined');
      if (!localStorage.getItem('poke-wordle-progress')) {
        localStorage.setItem('poke-wordle-settings', JSON.stringify(settings));
        localStorage.setItem(
          'poke-wordle-progress',
          JSON.stringify({
            targetPokemon: target,
            guesses: [],
            selectedGenerations: settings.selectedGenerations,
            isGameOver: false,
            isWon: false,
          }),
        );
      }
    },
    { target, settings },
  );
});

test('guesses survive refresh with the same target', async ({ page }) => {
  await page.goto('/');
  await guess(page, 'Pikachu');
  await expect(page.locator('.guess-table-card')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('.guess-table-card')).toHaveCount(1);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('poke-wordle-progress')!).targetPokemon
          .id,
    ),
  ).toBe(target.id);
});

test('autocomplete supports keyboard selection', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox').fill('Pikachu');
  await expect(
    page.getByRole('button', { name: 'Pikachu', exact: true }),
  ).toBeVisible();
  await page.getByRole('textbox').press('ArrowDown');
  await page.getByRole('textbox').press('Enter');
  await expect(page.getByRole('textbox')).toHaveValue('Pikachu');
  await page.getByRole('textbox').press('Enter');
  await expect(page.locator('.guess-table-card')).toHaveCount(1);
});

test('guess ordering is persisted when settings change', async ({ page }) => {
  await page.goto('/');
  await guess(page, 'Pikachu');
  await guess(page, 'Bulbasaur');
  await expect(page.locator('.guess-table-card').first()).toContainText(
    'Bulbasaur',
  );
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: /Normal Order/ }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('.guess-table-card').first()).toContainText(
    'Pikachu',
  );
  await page.reload();
  await expect(page.locator('.guess-table-card').first()).toContainText(
    'Pikachu',
  );
});

test('changing settings cancels an outstanding guess', async ({ page }) => {
  let release!: () => void;
  const blocked = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/checkGuess', async (route) => {
    const response = await route.fetch();
    await blocked;
    await route.fulfill({ response }).catch(() => {});
  });
  await page.goto('/');
  await page.getByRole('textbox').fill('Charmander');
  const request = page.waitForRequest('**/api/checkGuess');
  await page.getByRole('textbox').press('Enter');
  await request;
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: '5', exact: true }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  release();
  await expect(page.getByRole('textbox')).toBeEnabled();
  await expect(page.locator('.guess-table-card')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('winning reveals the answer and restart enables input', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('textbox').fill('Charmander');
  await page.getByRole('textbox').press('Enter');
  await expect(
    page
      .getByRole('dialog')
      .getByRole('heading', { name: 'Congratulations!', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('Charmander');
  await page.getByRole('button', { name: 'Play Again', exact: true }).click();
  await expect(page.getByRole('textbox')).toBeEnabled();
  await expect(page.locator('.guess-table-card')).toHaveCount(0);
  await page.getByRole('textbox').fill('Pikachu');
  const nextGuess = page.waitForResponse('/api/checkGuess');
  await page.getByRole('textbox').press('Enter');
  if (!(await (await nextGuess).json()).isCorrect) {
    await page.getByRole('button', { name: 'Give Up', exact: true }).click();
  }
  await expect(page.getByRole('dialog')).toContainText('Play Again');
});

test('giving up reveals the answer', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Give Up', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Charmander');
});

test('language switch updates the route and document language', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Language', exact: true }).click();
  await page.getByRole('button', { name: 'Switch to 简体中文' }).click();
  await expect(page).toHaveURL('/zh-hans');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-hans');
  await expect(page.getByRole('textbox')).toHaveAttribute(
    'placeholder',
    /宝可梦/,
  );
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-hans');
});

for (const [locale, articles] of Object.entries(knowledge)) {
  const article = articles[0];
  test(`renders the ${locale} MDX article and valid language alternates`, async ({
    page,
    request,
  }) => {
    const path = `${locale === 'en' ? '' : '/' + locale}/knowledge/${encodeURIComponent(article.slug)}`;
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(path);
    await expect(
      page.getByRole('heading', { level: 1, name: article.title }),
    ).toBeVisible();
    await expect(page.locator('.prose')).not.toBeEmpty();
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    const links = await page
      .locator('link[rel="alternate"][hreflang]')
      .evaluateAll((nodes) =>
        nodes.map((node) => (node as HTMLLinkElement).href),
      );
    expect(links.length).toBeGreaterThanOrEqual(4);
    for (const href of links) {
      const url = new URL(href);
      expect((await request.get(url.pathname)).status()).toBe(200);
    }
    expect(errors).toEqual([]);
  });
}

test('English prefixes redirect and unknown locales return 404', async ({
  request,
}) => {
  const redirect = await request.get('/en/knowledge', { maxRedirects: 0 });
  expect([307, 308]).toContain(redirect.status());
  expect(redirect.headers().location).toMatch(/\/knowledge$/);
  expect((await request.get('/invalid-locale')).status()).toBe(404);
  expect((await request.get('/knowledge/%25')).status()).toBe(400);
});

test('game layout fits the viewport', async ({ page }, testInfo) => {
  await page.goto('/');
  await guess(page, 'Pikachu');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath('gameplay.png'),
    fullPage: true,
  });
});
