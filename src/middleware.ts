import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'ja', 'fr', 'de', 'it', 'es', 'ko', 'zh-hans', 'zh-hant'],

  // Used when no locale matches
  defaultLocale: 'en',

  // Only add locale prefix for non-default locales
  localePrefix: 'as-needed'
});

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for root path to prevent any redirects
  if (pathname === '/') {
    return NextResponse.next();
  }

  // Redirect /en paths to root path (since English uses no prefix)
  if (pathname.startsWith('/en')) {
    const newPath = pathname.replace('/en', '') || '/';
    return NextResponse.redirect(new URL(newPath, request.url));
  }

  // Handle other internationalization
  return intlMiddleware(request);
}

export const config = {
  // Match all paths including /en for redirection
  matcher: ['/', '/(en|de|es|fr|it|ja|ko|zh-hans|zh-hant)/:path*']
}; 