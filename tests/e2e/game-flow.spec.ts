import { readFile } from 'node:fs/promises';
import { test, expect, type Page } from '@playwright/test';
import { version as datasetVersion } from '../../src/data/dataset.json';
import pokemon from '../../src/data/pokemon_data.json';
import knowledgeData from '../../src/data/knowledge_data.json';
import type { KnowledgeData } from '../../src/config/knowledge';

const knowledge: KnowledgeData = knowledgeData;

const target = pokemon.find((p) => p.name === 'charmander')!;
const settings = {
  maxGuesses: 10,
  selectedGenerations: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  isPrankster: false,
  isGenArrow: false,
  guessOrder: 'reverse',
};

async function guess(page: Page, name: string) {
  await page.getByRole('combobox').fill(name);
  const response = page.waitForResponse('/api/checkGuess');
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  expect((await response).ok()).toBeTruthy();
  await expect(page.getByRole('combobox')).toBeEnabled();
}

test.beforeEach(async ({ page }) => {
  // Gameplay tests are independent of remote artwork and hosting analytics.
  await page.route(/\/_next\/image\?|^https:\/\/raw\.githubusercontent\.com\/PokeAPI\/sprites\//, (route) =>
    route.fulfill({
      path: 'public/images/icon-96x96.png',
      contentType: 'image/png',
    }),
  );
  await page.route('**/_vercel/**', (route) =>
    route.fulfill({ body: '', contentType: 'application/javascript' }),
  );
  await page.addInitScript(
    ({ target, settings, datasetVersion }) => {
      localStorage.setItem('cookie-consent', 'declined');
      if (!localStorage.getItem('poke-wordle-progress')) {
        localStorage.setItem('poke-wordle-settings', JSON.stringify(settings));
        localStorage.setItem(
          'poke-wordle-progress',
          JSON.stringify({
            datasetVersion,
            targetPokemon: target,
            guesses: [],
            selectedGenerations: settings.selectedGenerations,
            isGameOver: false,
            isWon: false,
          }),
        );
      }
    },
    { target, settings, datasetVersion },
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

test('old dataset progress is cleared without losing settings', async ({ page }) => {
  await page.goto('/');
  await guess(page, 'Pikachu');
  await page.evaluate(() => {
    const progress = JSON.parse(localStorage.getItem('poke-wordle-progress')!);
    progress.datasetVersion = 'old-data';
    localStorage.setItem('poke-wordle-progress', JSON.stringify(progress));
  });
  await page.reload();
  await expect(page.getByRole('combobox')).toBeEnabled();
  await expect(page.locator('.guess-table-card')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('poke-wordle-progress'))).toBeNull();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('poke-wordle-settings')!).maxGuesses)).toBe(10);
  await guess(page, 'Pikachu');
});

test('an open page reloads when the server data changes', async ({ page }) => {
  await page.goto('/');
  await page.route('**/api/checkGuess', async (route) => {
    expect(route.request().postDataJSON().dataset_version).toBe(datasetVersion);
    await route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ code: 'DATASET_CHANGED' }) });
  }, { times: 1 });
  const reloaded = page.waitForEvent('framenavigated', (frame) => frame === page.mainFrame());
  await page.getByRole('combobox').fill('Pikachu');
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await reloaded;
  await expect(page.getByRole('combobox')).toBeEnabled();
  await expect(page.locator('.guess-table-card')).toHaveCount(0);
  await guess(page, 'Pikachu');
});

test('autocomplete supports keyboard selection', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('combobox').fill('Pikachu');
  await expect(
    page.getByRole('option', { name: /Pikachu/ }),
  ).toBeVisible();
  await page.getByRole('combobox').press('ArrowDown');
  await page.getByRole('combobox').press('Enter');
  await expect(page.getByRole('combobox')).toHaveValue('Pikachu');
  await page.getByRole('combobox').press('Enter');
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
  await page.getByRole('combobox').fill('Charmander');
  const request = page.waitForRequest('**/api/checkGuess');
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await request;
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: '5', exact: true }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  release();
  await expect(page.getByRole('combobox')).toBeEnabled();
  await expect(page.locator('.guess-table-card')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('winning reveals the answer and restart enables input', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('combobox').fill('Charmander');
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(
    page
      .getByRole('dialog')
      .getByRole('heading', { name: 'Congratulations!', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('Charmander');
  await page.getByRole('button', { name: 'Play Again', exact: true }).click();
  await expect(page.getByRole('combobox')).toBeEnabled();
  await expect(page.locator('.guess-table-card')).toHaveCount(0);
  await page.getByRole('combobox').fill('Pikachu');
  const nextGuess = page.waitForResponse('/api/checkGuess');
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  if (!(await (await nextGuess).json()).isCorrect) {
    await page.getByRole('button', { name: 'Give Up', exact: true }).click();
    await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  }
  await expect(page.getByRole('dialog')).toContainText('Play Again');
});

test('giving up reveals the answer', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Give Up', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
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
  await expect(page.getByRole('combobox')).toHaveAttribute(
    'placeholder',
    /图鉴/,
  );
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-hans');
});

for (const [locale, articles] of Object.entries(knowledge)) {
  const article = articles[0];
  if (!article) {
    test(`renders the empty ${locale} knowledge archive`, async ({ page }) => {
      await page.goto(`${locale === 'en' ? '' : '/' + locale}/knowledge`);
      await expect(page.locator('#knowledge-heading')).toBeVisible();
      await expect(page.locator('.knowledge-list-link')).toHaveCount(0);
    });
    continue;
  }
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
    expect(links.length).toBeGreaterThanOrEqual(1);
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
  for (const status of ['exact', 'close', 'nope']) {
    const style = await page.locator(`.color-legend .tag-${status}`).evaluate((node) => {
      const style = getComputedStyle(node);
      return { background: style.backgroundColor, color: style.color };
    });
    expect(style.background).not.toBe('rgba(0, 0, 0, 0)');
    expect(style.color).not.toBe('rgb(0, 0, 0)');
  }
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

test('localized guess headers, long tags and generation buttons fit', async ({ page, isMobile }, testInfo) => {
  test.setTimeout(60_000);
  await page.goto('/');
  await guess(page, 'Bellibolt');
  await guess(page, 'Flamigo');
  for (const locale of ['en', 'zh-hans', 'zh-hant', 'ja', 'ko', 'fr', 'de', 'it', 'es']) {
    const messages = JSON.parse(await readFile(`src/messages/${locale}.json`, 'utf8'));
    await page.goto(locale === 'en' ? '/' : `/${locale}`);
    await expect(page.locator('.guess-table-card')).toHaveCount(2);
    await page.evaluate(() => document.fonts.ready);
    for (const width of isMobile ? [390] : [1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      const layout = await page.locator('.guess-table-card').evaluateAll((cards) => cards.map((card) => ({
        headers: [...card.querySelectorAll('dt')].map((label) => ({ top: label.getBoundingClientRect().top, bottom: label.getBoundingClientRect().bottom })),
        overflow: [...card.querySelectorAll('.tag, .tag-label, dd')].filter((node) => node.scrollWidth > node.clientWidth + 1).map((node) => node.textContent),
        clipped: card.scrollWidth > card.clientWidth + 1,
      })));
      for (const card of layout) {
        expect(card.overflow, `${locale} at ${width}px`).toEqual([]);
        expect(card.clipped).toBe(false);
        if (!isMobile) {
          for (const edge of ['top', 'bottom'] as const) {
            const positions = card.headers.map((label) => label[edge]);
            expect(Math.max(...positions) - Math.min(...positions), `${locale} header ${edge}`).toBeLessThan(1);
          }
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (locale === 'es' || locale === 'de') await page.locator('.guess-results').screenshot({ path: testInfo.outputPath(`guesses-${locale}-${width}.png`) });
    }
    const abbreviated = ['en', 'fr', 'de', 'it', 'es'].includes(locale);
    await expect(page.locator('.guess-field:nth-child(3) .tag-label')).toHaveText(Array(2).fill(abbreviated ? 'Gen 9' : messages.generation.Gen9));
    await page.getByRole('button', { name: messages.navbar.settings, exact: true }).click();
    for (let gen = 1; gen <= 9; gen++) {
      await expect(page.getByRole('dialog').getByRole('button', { name: abbreviated ? `Gen ${gen}` : messages.generation[`Gen${gen}`], exact: true })).toBeVisible();
    }
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  }
});


test('failed guesses preserve input and retry without spending a turn', async ({ page }) => {
  let attempts = 0;
  await page.route('**/api/checkGuess', (route) => ++attempts === 1
    ? route.fulfill({ status: 503, contentType: 'application/json', body: '{}' })
    : route.continue());
  await page.goto('/');
  await page.getByRole('combobox').fill('Pikachu');
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.locator('main').getByRole('alert')).toContainText('Please try again');
  await expect(page.getByRole('combobox')).toHaveValue('Pikachu');
  await expect(page.locator('.guess-table-card')).toHaveCount(0);
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.locator('.guess-table-card')).toHaveCount(1);
  await expect(page.getByRole('combobox')).toHaveValue('');
  expect(attempts).toBe(2);
});

test('localized navigation, footer and typography work in all nine languages', async ({ page, request }) => {
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  await page.clock.setFixedTime(nextYear);
  for (const locale of ['en', 'zh-hans', 'zh-hant', 'ja', 'ko', 'fr', 'de', 'it', 'es']) {
    const messages = JSON.parse(await readFile(`src/messages/${locale}.json`, 'utf8'));
    const prefix = locale === 'en' ? '' : `/${locale}`;
    await page.goto(prefix || '/');
    await expect(page.locator('header a svg')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('footer')).toContainText(`2025–${nextYear.getFullYear()}`);
    if (['en', 'zh-hans', 'zh-hant', 'ja'].includes(locale)) {
      const knowledgeHref = `${prefix}/knowledge`;
      await expect(page.locator('footer').getByRole('link', { name: messages.knowledge.title, exact: true })).toHaveAttribute('href', knowledgeHref);
      expect((await request.get(knowledgeHref)).status()).toBe(200);
    } else {
      await expect(page.locator('footer a[href$="/knowledge"]')).toHaveCount(0);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.locator('body').evaluate((node) => getComputedStyle(node).fontFamily.toLowerCase())).toContain('inter');
  }
});

test('first visit stays in the game and About explains colors inline', async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: testInfo.project.use.viewport });
  const page = await context.newPage();
  try {
    await page.route('**/_vercel/**', (route) => route.fulfill({ body: '', contentType: 'application/javascript' }));
    await page.goto('http://localhost:3317/');
    await expect(page.getByRole('combobox')).toBeEnabled();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText('Guess a Pokémon, compare the clues, and narrow down the answer.')).toBeVisible();
    await page.getByRole('button', { name: 'About', exact: true }).click();
    const guide = page.getByRole('dialog').locator('li').filter({ hasText: 'Green Tag' });
    await expect(guide).toHaveCount(1);
    await expect(guide).toContainText('Green Tag Indicates');
    await expect(guide.locator('strong.tag-exact')).toHaveText('Green Tag');
    await expect(guide.locator('[style]')).toHaveCount(0);
    await expect(page.getByRole('dialog').getByRole('link', { name: 'pokeapi.co' })).toHaveAttribute('href', 'https://pokeapi.co');
  } finally { await context.close(); }
});


test('national-number prefixes show longer numbers and allow selecting them', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('combobox').fill('25');
  await expect(page.getByRole('option').first()).toContainText('#0025');
  await page.getByRole('option').filter({ hasText: '#0250' }).click();
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.locator('.guess-table-card')).toContainText('Ho-Oh');
});

test('changing theme preserves guesses and themes results and dialogs', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await guess(page, 'Pikachu');
  const progress = await page.evaluate(() => localStorage.getItem('poke-wordle-progress'));
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('.guess-table-card')).toHaveCount(1);
  await expect(page.locator('.guess-table-card')).toHaveCSS('background-color', 'rgb(27, 30, 36)');
  await expect(page.locator('.tag-exact').first()).toHaveCSS('background-color', 'rgb(23, 59, 43)');
  expect(await page.evaluate(() => localStorage.getItem('poke-wordle-progress'))).toBe(progress);
  await page.getByRole('button', { name: 'About', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'About', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'About', exact: true })).toHaveCSS('color', 'rgb(229, 231, 235)');
});
