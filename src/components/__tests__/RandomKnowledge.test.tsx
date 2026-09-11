import { act, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { useLocale } from 'next-intl';
import RandomKnowledge from '../RandomKnowledge';

jest.mock('next-intl', () => ({
  useLocale: jest.fn(() => 'en'),
  useTranslations: () => () => 'Q&A: ',
}));

jest.mock('@/data/knowledge_data.json', () => ({
  en: [
    { id: '1', title: 'First article', slug: 'first' },
    { id: '2', title: 'Second article', slug: 'second' },
    { id: '3', title: 'Third article', slug: 'third' },
  ],
  'zh-hans': [
    { id: '1', title: '第一篇', slug: '第一篇' },
    { id: '2', title: '第二篇', slug: '第二篇' },
  ],
  'zh-hant': [{ id: '1', title: '唯一一篇', slug: '唯一一篇' }],
  ja: [],
}));

beforeEach(() => {
  jest.mocked(useLocale).mockReturnValue('en');
});

afterEach(() => jest.restoreAllMocks());

test.each([
  [0, 'first'],
  [0.5, 'second'],
  [0.999, 'third'],
])('can select every article with random value %s', (random, slug) => {
  jest.spyOn(Math, 'random').mockReturnValue(random);
  render(<RandomKnowledge />);
  expect(screen.getByRole('link')).toHaveAttribute('href', `/knowledge/${slug}`);
});

test('keeps the article during rerenders and selects again on a new visit', () => {
  const random = jest.spyOn(Math, 'random').mockReturnValue(0.5);
  const { rerender, unmount } = render(<RandomKnowledge />);
  random.mockReturnValue(0.999);
  rerender(<RandomKnowledge />);
  expect(screen.getByRole('link')).toHaveTextContent('Second article');
  unmount();
  render(<RandomKnowledge />);
  expect(screen.getByRole('link')).toHaveTextContent('Third article');
});

test('switching language selects from that language and encodes its URL', () => {
  jest.spyOn(Math, 'random').mockReturnValue(0.999);
  const { rerender } = render(<RandomKnowledge />);
  jest.mocked(useLocale).mockReturnValue('zh-hans');
  rerender(<RandomKnowledge />);
  expect(screen.getByRole('link')).toHaveTextContent('第二篇');
  expect(screen.getByRole('link')).toHaveAttribute('href', `/zh-hans/knowledge/${encodeURIComponent('第二篇')}`);
});

test.each(['ja', 'fr'])('hides the banner when %s has no available knowledge', (locale) => {
  jest.mocked(useLocale).mockReturnValue(locale);
  render(<RandomKnowledge />);
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
});

test('handles a language with only one article', () => {
  jest.spyOn(Math, 'random').mockReturnValue(0.999);
  jest.mocked(useLocale).mockReturnValue('zh-hant');
  render(<RandomKnowledge />);
  expect(screen.getByRole('link')).toHaveTextContent('唯一一篇');
});

test('hydrates the server preview without a mismatch, then selects randomly', async () => {
  const random = jest.spyOn(Math, 'random').mockReturnValue(0.999);
  const container = document.createElement('div');
  container.innerHTML = renderToString(<RandomKnowledge />);
  expect(container.querySelector('a')).toHaveTextContent('First article');
  random.mockReturnValue(0.5);
  const onRecoverableError = jest.fn();
  let root: ReturnType<typeof hydrateRoot>;
  await act(async () => {
    root = hydrateRoot(container, <RandomKnowledge />, { onRecoverableError });
  });
  try {
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(container.querySelector('a')).toHaveTextContent('Second article');
  } finally {
    await act(async () => root.unmount());
  }
});
