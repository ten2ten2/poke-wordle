/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from '../Navbar';
import { GameSettings } from '@/types/pokemon';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string) => {
    const translations: Record<string, string> = {
      'navbar.about': 'About',
      'navbar.settings': 'Settings',
      'navbar.language': 'Language',
      'navbar.knowledge': 'Knowledge',
      'navbar.main_navigation': 'Main navigation',
      'common.close': 'Close',
      'common.pokemon': 'Pokemon',
      'common.wordle': 'Wordle',
      'title': 'Pokemon Wordle'
    };
    return translations[key] || key;
  }),
  useLocale: jest.fn(() => 'en')
}));

// Mock the knowledge configuration
jest.mock('@/config/knowledge', () => ({
  isKnowledgeSupported: jest.fn((locale: string) => ['en', 'ja', 'zh-hans', 'zh-hant'].includes(locale)),
  KNOWLEDGE_SUPPORTED_LOCALES: ['en', 'ja', 'zh-hans', 'zh-hant']
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: { 
    children: React.ReactNode; 
    href: string; 
    [key: string]: unknown;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

// Mock child components
interface MockSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange: (settings: GameSettings) => void;
  currentSettings: GameSettings;
}

interface MockLanguageSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MockAboutProps {
  isOpen: boolean;
  onClose: () => void;
}

jest.mock('../Settings', () => {
  return function MockSettings({ isOpen, onClose, onSettingsChange, currentSettings }: MockSettingsProps) {
    return isOpen ? (
      <div data-testid="settings-modal">
        <button onClick={onClose}>Close Settings</button>
        <button onClick={() => onSettingsChange({...currentSettings, maxGuesses: 5})}>Change Settings</button>
      </div>
    ) : null;
  };
});

jest.mock('../LanguageSwitcher', () => {
  return function MockLanguageSwitcher({ isOpen, onClose }: MockLanguageSwitcherProps) {
    return isOpen ? (
      <div data-testid="language-modal">
        <button onClick={onClose}>Close Language</button>
      </div>
    ) : null;
  };
});

jest.mock('../About', () => {
  return function MockAbout({ isOpen, onClose }: MockAboutProps) {
    return isOpen ? (
      <div data-testid="about-modal">
        <button onClick={onClose}>Close About</button>
      </div>
    ) : null;
  };
});

const defaultSettings: GameSettings = {
  maxGuesses: 10,
  selectedGenerations: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  isPrankster: false,
  isGenArrow: false,
  guessOrder: 'reverse'
};

const mockOnSettingsChange = jest.fn();

const defaultProps = {
  onSettingsChange: mockOnSettingsChange,
  currentSettings: defaultSettings
};

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('Navbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Rendering', () => {
    test('renders navbar with title', async () => {
      await act(async () => {
        render(<Navbar {...defaultProps} />);
      });
      
      expect(screen.getByText('Pokemon Wordle')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    test('renders all navigation buttons by default', async () => {
      await act(async () => {
        render(<Navbar {...defaultProps} />);
      });
      
      expect(screen.getByLabelText('Knowledge')).toBeInTheDocument();
      expect(screen.getByLabelText('About')).toBeInTheDocument();
      expect(screen.getByLabelText('Settings')).toBeInTheDocument();
      expect(screen.getByLabelText('Language')).toBeInTheDocument();
    });

    test('has proper ARIA attributes', async () => {
      await act(async () => {
        render(<Navbar {...defaultProps} />);
      });
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Main navigation');
      
      const buttonList = screen.getByRole('list');
      expect(buttonList).toBeInTheDocument();
    });

    test('renders knowledge link with correct href for English locale', async () => {
      await act(async () => {
        render(<Navbar {...defaultProps} />);
      });
      
      const knowledgeLink = screen.getByLabelText('Knowledge');
      expect(knowledgeLink).toHaveAttribute('href', '/knowledge');
    });

    test('renders knowledge link with correct href for non-English locale', async () => {
      // Mock the useLocale hook to return 'ja'
      const { useLocale } = jest.requireMock('next-intl');
      useLocale.mockReturnValue('ja');
      
      await act(async () => {
        render(<Navbar {...defaultProps} />);
      });
      
      const knowledgeLink = screen.getByLabelText('Knowledge');
      expect(knowledgeLink).toHaveAttribute('href', '/ja/knowledge');
      
      // Reset the mock back to 'en' for other tests
      useLocale.mockReturnValue('en');
    });
  });

  describe('Conditional Rendering', () => {
    test('shows knowledge button for supported locales', async () => {
      await act(async () => {
        render(<Navbar {...defaultProps} />);
      });
      
      expect(screen.getByLabelText('Knowledge')).toBeInTheDocument();
    });

    test('hides knowledge button for unsupported locales', async () => {
      const { useLocale } = jest.requireMock('next-intl');
      const { isKnowledgeSupported } = jest.requireMock('@/config/knowledge');
      
      // Mock unsupported locale
      useLocale.mockReturnValue('fr');
      isKnowledgeSupported.mockReturnValue(false);
      
      await act(async () => {
        render(<Navbar {...defaultProps} />);
      });
      
      expect(screen.queryByLabelText('Knowledge')).not.toBeInTheDocument();
      
      // Reset mocks
      useLocale.mockReturnValue('en');
      isKnowledgeSupported.mockImplementation((locale: string) => ['en', 'ja', 'zh-hans', 'zh-hant'].includes(locale));
    });

    test('hides about button when showAbout is false', async () => {
      await act(async () => {
        render(<Navbar {...defaultProps} showAbout={false} />);
      });
      
      expect(screen.queryByLabelText('About')).not.toBeInTheDocument();
    });

    test('hides settings button when showSettings is false', async () => {
      await act(async () => {
        render(<Navbar {...defaultProps} showSettings={false} />);
      });
      
      expect(screen.queryByLabelText('Settings')).not.toBeInTheDocument();
    });
  });

  describe('Modal Interactions', () => {
    test('opens and closes about modal', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<Navbar {...defaultProps} />);
      });
      
      const aboutButton = screen.getByLabelText('About');
      
      await act(async () => {
        await user.click(aboutButton);
      });
      
      expect(screen.getByTestId('about-modal')).toBeInTheDocument();
      
      const closeButton = screen.getByText('Close About');
      
      await act(async () => {
        await user.click(closeButton);
      });
      
      expect(screen.queryByTestId('about-modal')).not.toBeInTheDocument();
    });

    test('opens and closes settings modal', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<Navbar {...defaultProps} />);
      });
      
      const settingsButton = screen.getByLabelText('Settings');
      
      await act(async () => {
        await user.click(settingsButton);
      });
      
      expect(screen.getByTestId('settings-modal')).toBeInTheDocument();
      
      const closeButton = screen.getByText('Close Settings');
      
      await act(async () => {
        await user.click(closeButton);
      });
      
      expect(screen.queryByTestId('settings-modal')).not.toBeInTheDocument();
    });

    test('opens and closes language modal', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<Navbar {...defaultProps} />);
      });
      
      const languageButton = screen.getByLabelText('Language');
      
      await act(async () => {
        await user.click(languageButton);
      });
      
      expect(screen.getByTestId('language-modal')).toBeInTheDocument();
      
      const closeButton = screen.getByText('Close Language');
      
      await act(async () => {
        await user.click(closeButton);
      });
      
      expect(screen.queryByTestId('language-modal')).not.toBeInTheDocument();
    });

    test('passes settings change handler correctly', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<Navbar {...defaultProps} />);
      });
      
      const settingsButton = screen.getByLabelText('Settings');
      
      await act(async () => {
        await user.click(settingsButton);
      });
      
      const changeButton = screen.getByText('Change Settings');
      
      await act(async () => {
        await user.click(changeButton);
      });
      
      expect(mockOnSettingsChange).toHaveBeenCalledWith({
        ...defaultSettings,
        maxGuesses: 5
      });
    });
  });

  describe('First-time User Experience', () => {
    test('shows about modal for first-time users', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      await act(async () => {
        render(<Navbar {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('about-modal')).toBeInTheDocument();
      });
    });

    test('does not show about modal for returning users', async () => {
      mockLocalStorage.getItem.mockReturnValue('true');
      
      await act(async () => {
        render(<Navbar {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(screen.queryByTestId('about-modal')).not.toBeInTheDocument();
      });
    });

    test('saves about modal view state to localStorage', async () => {
      const user = userEvent.setup();
      mockLocalStorage.getItem.mockReturnValue(null);
      
      await act(async () => {
        render(<Navbar {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('about-modal')).toBeInTheDocument();
      });
      
      const closeButton = screen.getByText('Close About');
      
      await act(async () => {
        await user.click(closeButton);
      });
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('hasSeenAbout_en', 'true');
    });
  });

  describe('Accessibility', () => {
    test('buttons have proper accessibility attributes', async () => {
      await act(async () => {
        render(<Navbar {...defaultProps} />);
      });
      
      const knowledgeLink = screen.getByLabelText('Knowledge');
      const aboutButton = screen.getByLabelText('About');
      const settingsButton = screen.getByLabelText('Settings');
      const languageButton = screen.getByLabelText('Language');
      
      expect(knowledgeLink).toHaveAttribute('title', 'Knowledge');
      
      expect(aboutButton).toHaveAttribute('type', 'button');
      expect(aboutButton).toHaveAttribute('title', 'About');
      
      expect(settingsButton).toHaveAttribute('type', 'button');
      expect(settingsButton).toHaveAttribute('title', 'Settings');
      
      expect(languageButton).toHaveAttribute('type', 'button');
      expect(languageButton).toHaveAttribute('title', 'Language');
    });

    test('buttons are keyboard accessible', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<Navbar {...defaultProps} />);
      });
      
      // Tab to the first focusable element (home link)
      await act(async () => {
        await user.tab();
      });
      
      const homeLink = screen.getByTitle('Pokemon Wordle');
      expect(document.activeElement).toBe(homeLink);
      
      // Tab to the knowledge link
      await act(async () => {
        await user.tab();
      });
      
      const knowledgeLink = screen.getByLabelText('Knowledge');
      expect(document.activeElement).toBe(knowledgeLink);
      
      // Tab to the about button
      await act(async () => {
        await user.tab();
      });
      
      const aboutButton = screen.getByLabelText('About');
      expect(document.activeElement).toBe(aboutButton);
      
      await act(async () => {
        await user.keyboard(' ');
      });
      
      expect(screen.getByTestId('about-modal')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles localStorage errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      
      await act(async () => {
        render(<Navbar {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('about-modal')).toBeInTheDocument();
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('localStorage not available:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    test('handles localStorage setItem errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      mockLocalStorage.getItem.mockReturnValue(null);
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage write failed');
      });
      
      await act(async () => {
        render(<Navbar {...defaultProps} />);
      });
      
      await waitFor(() => {
        expect(screen.getByTestId('about-modal')).toBeInTheDocument();
      });
      
      const closeButton = screen.getByText('Close About');
      
      await act(async () => {
        await user.click(closeButton);
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Error saving to localStorage:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Responsive Design', () => {
    test('applies responsive classes', async () => {
      await act(async () => {
        render(<Navbar {...defaultProps} />);
      });
      
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('sticky', 'top-0', 'z-40');
      
      const title = screen.getByText('Pokemon Wordle');
      expect(title).toHaveClass('text-lg', 'sm:text-xl', 'lg:text-2xl');
    });
  });

  describe('Component Integration', () => {
    test('passes correct props to Settings component', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<Navbar {...defaultProps} />);
      });
      
      const settingsButton = screen.getByLabelText('Settings');
      
      await act(async () => {
        await user.click(settingsButton);
      });
      
      // Settings modal should be rendered with correct props
      expect(screen.getByTestId('settings-modal')).toBeInTheDocument();
    });

    test('modal states are independent', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<Navbar {...defaultProps} />);
      });
      
      // Open settings
      const settingsButton = screen.getByLabelText('Settings');
      
      await act(async () => {
        await user.click(settingsButton);
      });
      
      // Open language switcher
      const languageButton = screen.getByLabelText('Language');
      
      await act(async () => {
        await user.click(languageButton);
      });
      
      // Both should be open
      expect(screen.getByTestId('settings-modal')).toBeInTheDocument();
      expect(screen.getByTestId('language-modal')).toBeInTheDocument();
    });
  });
}); 