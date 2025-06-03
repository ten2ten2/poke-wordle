/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CookieConsent, { hasUserConsentedToCookies, hasUserDeclinedCookies, getCookieConsentStatus } from '../CookieConsent';

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

// Mock window.location
const mockLocation = {
  pathname: '/',
  search: '',
  hash: '',
  origin: 'http://localhost',
  href: 'http://localhost/'
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

const mockOnAccept = jest.fn();
const mockOnDecline = jest.fn();

const defaultProps = {
  onAccept: mockOnAccept,
  onDecline: mockOnDecline
};

describe('CookieConsent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocation.pathname = '/';
    
    // Clear any previous timer
    jest.clearAllTimers();
  });

  describe('Rendering', () => {
    test('renders cookie consent banner when no consent exists', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      render(<CookieConsent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('We use localStorage')).toBeInTheDocument();
      });
    });

    test('does not render when consent already exists', async () => {
      mockLocalStorage.getItem.mockReturnValue('accepted');
      
      render(<CookieConsent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('We use localStorage')).not.toBeInTheDocument();
      });
    });

    test('renders all required elements', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      render(<CookieConsent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('We use localStorage')).toBeInTheDocument();
        expect(screen.getByText('Accept')).toBeInTheDocument();
        expect(screen.getByText('Decline')).toBeInTheDocument();
        expect(screen.getByLabelText('Close')).toBeInTheDocument();
      });
    });

    test('renders privacy policy link', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      render(<CookieConsent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Learn more')).toBeInTheDocument();
        expect(screen.getByTitle('Privacy Policy & Terms of Service')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    test('calls onAccept and hides banner when accept is clicked', async () => {
      const user = userEvent.setup();
      mockLocalStorage.getItem.mockReturnValue(null);
      
      render(<CookieConsent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Accept')).toBeInTheDocument();
      });
      
      const acceptButton = screen.getByText('Accept');
      
      await act(async () => {
        await user.click(acceptButton);
      });
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('cookie-consent', 'accepted');
      expect(mockOnAccept).toHaveBeenCalled();
      
      await waitFor(() => {
        expect(screen.queryByText('We use localStorage')).not.toBeInTheDocument();
      });
    });

    test('calls onDecline and hides banner when decline is clicked', async () => {
      const user = userEvent.setup();
      mockLocalStorage.getItem.mockReturnValue(null);
      
      render(<CookieConsent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Decline')).toBeInTheDocument();
      });
      
      const declineButton = screen.getByText('Decline');
      
      await act(async () => {
        await user.click(declineButton);
      });
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('cookie-consent', 'declined');
      expect(mockOnDecline).toHaveBeenCalled();
      
      await waitFor(() => {
        expect(screen.queryByText('We use localStorage')).not.toBeInTheDocument();
      });
    });

    test('hides banner when close button is clicked', async () => {
      const user = userEvent.setup();
      mockLocalStorage.getItem.mockReturnValue(null);
      
      render(<CookieConsent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Close')).toBeInTheDocument();
      });
      
      const closeButton = screen.getByLabelText('Close');
      
      await act(async () => {
        await user.click(closeButton);
      });
      
      // The close button just dismisses without saving to localStorage
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
      
      await waitFor(() => {
        expect(screen.queryByText('We use localStorage')).not.toBeInTheDocument();
      });
    });
  });

  describe('Localization', () => {
    test('displays content in English by default', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockLocation.pathname = '/';
      
      render(<CookieConsent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('We use localStorage')).toBeInTheDocument();
        expect(screen.getByText('Accept')).toBeInTheDocument();
        expect(screen.getByText('Decline')).toBeInTheDocument();
      });
    });

    test('displays content in Japanese when on /ja route', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockLocation.pathname = '/ja/some-page';
      
      render(<CookieConsent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('localStorage を使用しています')).toBeInTheDocument();
        expect(screen.getByText('同意する')).toBeInTheDocument();
        expect(screen.getByText('拒否する')).toBeInTheDocument();
      });
    });

    test('displays content in Chinese when on /zh-hans route', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockLocation.pathname = '/zh-hans';
      
      render(<CookieConsent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('我们使用 localStorage')).toBeInTheDocument();
        expect(screen.getByText('接受')).toBeInTheDocument();
        expect(screen.getByText('拒绝')).toBeInTheDocument();
      });
    });

    test('handles route changes and updates language', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockLocation.pathname = '/';
      
      render(<CookieConsent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('We use localStorage')).toBeInTheDocument();
      });
      
      // Simulate route change
      act(() => {
        mockLocation.pathname = '/ja';
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
      
      await waitFor(() => {
        expect(screen.getByText('localStorage を使用しています')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles localStorage errors gracefully on accept', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      mockLocalStorage.getItem.mockReturnValue(null);
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      render(<CookieConsent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Accept')).toBeInTheDocument();
      });
      
      const acceptButton = screen.getByText('Accept');
      
      await act(async () => {
        await user.click(acceptButton);
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Error saving cookie consent:', expect.any(Error));
      expect(mockOnAccept).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    test('handles localStorage errors gracefully on decline', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      mockLocalStorage.getItem.mockReturnValue(null);
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      render(<CookieConsent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Decline')).toBeInTheDocument();
      });
      
      const declineButton = screen.getByText('Decline');
      
      await act(async () => {
        await user.click(declineButton);
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Error saving cookie consent:', expect.any(Error));
      expect(mockOnDecline).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    test('shows banner when localStorage is not available', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      
      render(<CookieConsent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('We use localStorage')).toBeInTheDocument();
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('localStorage not available:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA attributes', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      render(<CookieConsent {...defaultProps} />);
      
      await waitFor(() => {
        const closeButton = screen.getByLabelText('Close');
        expect(closeButton).toBeInTheDocument();
        expect(closeButton).toHaveAttribute('aria-label', 'Close');
      });
    });

    test('close button has proper accessibility attributes', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      render(<CookieConsent {...defaultProps} />);
      
      await waitFor(() => {
        const closeButton = screen.getByLabelText('Close');
        expect(closeButton).toHaveAttribute('aria-label', 'Close');
      });
    });

    test('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      mockLocalStorage.getItem.mockReturnValue(null);
      
      render(<CookieConsent {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Accept')).toBeInTheDocument();
      });
      
      const acceptButton = screen.getByText('Accept');
      acceptButton.focus();
      
      await act(async () => {
        await user.keyboard(' ');
      });
      
      expect(mockOnAccept).toHaveBeenCalled();
    });
  });

  describe('Utility Functions', () => {
    describe('hasUserConsentedToCookies', () => {
      test('returns true when consent is accepted', () => {
        mockLocalStorage.getItem.mockReturnValue('accepted');
        expect(hasUserConsentedToCookies()).toBe(true);
      });

      test('returns true when no consent exists (default behavior)', () => {
        mockLocalStorage.getItem.mockReturnValue(null);
        expect(hasUserConsentedToCookies()).toBe(true);
      });

      test('returns false when consent is declined', () => {
        mockLocalStorage.getItem.mockReturnValue('declined');
        expect(hasUserConsentedToCookies()).toBe(false);
      });

      test('handles localStorage errors', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        mockLocalStorage.getItem.mockImplementation(() => {
          throw new Error('localStorage error');
        });
        
        expect(hasUserConsentedToCookies()).toBe(true);
        expect(consoleSpy).toHaveBeenCalled();
        
        consoleSpy.mockRestore();
      });
    });

    describe('hasUserDeclinedCookies', () => {
      test('returns true when consent is declined', () => {
        mockLocalStorage.getItem.mockReturnValue('declined');
        expect(hasUserDeclinedCookies()).toBe(true);
      });

      test('returns false when consent is accepted', () => {
        mockLocalStorage.getItem.mockReturnValue('accepted');
        expect(hasUserDeclinedCookies()).toBe(false);
      });

      test('returns false when no consent exists', () => {
        mockLocalStorage.getItem.mockReturnValue(null);
        expect(hasUserDeclinedCookies()).toBe(false);
      });

      test('handles localStorage errors', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        mockLocalStorage.getItem.mockImplementation(() => {
          throw new Error('localStorage error');
        });
        
        expect(hasUserDeclinedCookies()).toBe(false);
        expect(consoleSpy).toHaveBeenCalled();
        
        consoleSpy.mockRestore();
      });
    });

    describe('getCookieConsentStatus', () => {
      test('returns accepted when consent is accepted', () => {
        mockLocalStorage.getItem.mockReturnValue('accepted');
        expect(getCookieConsentStatus()).toBe('accepted');
      });

      test('returns declined when consent is declined', () => {
        mockLocalStorage.getItem.mockReturnValue('declined');
        expect(getCookieConsentStatus()).toBe('declined');
      });

      test('returns null when no consent exists', () => {
        mockLocalStorage.getItem.mockReturnValue(null);
        expect(getCookieConsentStatus()).toBe(null);
      });

      test('handles localStorage errors', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        mockLocalStorage.getItem.mockImplementation(() => {
          throw new Error('localStorage error');
        });
        
        expect(getCookieConsentStatus()).toBe(null);
        expect(consoleSpy).toHaveBeenCalled();
        
        consoleSpy.mockRestore();
      });
    });
  });

  describe('External Link', () => {
    test('privacy policy link has correct href', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      render(<CookieConsent {...defaultProps} />);
      
      await waitFor(() => {
        const privacyLink = screen.getByTitle('Privacy Policy & Terms of Service');
        expect(privacyLink).toHaveAttribute('href', '/privacy-and-terms');
      });
    });

    test('privacy policy link has correct href for Japanese locale', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockLocation.pathname = '/ja';
      
      render(<CookieConsent {...defaultProps} />);
      
      await waitFor(() => {
        const privacyLink = screen.getByTitle('プライバシーポリシー・利用規約');
        expect(privacyLink).toHaveAttribute('href', '/ja/privacy-and-terms');
      });
    });
  });
}); 