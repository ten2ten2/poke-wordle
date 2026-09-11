/** @jest-environment node */
import { NextRequest } from 'next/server';
import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server';
import proxy, { config } from '@/proxy';

jest.unmock('next-intl');
jest.mock('@/data/knowledge-redirects.json', () => [
  { locale: 'en', slug: 'old.article', articleId: 'current-en' },
  { locale: 'zh-hans', slug: '旧文章', articleId: 'current-zh' },
]);
jest.mock('@/data/knowledge_data.json', () => ({
  en: [{ id: 'current-en', slug: 'current-article' }],
  'zh-hans': [{ id: 'current-zh', slug: '新文章' }], ja: [], 'zh-hant': [],
}));

test.each(['/knowledge/version.2', '/en/knowledge/version.2', '/ja/knowledge/version.2', '/zh-hans/knowledge/版本.2'])(
  'knowledge paths containing dots go through locale routing: %s', (url) => {
    expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })).toBe(true);
  },
);
test.each(['/images/og-image.png', '/_next/static/file.js', '/api/checkGuess', '/api/knowledge/export.json', '/_next/knowledge/file.js'])(
  'assets and API paths bypass locale routing: %s', (url) => {
    expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })).toBe(false);
  },
);
test.each([
  ['/en', '/'], ['/en/knowledge', '/knowledge'],
  ['/knowledge/old.article', '/knowledge/current-article'],
  ['/en/knowledge/old.article', '/knowledge/current-article'],
  ['/zh-hans/knowledge/%E6%97%A7%E6%96%87%E7%AB%A0', '/zh-hans/knowledge/%E6%96%B0%E6%96%87%E7%AB%A0'],
])('normalizes %s with one permanent redirect', (path, destination) => {
  const response = proxy(new NextRequest(`https://www.pokewordle.app${path}?ref=test`));
  expect(response.status).toBe(308);
  expect(response.headers.get('location')).toBe(`https://www.pokewordle.app${destination}?ref=test`);
});
test('malformed article escapes return a client error', () => {
  expect(proxy(new NextRequest('https://www.pokewordle.app/knowledge/%')).status).toBe(400);
});
