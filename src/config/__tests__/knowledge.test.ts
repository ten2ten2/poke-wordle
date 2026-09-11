import { getArticleAlternates, findKnowledgeArticle } from '../knowledge';
import knowledge from '@/data/knowledge_data.json';

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
