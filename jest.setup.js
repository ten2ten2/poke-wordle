import '@testing-library/jest-dom';
import { mockAnimationsApi } from 'jsdom-testing-mocks';

if (typeof window !== 'undefined') {
  mockAnimationsApi();
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
    writable: true,
  });
  global.ResizeObserver = jest
    .fn()
    .mockImplementation(() => ({
      observe() {},
      unobserve() {},
      disconnect() {},
    }));
  global.IntersectionObserver = jest
    .fn()
    .mockImplementation(() => ({
      observe() {},
      unobserve() {},
      disconnect() {},
    }));
}

jest.mock('next-intl', () => ({
  useTranslations: () => (key) => key,
  useLocale: () => 'en',
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  // Strip Next-only props before rendering a native image in jsdom.
  default: (props) => {
    const domProps = { ...props };
    for (const key of [
      'fill',
      'priority',
      'preload',
      'unoptimized',
      'loader',
      'quality',
    ])
      delete domProps[key];
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...domProps} />;
  },
}));
