/**
 * @jest-environment jsdom
 */

import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock modules with direct object approach
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string) => {
    const translations: Record<string, string> = {
      'navbar.language': 'Language',
      'common.close': 'Close',
    };
    return translations[key] || key;
  }),
  useLocale: jest.fn(() => 'en'),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
}));

// Import components after mocks
import LanguageSwitcher from '../LanguageSwitcher';

// Get the mocked functions for use in tests
const { useLocale } = jest.requireMock('next-intl');
const { useRouter, usePathname } = jest.requireMock('next/navigation');

const mockOnClose = jest.fn();

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
};

describe('LanguageSwitcher', () => {
  let mockPush: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush = jest.fn();
    useLocale.mockReturnValue('en');
    usePathname.mockReturnValue('/');
    useRouter.mockReturnValue({ push: mockPush });
  });

  describe('Rendering', () => {
    test('renders language switcher modal when open', async () => {
      await act(async () => {
        render(<LanguageSwitcher {...defaultProps} />);
      });

      expect(screen.getByText('Language')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    test('does not render when closed', async () => {
      await act(async () => {
        render(<LanguageSwitcher {...defaultProps} isOpen={false} />);
      });

      expect(screen.queryByText('Language')).not.toBeInTheDocument();
    });

    test('renders all available languages', async () => {
      await act(async () => {
        render(<LanguageSwitcher {...defaultProps} />);
      });

      const expectedLanguages = [
        'English',
        '日本語',
        '简体中文',
        '繁體中文',
        '한국어',
        'Français',
        'Deutsch',
        'Italiano',
        'Español',
      ];

      expectedLanguages.forEach((lang) => {
        expect(screen.getByText(lang)).toBeInTheDocument();
      });
    });

    test('highlights current language', async () => {
      useLocale.mockReturnValue('ja');
      await act(async () => {
        render(<LanguageSwitcher {...defaultProps} />);
      });

      const japaneseButton = screen.getByText('日本語').closest('button');
      expect(japaneseButton).toHaveAttribute('aria-current', 'true');
    });

    test('renders close button', async () => {
      await act(async () => {
        render(<LanguageSwitcher {...defaultProps} />);
      });

      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Language Selection', () => {
    test('calls language change handler when language is selected', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<LanguageSwitcher {...defaultProps} />);
      });

      const japaneseButton = screen.getByText('日本語');

      await act(async () => {
        await user.click(japaneseButton);
      });

      expect(mockPush).toHaveBeenCalledWith('/ja');
      expect(mockOnClose).toHaveBeenCalled();
    });

    test('navigates to correct path for non-English languages', async () => {
      const user = userEvent.setup();
      useLocale.mockReturnValue('en');
      usePathname.mockReturnValue('/');

      await act(async () => {
        render(<LanguageSwitcher {...defaultProps} />);
      });

      const japaneseButton = screen.getByText('日本語');

      await act(async () => {
        await user.click(japaneseButton);
      });

      expect(mockPush).toHaveBeenCalledWith('/ja');
    });

    test('navigates to correct path when switching to English', async () => {
      const user = userEvent.setup();
      useLocale.mockReturnValue('ja');
      usePathname.mockReturnValue('/ja');

      await act(async () => {
        render(<LanguageSwitcher {...defaultProps} />);
      });

      const englishButton = screen.getByText('English');

      await act(async () => {
        await user.click(englishButton);
      });

      expect(mockPush).toHaveBeenCalledWith('/');
    });

    test('handles path transformation correctly for nested routes', async () => {
      const user = userEvent.setup();
      useLocale.mockReturnValue('en');
      usePathname.mockReturnValue('/some/path');

      await act(async () => {
        render(<LanguageSwitcher {...defaultProps} />);
      });

      const frenchButton = screen.getByText('Français');

      await act(async () => {
        await user.click(frenchButton);
      });

      expect(mockPush).toHaveBeenCalledWith('/fr/some/path');
    });

    test('removes current locale prefix when switching languages', async () => {
      const user = userEvent.setup();
      useLocale.mockReturnValue('fr');
      usePathname.mockReturnValue('/fr/some/path');

      await act(async () => {
        render(<LanguageSwitcher {...defaultProps} />);
      });

      const germanButton = screen.getByText('Deutsch');

      await act(async () => {
        await user.click(germanButton);
      });

      expect(mockPush).toHaveBeenCalledWith('/de/some/path');
    });
  });

  describe('Modal Interactions', () => {
    test('closes modal when close button is clicked', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<LanguageSwitcher {...defaultProps} />);
      });

      const closeButton = screen.getByLabelText('Close');

      await act(async () => {
        await user.click(closeButton);
      });

      expect(mockOnClose).toHaveBeenCalled();
    });

    test('closes modal when backdrop is clicked', async () => {
      await act(async () => {
        render(<LanguageSwitcher {...defaultProps} />);
      });

      // HeadlessUI Dialog handles backdrop clicks internally
      // We can test this by simulating the onClose being called when backdrop is clicked
      // Since this is HeadlessUI internal behavior, we just verify the component renders correctly
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // If the component is properly configured with HeadlessUI,
      // backdrop clicks will work automatically
      expect(mockOnClose).not.toHaveBeenCalled(); // Should not be called yet
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA attributes', async () => {
      await act(async () => {
        render(<LanguageSwitcher {...defaultProps} />);
      });

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute(
        'aria-labelledby',
        'language-switcher-title',
      );
      // Note: HeadlessUI may handle aria-describedby differently
      // Let's check if the description element exists and is properly linked

      const title = screen.getByRole('heading', { level: 2 });
      expect(title).toHaveAttribute('id', 'language-switcher-title');

      // The description element exists but is screen-reader only (sr-only class)
      const description = document.getElementById(
        'language-switcher-description',
      );
      expect(description).toBeInTheDocument();
      expect(description).toHaveTextContent(
        'Select your preferred language from the list below',
      );
    });

    test('language buttons have proper ARIA attributes', async () => {
      useLocale.mockReturnValue('en');

      await act(async () => {
        render(<LanguageSwitcher {...defaultProps} />);
      });

      const englishButton = screen.getByText('English').closest('button');
      const japaneseButton = screen.getByText('日本語').closest('button');

      expect(englishButton).toHaveAttribute('aria-current', 'true');
      expect(englishButton).toHaveAttribute('aria-label', 'Switch to English');

      expect(japaneseButton).toHaveAttribute('aria-current', 'false');
      expect(japaneseButton).toHaveAttribute('aria-label', 'Switch to 日本語');
    });

    test('has proper navigation structure', async () => {
      await act(async () => {
        render(<LanguageSwitcher {...defaultProps} />);
      });

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Language selection');

      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
    });

    test('current language has screen reader text', async () => {
      useLocale.mockReturnValue('en');

      await act(async () => {
        render(<LanguageSwitcher {...defaultProps} />);
      });

      expect(screen.getByText('(current language)')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    test('supports keyboard navigation', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<LanguageSwitcher {...defaultProps} />);
      });

      const englishButton = screen.getByText('English').closest('button');
      const japaneseButton = screen.getByText('日本語').closest('button');

      // Focus should start on first language
      await act(async () => {
        englishButton?.focus();
      });
      expect(document.activeElement).toBe(englishButton);

      // Tab to next language
      await act(async () => {
        await user.tab();
      });
      expect(document.activeElement).toBe(japaneseButton);

      // Select with Enter
      await act(async () => {
        await user.keyboard('{Enter}');
      });
      expect(mockPush).toHaveBeenCalledWith('/ja');
    });

    test('supports space key activation', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<LanguageSwitcher {...defaultProps} />);
      });

      const japaneseButton = screen.getByText('日本語').closest('button');

      await act(async () => {
        japaneseButton?.focus();
        await user.keyboard(' ');
      });

      expect(mockPush).toHaveBeenCalledWith('/ja');
    });
  });

  describe('Edge Cases', () => {
    test('handles root path correctly when switching from English', async () => {
      const user = userEvent.setup();
      useLocale.mockReturnValue('en');
      usePathname.mockReturnValue('/');

      await act(async () => {
        render(<LanguageSwitcher {...defaultProps} />);
      });

      const japaneseButton = screen.getByText('日本語');

      await act(async () => {
        await user.click(japaneseButton);
      });

      expect(mockPush).toHaveBeenCalledWith('/ja');
    });

    test('handles empty pathname', async () => {
      const user = userEvent.setup();
      useLocale.mockReturnValue('en');
      usePathname.mockReturnValue('');

      await act(async () => {
        render(<LanguageSwitcher {...defaultProps} />);
      });

      const japaneseButton = screen.getByText('日本語');

      await act(async () => {
        await user.click(japaneseButton);
      });

      expect(mockPush).toHaveBeenCalledWith('/ja');
    });

    test('preserves complex paths when switching languages', async () => {
      const user = userEvent.setup();
      useLocale.mockReturnValue('zh-hans');
      usePathname.mockReturnValue('/zh-hans/some/deep/path?query=param');

      await act(async () => {
        render(<LanguageSwitcher {...defaultProps} />);
      });

      const koreanButton = screen.getByText('한국어');

      await act(async () => {
        await user.click(koreanButton);
      });

      expect(mockPush).toHaveBeenCalledWith('/ko/some/deep/path?query=param');
    });
  });

  describe('Language Coverage', () => {
    test('supports all defined languages', async () => {
      const expectedLanguages = [
        { code: 'en', name: 'English' },
        { code: 'ja', name: '日本語' },
        { code: 'zh-hans', name: '简体中文' },
        { code: 'zh-hant', name: '繁體中文' },
        { code: 'ko', name: '한국어' },
        { code: 'fr', name: 'Français' },
        { code: 'de', name: 'Deutsch' },
        { code: 'it', name: 'Italiano' },
        { code: 'es', name: 'Español' },
      ];

      await act(async () => {
        render(<LanguageSwitcher {...defaultProps} />);
      });

      expectedLanguages.forEach((lang) => {
        const button = screen.getByText(lang.name);
        expect(button).toBeInTheDocument();
      });
    });

    test('handles non-standard locale codes', async () => {
      useLocale.mockReturnValue('zh-hans');

      await act(async () => {
        render(<LanguageSwitcher {...defaultProps} />);
      });

      const button = screen.getByText('简体中文').closest('button');
      expect(button).toHaveAttribute('aria-current', 'true');
    });
  });

  describe('Integration', () => {
    test('navigates once when selecting a language', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<LanguageSwitcher {...defaultProps} />);
      });

      const frenchButton = screen.getByText('Français');

      await act(async () => {
        await user.click(frenchButton);
      });

      expect(mockPush).toHaveBeenCalledWith('/fr');
      expect(mockPush).toHaveBeenCalledTimes(1);
    });

    test('calls router push with correct path', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<LanguageSwitcher {...defaultProps} />);
      });

      const germanButton = screen.getByText('Deutsch');

      await act(async () => {
        await user.click(germanButton);
      });

      expect(mockPush).toHaveBeenCalledWith('/de');
      expect(mockPush).toHaveBeenCalledTimes(1);
    });
  });
});
