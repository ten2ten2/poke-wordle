/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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
      title: 'Pokemon Wordle',
    };
    return translations[key] || key;
  }),
  useLocale: jest.fn(() => 'en'),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    ...props
  }: {
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
  return function MockSettings({
    isOpen,
    onClose,
    onSettingsChange,
    currentSettings,
  }: MockSettingsProps) {
    return isOpen ? (
      <div data-testid="settings-modal">
        <button onClick={onClose}>Close Settings</button>
        <button
          onClick={() =>
            onSettingsChange({ ...currentSettings, maxGuesses: 5 })
          }
        >
          Change Settings
        </button>
      </div>
    ) : null;
  };
});

jest.mock('../LanguageSwitcher', () => {
  return function MockLanguageSwitcher({
    isOpen,
    onClose,
  }: MockLanguageSwitcherProps) {
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
  guessOrder: 'reverse',
};

const mockOnSettingsChange = jest.fn();

const defaultProps = {
  onSettingsChange: mockOnSettingsChange,
  currentSettings: defaultSettings,
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(localStorage.getItem).mockReturnValue('true');
});

test('renders the home link and available navigation actions', () => {
  render(<Navbar {...defaultProps} />);
  expect(screen.getByRole('link', { name: 'Pokemon Wordle' })).toHaveAttribute(
    'href',
    '/',
  );
  for (const name of ['About', 'Settings', 'Language'])
    expect(screen.getByRole('button', { name })).toBeVisible();
});

test('hides game-specific actions on content pages', () => {
  render(<Navbar showAbout={false} showSettings={false} />);
  expect(
    screen.queryByRole('button', { name: 'About' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Settings' }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Language' })).toBeVisible();
});

test('opens settings and passes changes to the game', async () => {
  render(<Navbar {...defaultProps} />);
  await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
  await userEvent.click(
    await screen.findByRole('button', { name: 'Change Settings' }),
  );
  expect(mockOnSettingsChange).toHaveBeenCalledWith({
    ...defaultSettings,
    maxGuesses: 5,
  });
});

test('opens and closes the language picker', async () => {
  render(<Navbar {...defaultProps} />);
  await userEvent.click(screen.getByRole('button', { name: 'Language' }));
  await userEvent.click(screen.getByRole('button', { name: 'Close Language' }));
  expect(screen.queryByTestId('language-modal')).not.toBeInTheDocument();
});

test('shows instructions once and saves dismissal', async () => {
  jest.mocked(localStorage.getItem).mockReturnValue(null);
  render(<Navbar {...defaultProps} />);
  await userEvent.click(
    await screen.findByRole('button', { name: 'Close About' }),
  );
  expect(localStorage.setItem).toHaveBeenCalledWith('hasSeenAbout_en', 'true');
  await waitFor(() =>
    expect(screen.queryByTestId('about-modal')).not.toBeInTheDocument(),
  );
});
