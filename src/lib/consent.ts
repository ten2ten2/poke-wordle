import { useSyncExternalStore } from 'react';

export type CookieConsentStatus = 'accepted' | 'declined' | null;
const key = 'cookie-consent';
const changeEvent = 'poke-wordle-consent';

export function getCookieConsentStatus(): CookieConsentStatus {
  if (typeof window === 'undefined') return null;
  try {
    const value = localStorage.getItem(key);
    return value === 'accepted' || value === 'declined' ? value : null;
  } catch {
    return null;
  }
}

export function setCookieConsentStatus(
  value: Exclude<CookieConsentStatus, null>,
) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn('Error saving cookie consent:', error);
  }
  window.dispatchEvent(new Event(changeEvent));
}

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(changeEvent, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(changeEvent, onChange);
  };
}

export function useCookieConsent() {
  return useSyncExternalStore(subscribe, getCookieConsentStatus, () => null);
}
