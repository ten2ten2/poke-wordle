import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { getKnowledgeRedirect } from './config/knowledge';

const routeLocale = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const match = pathname.match(/^\/(?:(en|ja|zh-hans|zh-hant)\/)?knowledge\/([^/]+)\/?$/);
  let alias: string | undefined;
  if (match) {
    try {
      alias = getKnowledgeRedirect(match[1] ?? 'en', decodeURIComponent(match[2]));
    } catch {
      return new NextResponse('Bad Request', { status: 400 });
    }
  }
  if (alias || pathname === '/en' || pathname.startsWith('/en/')) {
    const destination = request.nextUrl.clone();
    destination.pathname = alias ?? (pathname.slice(3) || '/');
    return NextResponse.redirect(destination, 308);
  }
  const response = routeLocale(request);
  // next-intl decodes paths when creating routing URLs. A literal percent
  // must not reach Next.js as an invalid escape and produce a server error.
  const destination =
    response.headers.get('x-middleware-rewrite') ??
    response.headers.get('location');
  if (destination) {
    try {
      decodeURI(new URL(destination, request.url).pathname);
    } catch {
      return new NextResponse('Bad Request', { status: 400 });
    }
  }
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
    '/knowledge/:path*',
    '/:locale(en|ja|zh-hans|zh-hant)/knowledge/:path*',
  ],
};
