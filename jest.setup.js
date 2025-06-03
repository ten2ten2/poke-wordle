import '@testing-library/jest-dom'
import { mockAnimationsApi } from 'jsdom-testing-mocks'

// Mock animations API to prevent HeadlessUI warnings (only in browser environment)
if (typeof window !== 'undefined') {
  mockAnimationsApi()
}

// Suppress console warnings for cleaner test output
const originalConsoleWarn = console.warn
const originalConsoleError = console.error

console.warn = (...args) => {
  // Suppress specific HeadlessUI warnings
  if (args[0]?.includes?.('Headless UI has polyfilled')) {
    return
  }
  // Suppress Next.js Image warnings in tests
  if (args[0]?.includes?.('Image with src') && args[0]?.includes?.('invalid "position"')) {
    return
  }
  if (args[0]?.includes?.('Image with src') && args[0]?.includes?.('height value of 0')) {
    return
  }
  // Suppress intentional storage test warnings
  if (args[0]?.includes?.('Failed to load game progress') || args[0]?.includes?.('Failed to load game settings')) {
    return
  }
  if (args[0]?.includes?.('Failed to save game settings')) {
    return
  }
  // Suppress intentional CookieConsent test warnings
  if (args[0]?.includes?.('Error saving cookie consent')) {
    return
  }
  originalConsoleWarn(...args)
}

console.error = (...args) => {
  // Suppress specific React warnings that are expected in tests
  if (args[0]?.includes?.('Warning: An update to TransitionRootFn inside a test was not wrapped in act')) {
    return
  }
  if (args[0]?.includes?.('Warning: An update to TransitionChildFn inside a test was not wrapped in act')) {
    return
  }
  // Suppress Next.js Image missing src warnings in tests
  if (args[0]?.includes?.('Image is missing required "src" property')) {
    return
  }
  // Suppress Next.js Image attribute warnings in tests
  if (args[0]?.includes?.('Warning: Received') && args[0]?.includes?.('for a non-boolean attribute')) {
    return
  }
  // Suppress intentional API test error messages
  if (args[0]?.includes?.('Error in checkGuess API')) {
    return
  }
  originalConsoleError(...args)
}

// Check if window is available (jsdom environment)
if (typeof window !== 'undefined') {
  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn(() => null),
      setItem: jest.fn(() => {}),
      removeItem: jest.fn(() => {}),
      clear: jest.fn(() => {}),
    },
    writable: true,
  })

  // Mock window.location
  Object.defineProperty(window, 'location', {
    value: {
      href: 'http://localhost:3000',
      pathname: '/',
      search: '',
      hash: '',
    },
    writable: true,
  })

  // Mock ResizeObserver
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }))

  // Mock IntersectionObserver
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }))
}

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key) => key,
  useLocale: () => 'en',
}))

// Mock Next.js router
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
}))

// Mock Next.js Image component to prevent warnings in tests
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
})) 