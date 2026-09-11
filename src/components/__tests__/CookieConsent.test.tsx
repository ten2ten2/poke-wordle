import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CookieConsent from '../CookieConsent';
import { getCookieConsentStatus } from '@/lib/consent';

jest.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => {
    const messages = jest.requireActual('@/messages/en.json').cookieConsent;
    return messages[key];
  },
}));

let values: Map<string, string>;
beforeEach(() => {
  values = new Map();
  jest
    .mocked(localStorage.getItem)
    .mockImplementation((key) => values.get(key) ?? null);
  jest.mocked(localStorage.setItem).mockImplementation((key, value) => {
    values.set(key, value);
  });
});

test('shows the choice and privacy link on a first visit', () => {
  render(<CookieConsent />);
  expect(screen.getByRole('button', { name: 'Accept' })).toBeVisible();
  expect(screen.getByRole('link', { name: 'Learn more' })).toHaveAttribute(
    'href',
    '/privacy-and-terms',
  );
});

test.each(['accepted', 'declined'])(
  'hides the banner for a saved %s choice',
  (choice) => {
    values.set('cookie-consent', choice);
    render(<CookieConsent />);
    expect(
      screen.queryByRole('button', { name: 'Accept' }),
    ).not.toBeInTheDocument();
  },
);

test.each([
  ['Accept', 'accepted'],
  ['Decline', 'declined'],
])('persists %s and invokes the matching callback', async (label, value) => {
  const onAccept = jest.fn();
  const onDecline = jest.fn();
  render(<CookieConsent onAccept={onAccept} onDecline={onDecline} />);
  await userEvent.click(screen.getByRole('button', { name: label }));
  expect(getCookieConsentStatus()).toBe(value);
  expect(value === 'accepted' ? onAccept : onDecline).toHaveBeenCalledTimes(1);
  expect(
    screen.queryByRole('button', { name: 'Accept' }),
  ).not.toBeInTheDocument();
});

test('dismissal does not grant consent', async () => {
  render(<CookieConsent />);
  await userEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(getCookieConsentStatus()).toBeNull();
  expect(
    screen.queryByRole('button', { name: 'Accept' }),
  ).not.toBeInTheDocument();
});

test('reflects a consent choice made in another tab', () => {
  render(<CookieConsent />);
  act(() => {
    values.set('cookie-consent', 'declined');
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'cookie-consent' }),
    );
  });
  expect(
    screen.queryByRole('button', { name: 'Accept' }),
  ).not.toBeInTheDocument();
});

test('remains usable when storage is unavailable', async () => {
  jest.mocked(localStorage.setItem).mockImplementation(() => {
    throw new Error('Storage unavailable');
  });
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const onAccept = jest.fn();
  render(<CookieConsent onAccept={onAccept} />);
  await userEvent.click(screen.getByRole('button', { name: 'Accept' }));
  expect(onAccept).toHaveBeenCalledTimes(1);
  expect(
    screen.queryByRole('button', { name: 'Accept' }),
  ).not.toBeInTheDocument();
  warning.mockRestore();
});
