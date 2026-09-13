import { readFile } from 'node:fs/promises';
import { test, expect, type Page } from '@playwright/test';
import { datasetVersion } from '../../src/config/dataset';
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

async function guess(page: Page, name: string, submitLabel = 'Submit') {
  const count = await page.locator('.guess-table-card').count();
  await page.getByRole('combobox').fill(name);
  await page.getByRole('button', { name: submitLabel, exact: true }).click();
  await expect(page.locator('.guess-table-card')).toHaveCount(count + 1);
  await expect(page.getByRole('combobox')).toHaveValue('');
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

test('an open page compares guesses offline without API requests', async ({ page, context }) => {
  const guessRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/checkGuess') guessRequests.push(request.url());
  });
  await page.goto('/ko');
  await expect(page.getByRole('combobox')).toBeEnabled();
  await context.setOffline(true);
  await guess(page, '피카츄', '제출');
  await guess(page, 'Bulbasaur', '제출');
  expect(guessRequests).toEqual([]);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('poke-wordle-progress')!).datasetVersion)).toBe(datasetVersion);
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

test('guess ordering persists without recreating existing cards', async ({ page }) => {
  await page.goto('/');
  await guess(page, 'Pikachu');
  const firstGuess = await page.locator('.guess-table-card').first().elementHandle();
  await guess(page, 'Bulbasaur');
  expect(await firstGuess!.evaluate((node) => node.isConnected)).toBe(true);
  await expect(page.locator('.guess-table-card').first()).toContainText(
    'Bulbasaur',
  );
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: /Normal Order/ }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  expect(await firstGuess!.evaluate((node) => node.isConnected)).toBe(true);
  await expect(page.locator('.guess-table-card').first()).toContainText(
    'Pikachu',
  );
  await page.reload();
  await expect(page.locator('.guess-table-card').first()).toContainText(
    'Pikachu',
  );
});

test('changing settings resets locally compared guesses', async ({ page }) => {
  await page.goto('/');
  await guess(page, 'Pikachu');
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: '5', exact: true }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('combobox')).toBeEnabled();
  await expect(page.locator('.guess-table-card')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await guess(page, 'Bulbasaur');
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
  await expect(page.getByRole('dialog')).toContainText('You guessed it in 1 try.');
  await expect(page.getByRole('dialog').getByText('Victory', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Play Again', exact: true }).click();
  await expect(page.getByRole('combobox')).toBeEnabled();
  await expect(page.locator('.guess-table-card')).toHaveCount(0);
  await guess(page, 'Pikachu');
  if (!(await page.evaluate(() => JSON.parse(localStorage.getItem('poke-wordle-progress')!).isWon))) {
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
  await expect(page.getByRole('dialog').getByText('Defeat', { exact: true })).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Game status section' })).toContainText('Game Over! The answer was Charmander');
});

test('revealing an answer without extra tags keeps the result usable', async ({ page }) => {
  await page.goto('/');
  await page.evaluate((targetPokemon) => {
    const progress = JSON.parse(localStorage.getItem('poke-wordle-progress')!);
    localStorage.setItem('poke-wordle-progress', JSON.stringify({ ...progress, targetPokemon }));
  }, pokemon.find((p) => p.name === 'caterpie')!);
  await page.reload();
  await page.getByRole('button', { name: 'Give Up', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('link', { name: 'Caterpie', exact: true })).toBeVisible();
  await expect(dialog.getByText('Tags', { exact: true })).toHaveCount(0);
  await expect(dialog).toContainText('Defeat');
  await dialog.getByRole('button', { name: 'Play Again', exact: true }).click();
  await expect(page.getByRole('combobox')).toBeEnabled();
});

for (const theme of ['light', 'dark'] as const) {
  test(`localized result cards fit in ${theme} mode`, async ({ page, isMobile }, testInfo) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error' && /MISSING_MESSAGE|INVALID_MESSAGE|hydrat/i.test(message.text())) errors.push(message.text());
    });
    await page.setViewportSize({ width: isMobile ? 320 : 1280, height: 1000 });
    await page.goto('/');
    for (const locale of ['en', 'ja', 'zh-hans', 'zh-hant', 'ko', 'fr', 'de', 'it', 'es']) {
      const messages = JSON.parse(await readFile(`src/messages/${locale}.json`, 'utf8'));
      await page.evaluate(({ target, settings, datasetVersion, theme }) => {
        localStorage.setItem('poke-wordle-theme', theme);
        localStorage.setItem('poke-wordle-progress', JSON.stringify({
          datasetVersion, targetPokemon: target, guesses: [],
          selectedGenerations: settings.selectedGenerations, isGameOver: false, isWon: false,
        }));
      }, { target: pokemon.find((p) => p.name === 'tyranitar')!, settings, datasetVersion, theme });
      await page.goto(locale === 'en' ? '/' : `/${locale}`);
      if (theme === 'dark') {
        await page.getByRole('combobox').fill('Pikachu');
        await page.getByRole('button', { name: messages.game.submit, exact: true }).click();
        await expect(page.locator('.guess-table-card')).toHaveCount(1);
      }
      await page.getByRole('combobox').fill('Tyranitar');
      await page.getByRole('button', { name: messages.game.submit, exact: true }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog.getByRole('heading', { name: messages.game.congratulations, exact: true })).toBeVisible();
      await expect(dialog.getByText(messages.game.victory, { exact: true })).toBeVisible();
      await expect(dialog).toContainText(theme === 'light' ? '1 / 10' : '2 / 10');
      await expect(dialog.getByText(messages.game.baseStatsTotal, { exact: true })).toBeVisible();
      await expect(dialog.getByText(messages.tags.late, { exact: true })).toBeVisible();
      if (locale === 'en') await expect(dialog).toContainText(theme === 'light' ? 'You guessed it in 1 try.' : 'You guessed it in 2 tries.');
      if (locale === 'fr') await expect(dialog).toContainText(theme === 'light' ? 'Vous avez trouvé en 1 essai.' : 'Vous avez trouvé en 2 essais.');
      await expect(dialog.getByRole('heading', { level: 2 })).toHaveCSS('color', theme === 'light' ? 'rgb(17, 24, 39)' : 'rgb(229, 231, 235)');
      const overflowing = await dialog.locator('dl, dt, dd, .tag, .tag-label').evaluateAll((nodes) => nodes
        .filter((node) => node.scrollWidth > node.clientWidth + 1)
        .map((node) => node.textContent));
      expect(overflowing, `${locale} ${theme}`).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (locale === 'fr' || locale === 'zh-hans') await page.screenshot({ path: testInfo.outputPath(`result-${locale}-${theme}.png`), fullPage: true });
      await dialog.getByRole('button', { name: messages.common.close, exact: true }).click();
    }
    expect(errors).toEqual([]);
  });
}

test('Korean results link to the Korean Pokemon Wiki', async ({ page }) => {
  await page.goto('/ko');
  await page.getByRole('combobox').fill('파이리');
  await page.getByRole('button', { name: '제출', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('link', { name: '파이리', exact: true }))
    .toHaveAttribute('href', `https://pokemon.fandom.com/ko/wiki/${encodeURIComponent('파이리_(포켓몬)')}`);
});

test('language switch updates the route and document language', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Language', exact: true }).click();
  const languageLink = page.getByRole('link', { name: 'Switch to 简体中文' });
  await expect(languageLink).toHaveAttribute('href', '/zh-hans');
  await expect(languageLink).toHaveAttribute('hreflang', 'zh-hans');
  await languageLink.focus();
  await page.keyboard.press('Enter');
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


test('invalid guesses preserve input without spending a turn', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('combobox').fill('unknown-pokemon');
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.locator('main').getByRole('alert')).toBeVisible();
  await expect(page.getByRole('combobox')).toHaveValue('unknown-pokemon');
  await expect(page.locator('.guess-table-card')).toHaveCount(0);
  await guess(page, 'Pikachu');
  await expect(page.locator('main').getByRole('alert')).toHaveCount(0);
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
    const knowledgeHref = `${prefix}/knowledge`;
    await expect(page.locator('footer').getByRole('link', { name: messages.knowledge.title, exact: true })).toHaveAttribute('href', knowledgeHref);
    expect((await request.get(knowledgeHref)).status()).toBe(200);
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
