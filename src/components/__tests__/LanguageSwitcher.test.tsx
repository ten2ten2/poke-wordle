import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import LanguageSwitcher from '../LanguageSwitcher';
import type { KnowledgeArticle } from '@/config/knowledge';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: { language: string }) => ({
    'navbar.language': 'Language',
    'navbar.languageDescription': 'Select your preferred language from the list below',
    'navbar.switchLanguage': `Switch to ${values?.language}`,
    'common.close': 'Close',
  })[key] ?? key,
  useLocale: jest.fn(() => 'en'),
}));
jest.mock('next/navigation', () => ({ usePathname: jest.fn(() => '/') }));

const onClose = jest.fn();
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useLocale).mockReturnValue('en');
  jest.mocked(usePathname).mockReturnValue('/');
});

test('all nine languages have native links, localized hints and language attributes', async () => {
  await act(async () => { render(<LanguageSwitcher isOpen onClose={onClose} />); });
  expect(screen.getByRole('dialog')).toHaveAccessibleName('Language');
  const links = screen.getAllByRole('link');
  expect(links).toHaveLength(9);
  for (const link of links) {
    const language = link.getAttribute('hreflang');
    expect(link).toHaveAttribute('href', language === 'en' ? '/' : `/${language}`);
    expect(link).toHaveAttribute('title', `Switch to ${link.textContent}`);
    expect(link.querySelector('span')).toHaveAttribute('lang', language);
  }
  expect(screen.getByRole('link', { name: 'Switch to English' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('link', { name: 'Switch to 日本語' })).not.toHaveAttribute('aria-current');
});

test.each([
  ['en', '/', '日本語', '/ja'],
  ['ja', '/ja', 'English', '/'],
  ['en', '/privacy-and-terms', 'Français', '/fr/privacy-and-terms'],
  ['fr', '/fr/privacy-and-terms', 'Deutsch', '/de/privacy-and-terms'],
  ['zh-hans', '/zh-hans/knowledge', 'English', '/knowledge'],
  ['zh-hant', '/zh-hant/knowledge', '繁體中文', '/zh-hant/knowledge'],
])('switching from %s at %s to %s preserves the page path', async (locale, path, language, href) => {
  jest.mocked(useLocale).mockReturnValue(locale);
  jest.mocked(usePathname).mockReturnValue(path);
  await act(async () => { render(<LanguageSwitcher isOpen onClose={onClose} />); });
  expect(screen.getByRole('link', { name: `Switch to ${language}` })).toHaveAttribute('href', href);
});

test('article links use translated slugs and fall back to the archive when a translation is missing', async () => {
  const article: KnowledgeArticle = {
    id: 'example', slug: 'example', title: 'Example', description: 'Example article', createdAt: '2026-09-12',
    translations: { 'zh-hans': { slug: '形态差异' } },
  };
  jest.mocked(usePathname).mockReturnValue('/knowledge/example');
  await act(async () => { render(<LanguageSwitcher isOpen onClose={onClose} currentArticle={article} availableLocales={['en', 'ja', 'zh-hans']} />); });
  expect(screen.getAllByRole('link')).toHaveLength(3);
  expect(screen.getByRole('link', { name: 'Switch to 简体中文' })).toHaveAttribute('href', `/zh-hans/knowledge/${encodeURIComponent('形态差异')}`);
  expect(screen.getByRole('link', { name: 'Switch to 日本語' })).toHaveAttribute('href', '/ja/knowledge');
  expect(screen.getByRole('link', { name: 'Switch to English' })).toHaveAttribute('href', '/knowledge/example');
});

test('close dismisses the dialog and a closed switcher is not rendered', async () => {
  const user = userEvent.setup();
  const { rerender } = render(<LanguageSwitcher isOpen onClose={onClose} />);
  await user.click(screen.getByRole('button', { name: 'Close' }));
  expect(onClose).toHaveBeenCalledTimes(1);
  rerender(<LanguageSwitcher isOpen={false} onClose={onClose} />);
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});
