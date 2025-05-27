import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { isAllowedBot } from '@/utils/seo-robots';

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
  const userAgent = request.headers.get('user-agent') || '';

  // Skip middleware for root path to prevent any redirects
  if (pathname === '/') {
    const response = NextResponse.next();
    
    // Add SEO-friendly headers for root page
    response.headers.set('X-Robots-Tag', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return response;
  }

  // Redirect /en paths to root path (since English uses no prefix)
  if (pathname.startsWith('/en')) {
    const newPath = pathname.replace('/en', '') || '/';
    return NextResponse.redirect(new URL(newPath, request.url));
  }

  // Handle robots.txt requests
  if (pathname === '/robots.txt') {
    return NextResponse.next();
  }

  // Block AI training bots from accessing API routes
  if (!isAllowedBot(userAgent) && pathname.startsWith('/api/')) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Handle other internationalization and add SEO headers
  const response = intlMiddleware(request);
  
  if (response) {
    // Add SEO-friendly headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Add cache headers for static assets
    if (pathname.startsWith('/_next/static/') || pathname.startsWith('/images/')) {
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
    
    // Add specific headers for game pages
    if (pathname.match(/^\/[a-z]{2}(-[a-z]{4})?$/)) {
      response.headers.set('X-Robots-Tag', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    }
    
    // Add specific headers for privacy pages
    if (pathname.includes('/privacy-and-terms')) {
      response.headers.set('X-Robots-Tag', 'index, follow, max-snippet:200, max-image-preview:standard');
    } else {
      // Default SEO headers for other pages
      response.headers.set('X-Robots-Tag', 'index, follow');
    }
    
    return response;
  }

  return NextResponse.next();
}

export const config = {
  // Match all paths including /en for redirection
  matcher: ['/', '/(en|de|es|fr|it|ja|ko|zh-hans|zh-hant)/:path*']
}; 