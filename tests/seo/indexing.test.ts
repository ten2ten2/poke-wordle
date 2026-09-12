import { access } from 'node:fs/promises';
import { spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import { get as httpGet, type IncomingHttpHeaders } from 'node:http';
import { get as httpsGet } from 'node:https';
import { setTimeout as delay } from 'node:timers/promises';
import { once } from 'node:events';
import { routing, localePath } from '@/i18n/routing';
import { absoluteUrl, SITE_URL, SITE_NAME } from '@/config/seo';
import { knowledgeData, knowledgeArticlePath, KNOWLEDGE_SUPPORTED_LOCALES } from '@/config/knowledge';
import redirects from '@/data/knowledge-redirects.json';

interface Response { status: number; headers: IncomingHttpHeaders; body: string }
let baseURL: string;
let server: ChildProcess | undefined;
let serverExit: Promise<unknown> | undefined;
let logs = '';
const pages = new Map<string, Promise<Document>>();
const requests = new Map<string, Promise<Response>>();
const paths = [
  ...routing.locales.flatMap((locale) => [localePath(locale), localePath(locale, '/privacy-and-terms')]),
  ...KNOWLEDGE_SUPPORTED_LOCALES.flatMap((locale) => [localePath(locale, '/knowledge'), ...knowledgeData[locale].map((article) => knowledgeArticlePath(locale, article.slug))]),
];
const articleEntries = KNOWLEDGE_SUPPORTED_LOCALES.flatMap((locale) => knowledgeData[locale].map((article) => ({ locale, article, path: knowledgeArticlePath(locale, article.slug) })));
const localURL = (url: string) => {
  const parsed = new URL(url, SITE_URL);
  return parsed.origin === SITE_URL ? new URL(parsed.pathname + parsed.search, baseURL).href : parsed.href;
};

function read(url: string): Promise<Response> {
  return new Promise((resolve, reject) => {
    const get = url.startsWith('https:') ? httpsGet : httpGet;
    const request = get(url, { headers: { 'User-Agent': 'PokeWordleSEOCheck' } }, (response) => {
      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('error', reject);
      response.on('end', () => resolve({ status: response.statusCode ?? 0, headers: response.headers, body: Buffer.concat(chunks).toString('utf8') }));
    });
    request.setTimeout(15000, () => request.destroy(new Error(`Request timed out: ${url}`)));
    request.on('error', reject);
  });
}
function response(url: string) {
  const target = localURL(url);
  if (!requests.has(target)) requests.set(target, read(target));
  return requests.get(target)!;
}
function page(url: string) {
  const target = localURL(url);
  if (!pages.has(target)) pages.set(target, response(url).then((result) => {
    expect({ url, status: result.status }).toEqual({ url, status: 200 });
    expect(result.headers['content-type']).toContain('text/html');
    expect(result.headers['x-robots-tag'] ?? '').not.toMatch(/noindex|none/i);
    return new DOMParser().parseFromString(result.body, 'text/html');
  }));
  return pages.get(target)!;
}
const content = (doc: Document, key: string) => doc.querySelector(`meta[name="${key}"],meta[property="${key}"]`)?.getAttribute('content');
const alternates = (doc: Document) => Object.fromEntries([...doc.querySelectorAll('link[rel="alternate"][hreflang]')].map((node) => [node.getAttribute('hreflang')!.toLowerCase(), new URL(node.getAttribute('href')!).href]));
const schema = (doc: Document): Record<string, unknown>[] => [...doc.querySelectorAll('script[type="application/ld+json"]')].map((node) => JSON.parse(node.textContent || ''));

beforeAll(async () => {
  if (process.env.SEO_BASE_URL) {
    baseURL = new URL(process.env.SEO_BASE_URL).origin;
    return;
  }
  await access('.next/BUILD_ID').catch(() => { throw new Error('Run mise run build before mise run seo:check.'); });
  const reservation = createServer();
  await new Promise<void>((resolve) => reservation.listen(0, 'localhost', resolve));
  const address = reservation.address();
  if (!address || typeof address === 'string') throw new Error('Could not reserve a test port');
  await new Promise<void>((resolve, reject) => reservation.close((error) => error ? reject(error) : resolve()));
  // NextURL normalizes loopback IPs to localhost. Use the same hostname for
  // the server and requests so locale rewrites remain internal.
  baseURL = `http://localhost:${address.port}`;
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', 'localhost', '--port', String(address.port)], {
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  serverExit = once(server, 'exit');
  for (const stream of [server.stdout, server.stderr]) stream?.on('data', (chunk) => { logs = (logs + chunk).slice(-8000); });
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error(`Production server exited: ${logs}`);
    try { if ((await read(`${baseURL}/robots.txt`)).status === 200) return; } catch { /* Server is still starting. */ }
    await delay(100);
  }
  throw new Error(`Production server did not start: ${logs}`);
});

afterAll(async () => {
  if (server && server.exitCode === null) server.kill('SIGTERM');
  await serverExit;
});

test('robots exposes the canonical sitemap and sitemap lists every published canonical exactly once', async () => {
  const robots = await response('/robots.txt');
  expect(robots.status).toBe(200);
  expect(robots.body).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
  const result = await response('/sitemap.xml');
  expect(result.status).toBe(200);
  const doc = new DOMParser().parseFromString(result.body, 'application/xml');
  expect(doc.querySelector('parsererror')).toBeNull();
  const entries = [...doc.getElementsByTagName('url')];
  const urls = entries.map((entry) => entry.getElementsByTagName('loc')[0]?.textContent);
  expect(urls.sort()).toEqual(paths.map(absoluteUrl).sort());
  expect(new Set(urls).size).toBe(urls.length);
  for (const entry of entries) {
    const url = entry.getElementsByTagName('loc')[0].textContent!;
    const links = Object.fromEntries([...entry.getElementsByTagNameNS('http://www.w3.org/1999/xhtml', 'link')].map((link) => [link.getAttribute('hreflang')!.toLowerCase(), link.getAttribute('href')]));
    expect(links).toEqual(alternates(await page(url)));
    const article = articleEntries.find((item) => absoluteUrl(item.path) === url)?.article;
    if (article) expect(Date.parse(entry.getElementsByTagName('lastmod')[0]?.textContent ?? '')).toBe(Date.parse(article.updatedAt ?? article.createdAt));
  }
});

test.each(paths)('%s renders indexable HTML with canonical, reciprocal languages, images and one primary heading', async (path) => {
  const doc = await page(path);
  const canonical = absoluteUrl(path);
  expect(doc.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
  expect(new URL(doc.querySelector('link[rel="canonical"]')!.getAttribute('href')!).href).toBe(canonical);
  expect(content(doc, 'robots') ?? '').not.toMatch(/noindex|none/i);
  expect(doc.querySelectorAll('h1')).toHaveLength(1);
  expect(doc.title.trim().length).toBeGreaterThan(0);
  expect(content(doc, 'description')?.trim().length).toBeGreaterThan(0);
  expect(content(doc, 'description')).not.toMatch(/^Learn about .*comprehensive Pokémon knowledge base/);
  expect(content(doc, 'keywords')).toBeUndefined();
  expect(content(doc, 'og:title')).toBe(doc.title);
  expect(content(doc, 'og:description')).toBe(content(doc, 'description'));
  expect(new URL(content(doc, 'og:url')!).href).toBe(canonical);
  expect(content(doc, 'og:locale')).toBeTruthy();
  expect(content(doc, 'og:site_name')).toBe(SITE_NAME);
  expect(content(doc, 'application-name')).toBe(SITE_NAME);
  expect(content(doc, 'author')).toBe(SITE_NAME);
  expect(content(doc, 'robots')).toContain('max-image-preview:large');
  expect(content(doc, 'twitter:card')).toBe('summary_large_image');
  expect(content(doc, 'twitter:title')).toBe(doc.title);
  expect(content(doc, 'twitter:description')).toBe(content(doc, 'description'));
  for (const key of ['twitter:site', 'twitter:creator']) {
    const handle = content(doc, key);
    if (handle !== undefined) expect(handle).toMatch(/^@[A-Za-z0-9_]{1,15}$/);
  }
  for (const key of ['og:image', 'twitter:image']) {
    const image = content(doc, key); expect(image).toBeTruthy();
    expect(content(doc, `${key}:alt`)?.trim().length).toBeGreaterThan(0);
    const result = await response(image!);
    expect({ image, status: result.status }).toEqual({ image, status: 200 });
    expect(result.headers['content-type']).toMatch(/^image\//);
  }
  if (content(doc, 'og:image') === absoluteUrl('/images/og-image.png')) {
    expect(content(doc, 'og:image:width')).toBe('1200');
    expect(content(doc, 'og:image:height')).toBe('630');
    expect(content(doc, 'og:image:type')).toBe('image/png');
  }
  const language = doc.documentElement.lang.toLowerCase();
  const languages = alternates(doc);
  expect(languages[language]).toBe(canonical);
  for (const [locale, href] of Object.entries(languages)) {
    expect(new URL(href).origin).toBe(SITE_URL);
    const target = await page(href);
    expect(alternates(target)[language]).toBe(canonical);
    if (locale !== 'x-default') expect(target.documentElement.lang.toLowerCase()).toBe(locale);
  }
  expect(schema(doc).some((item) => item['@type'] === 'FAQPage')).toBe(false);
  if (path.includes('/knowledge') || path.includes('/privacy-and-terms')) {
    const breadcrumb = schema(doc).find((item) => item['@type'] === 'BreadcrumbList');
    expect(breadcrumb).toBeDefined();
    const items = breadcrumb!.itemListElement as { position: number; name: string; item?: string }[];
    expect(items.length).toBeGreaterThanOrEqual(2);
    for (const [index, item] of items.entries()) {
      expect(item.position).toBe(index + 1); expect(item.name).toBeTruthy();
      if (item.item) await page(item.item);
    }
  }
  for (const link of doc.querySelectorAll('a[href]')) {
    expect({ href: link.getAttribute('href'), title: !!link.getAttribute('title')?.trim() }).toEqual({ href: link.getAttribute('href'), title: true });
    const url = new URL(link.getAttribute('href')!, canonical);
    if (url.origin === SITE_URL && url.pathname.includes('/knowledge')) await page(url.href);
  }
  for (const button of doc.querySelectorAll('button')) expect(button.getAttribute('title')?.trim().length).toBeGreaterThan(0);
  for (const image of doc.querySelectorAll('img[src^="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/"]')) {
    expect(image.getAttribute('alt')?.trim().length).toBeGreaterThan(0);
    expect(Number(image.getAttribute('width'))).toBeGreaterThan(0);
    expect(Number(image.getAttribute('height'))).toBeGreaterThan(0);
  }
});

test('the canonical root describes the website with its actual name and URL', async () => {
  const websites = schema(await page('/')).filter((item) => item['@type'] === 'WebSite');
  expect(websites).toHaveLength(1);
  expect(websites[0]).toMatchObject({ '@id': absoluteUrl('/#website'), name: SITE_NAME, url: absoluteUrl('/'), inLanguage: [...routing.locales] });
});

test.each(articleEntries)('$locale / $article.slug uses the localized index for its metadata and Article schema', async ({ locale, article, path }) => {
  const doc = await page(path);
  expect(content(doc, 'description')).toBe(article.description);
  expect(doc.title).toBe(article.seoTitle || `${article.title} - Poke Wordle`);
  const articles = schema(doc).filter((item) => item['@type'] === 'Article');
  expect(articles).toHaveLength(1);
  expect(articles[0]).toMatchObject({ headline: article.title, description: article.description, inLanguage: locale, datePublished: article.createdAt, dateModified: article.updatedAt ?? article.createdAt, mainEntityOfPage: { '@id': absoluteUrl(path) } });
});

test('historical article URLs redirect directly to their current version and retain query parameters', async () => {
  for (const alias of redirects) {
    const article = knowledgeData[alias.locale as keyof typeof knowledgeData].find((item) => item.id === alias.articleId)!;
    const path = knowledgeArticlePath(alias.locale, alias.slug);
    for (const old of [path, ...(alias.locale === 'en' ? [`/en${path}`] : [])]) {
      const result = await response(`${old}?ref=seo-check`);
      expect(result.status).toBe(308);
      const destination = new URL(result.headers.location!, baseURL);
      expect(destination.pathname).toBe(knowledgeArticlePath(alias.locale, article.slug));
      expect(destination.search).toBe('?ref=seo-check');
      await page(absoluteUrl(destination.pathname));
    }
  }
  for (const path of ['/en', '/en/knowledge', '/en/privacy-and-terms']) {
    const result = await response(path); expect(result.status).toBe(308);
    expect(new URL(result.headers.location!, baseURL).pathname).toBe(path.slice(3) || '/');
  }
});

test('missing pages and unsupported knowledge languages are not soft 404s', async () => {
  for (const path of ['/knowledge/nonexistent-seo-check-article', '/knowledge/nonexistent.article', '/pt/knowledge', '/ko/knowledge/nonexistent', '/invalid-locale']) {
    const result = await response(path);
    expect({ path, status: result.status }).toEqual({ path, status: 404 });
  }
});
