import { getArticleAlternates, findKnowledgeArticle, knowledgeData as knowledge } from '../knowledge';

jest.mock('@/data/knowledge_data.json', () => {
  const slugs = { en: 'test-article', ja: 'テスト記事', 'zh-hans': '测试文章', 'zh-hant': '測試文章' };
  return Object.fromEntries(Object.entries(slugs).map(([locale, slug]) => [locale, [{
    id: locale, title: slug, slug, createdAt: '2025-01-01T00:00:00Z',
    translations: Object.fromEntries(Object.entries(slugs).filter(([language]) => language !== locale).map(([language, translated]) => [language, { slug: translated }])),
  }]]));
});

for (const [locale, articles] of Object.entries(knowledge)) {
  test(`${locale} article alternates use the translated slugs`, () => {
    const alternates = getArticleAlternates(locale, articles[0]);
    expect(findKnowledgeArticle(locale, articles[0].slug)).toEqual(articles[0]);
    expect(
      findKnowledgeArticle(locale, encodeURIComponent(articles[0].slug)),
    ).toEqual(articles[0]);
    expect(Object.keys(alternates)).toHaveLength(5);
    for (const [language, translated] of Object.entries(knowledge)) {
      const prefix = language === 'en' ? '' : `/${language}`;
      expect(alternates[language]).toBe(
        `${prefix}/knowledge/${encodeURIComponent(translated[0].slug)}`,
      );
    }
    expect(alternates['x-default']).toBe(alternates.en);
  });
}

test('unknown article paths do not throw URI decoding errors', () => {
  expect(findKnowledgeArticle('en', '%')).toBeUndefined();
  expect(findKnowledgeArticle('invalid', 'article')).toBeUndefined();
});

test('removed language versions have no article or alternate link', () => {
  const japanese = knowledge.ja;
  knowledge.ja = [];
  try {
    expect(findKnowledgeArticle('ja', japanese[0].slug)).toBeUndefined();
    expect(getArticleAlternates('en', knowledge.en[0])).not.toHaveProperty('ja');
  } finally {
    knowledge.ja = japanese;
  }
});
