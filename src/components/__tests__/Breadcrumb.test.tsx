/**
 * @jest-environment jsdom
 */

/* eslint-disable @typescript-eslint/no-require-imports */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import Breadcrumb, { BreadcrumbItem } from '../Breadcrumb';

// Create mock translation function
const createMockT = (translations: Record<string, string> = {}) => {
  return (key: string, options?: { defaultValue?: string }) => {
    const defaultTranslations: Record<string, string> = {
      'common.breadcrumb': 'Breadcrumb',
      'common.home': 'Home',
    };
    const allTranslations = { ...defaultTranslations, ...translations };
    return allTranslations[key] || options?.defaultValue || key;
  };
};

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(),
  useLocale: jest.fn(),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  interface MockLinkProps {
    children: React.ReactNode;
    href: string;
    className?: string;
    title?: string;
    [key: string]: unknown;
  }

  return function MockLink({
    children,
    href,
    className,
    title,
    ...props
  }: MockLinkProps) {
    return (
      <a href={href} className={className} title={title} {...props}>
        {children}
      </a>
    );
  };
});

// Mock Heroicons
jest.mock('@heroicons/react/20/solid', () => ({
  ChevronRightIcon: function MockChevronRightIcon({
    className,
    ...props
  }: {
    className?: string;
    [key: string]: unknown;
  }) {
    return (
      <svg data-testid="chevron-right-icon" className={className} {...props} />
    );
  },
  HomeIcon: function MockHomeIcon({
    className,
    ...props
  }: {
    className?: string;
    [key: string]: unknown;
  }) {
    return <svg data-testid="home-icon" className={className} {...props} />;
  },
}));

// Import the mocked functions after mocking
const { useTranslations, useLocale } = require('next-intl');

describe('Breadcrumb', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useTranslations to return our mock translation function
    useTranslations.mockReturnValue(createMockT());

    // Mock useLocale to return English by default
    useLocale.mockReturnValue('en');
  });

  describe('Rendering', () => {
    test('renders breadcrumb navigation with proper ARIA attributes', () => {
      const items: BreadcrumbItem[] = [];

      render(<Breadcrumb items={items} />);

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveAttribute('aria-label', 'Breadcrumb');

      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
    });

    test('renders home link with correct href for English locale', () => {
      useLocale.mockReturnValue('en');
      const items: BreadcrumbItem[] = [];

      render(<Breadcrumb items={items} />);

      const homeLink = screen.getByRole('link');
      expect(homeLink).toHaveAttribute('href', '/');
      expect(homeLink).toHaveAttribute('title', 'Home');
    });

    test('renders home link with correct href for non-English locale', () => {
      useLocale.mockReturnValue('zh-hans');
      const items: BreadcrumbItem[] = [];

      render(<Breadcrumb items={items} />);

      const homeLink = screen.getByRole('link');
      expect(homeLink).toHaveAttribute('href', '/zh-hans');
    });

    test('renders home icon with proper accessibility attributes', () => {
      const items: BreadcrumbItem[] = [];

      render(<Breadcrumb items={items} />);

      const homeIcon = screen.getByTestId('home-icon');
      expect(homeIcon).toBeInTheDocument();
      expect(homeIcon).toHaveAttribute('aria-hidden', 'true');
      expect(homeIcon).toHaveClass('h-5', 'w-5', 'shrink-0');
    });

    test('renders screen reader text for home link', () => {
      const items: BreadcrumbItem[] = [];

      render(<Breadcrumb items={items} />);

      const screenReaderText = screen.getByText('Home');
      expect(screenReaderText).toBeInTheDocument();
      expect(screenReaderText).toHaveClass('sr-only');
    });

    test('applies custom className to navigation element', () => {
      const items: BreadcrumbItem[] = [];
      const customClass = 'custom-breadcrumb-class';

      render(<Breadcrumb items={items} className={customClass} />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('flex', customClass);
    });
  });

  describe('Breadcrumb Items', () => {
    test('renders single breadcrumb item as link when href provided and not current', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Category', href: '/category' },
      ];

      render(<Breadcrumb items={items} />);

      const categoryLink = screen.getByRole('link', { name: 'Category' });
      expect(categoryLink).toBeInTheDocument();
      expect(categoryLink).toHaveAttribute('href', '/category');
      expect(categoryLink).toHaveClass(
        'ml-2',
        'text-sm',
        'font-medium',
        'text-gray-500',
        'hover:text-gray-700',
        'transition-colors',
        'duration-200',
      );
      expect(categoryLink).not.toHaveAttribute('aria-current');
    });

    test('renders single breadcrumb item as span when current is true', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Current Page', href: '/current', current: true },
      ];

      render(<Breadcrumb items={items} />);

      const currentItem = screen.getByText('Current Page');
      expect(currentItem).toBeInTheDocument();
      expect(currentItem.tagName).toBe('SPAN');
      expect(currentItem).toHaveAttribute('aria-current', 'page');
      expect(currentItem).toHaveClass(
        'ml-2',
        'text-sm',
        'font-medium',
        'text-gray-900',
      );
    });

    test('renders single breadcrumb item as span when no href provided', () => {
      const items: BreadcrumbItem[] = [{ label: 'Non-linkable Item' }];

      render(<Breadcrumb items={items} />);

      const item = screen.getByText('Non-linkable Item');
      expect(item).toBeInTheDocument();
      expect(item.tagName).toBe('SPAN');
      expect(item).toHaveClass(
        'ml-2',
        'text-sm',
        'font-medium',
        'text-gray-500',
      );
    });

    test('renders multiple breadcrumb items with separators', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Category', href: '/category' },
        { label: 'Subcategory', href: '/category/subcategory' },
        { label: 'Current Page', current: true },
      ];

      render(<Breadcrumb items={items} />);

      // Check that all items are rendered
      expect(
        screen.getByRole('link', { name: 'Category' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Subcategory' }),
      ).toBeInTheDocument();
      expect(screen.getByText('Current Page')).toBeInTheDocument();

      // Check that separators are rendered
      const separators = screen.getAllByTestId('chevron-right-icon');
      expect(separators).toHaveLength(3); // One for each breadcrumb item
      separators.forEach((separator) => {
        expect(separator).toHaveAttribute('aria-hidden', 'true');
        expect(separator).toHaveClass(
          'h-5',
          'w-5',
          'shrink-0',
          'text-gray-400',
        );
      });
    });

    test('handles empty items array', () => {
      const items: BreadcrumbItem[] = [];

      render(<Breadcrumb items={items} />);

      // Should still render home link
      const homeLink = screen.getByRole('link');
      expect(homeLink).toBeInTheDocument();

      // Should not render any separators
      expect(
        screen.queryByTestId('chevron-right-icon'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Locale Handling', () => {
    test('generates correct home href for different locales', () => {
      const testCases = [
        { locale: 'en', expectedHref: '/' },
        { locale: 'zh-hans', expectedHref: '/zh-hans' },
        { locale: 'ja', expectedHref: '/ja' },
        { locale: 'es', expectedHref: '/es' },
        { locale: 'fr', expectedHref: '/fr' },
        { locale: 'de', expectedHref: '/de' },
      ];

      testCases.forEach(({ locale, expectedHref }) => {
        useLocale.mockReturnValue(locale);
        const items: BreadcrumbItem[] = [];

        const { unmount } = render(<Breadcrumb items={items} />);

        const homeLink = screen.getByRole('link');
        expect(homeLink).toHaveAttribute('href', expectedHref);

        unmount();
      });
    });
  });

  describe('Translation Integration', () => {
    test('uses translations for accessibility labels', () => {
      useTranslations.mockReturnValue(
        createMockT({
          'common.breadcrumb': 'Navigation en miettes',
          'common.home': 'Accueil',
        }),
      );

      const items: BreadcrumbItem[] = [];

      render(<Breadcrumb items={items} />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Navigation en miettes');
    });

    test('falls back to default values when translations are missing', () => {
      useTranslations.mockReturnValue(
        (key: string, options?: { defaultValue?: string }) => {
          return options?.defaultValue || key;
        },
      );

      const items: BreadcrumbItem[] = [];

      render(<Breadcrumb items={items} />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Breadcrumb');

      const homeLink = screen.getByRole('link');
      expect(homeLink).toHaveAttribute('title', 'Home');
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA structure', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Category', href: '/category' },
        { label: 'Current Page', current: true },
      ];

      render(<Breadcrumb items={items} />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label');

      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(3); // Home + 2 breadcrumb items

      const currentPageItem = screen.getByText('Current Page');
      expect(currentPageItem).toHaveAttribute('aria-current', 'page');
    });

    test('sets aria-current only for current page', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Category', href: '/category' },
        { label: 'Subcategory', href: '/category/subcategory' },
        { label: 'Current Page', current: true },
      ];

      render(<Breadcrumb items={items} />);

      const categoryLink = screen.getByRole('link', { name: 'Category' });
      const subcategoryLink = screen.getByRole('link', { name: 'Subcategory' });
      const currentPageSpan = screen.getByText('Current Page');

      expect(categoryLink).not.toHaveAttribute('aria-current');
      expect(subcategoryLink).not.toHaveAttribute('aria-current');
      expect(currentPageSpan).toHaveAttribute('aria-current', 'page');
    });

    test('icons are hidden from screen readers', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Category', href: '/category' },
      ];

      render(<Breadcrumb items={items} />);

      const homeIcon = screen.getByTestId('home-icon');
      const chevronIcon = screen.getByTestId('chevron-right-icon');

      expect(homeIcon).toHaveAttribute('aria-hidden', 'true');
      expect(chevronIcon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('CSS Classes', () => {
    test('applies correct classes to navigation wrapper', () => {
      const items: BreadcrumbItem[] = [];

      render(<Breadcrumb items={items} />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('flex');
    });

    test('applies correct classes to breadcrumb list', () => {
      const items: BreadcrumbItem[] = [];

      render(<Breadcrumb items={items} />);

      const list = screen.getByRole('list');
      expect(list).toHaveClass('flex', 'items-center', 'space-x-2');
    });

    test('applies correct hover styles to links', () => {
      const items: BreadcrumbItem[] = [
        { label: 'Category', href: '/category' },
      ];

      render(<Breadcrumb items={items} />);

      const homeLink = screen.getByTitle('Home');
      const categoryLink = screen.getByRole('link', { name: 'Category' });

      expect(homeLink).toHaveClass(
        'hover:text-gray-500',
        'transition-colors',
        'duration-200',
      );
      expect(categoryLink).toHaveClass(
        'hover:text-gray-700',
        'transition-colors',
        'duration-200',
      );
    });
  });
});
