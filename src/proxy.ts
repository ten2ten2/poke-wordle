import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const routeLocale = createMiddleware(routing);

export default function proxy(request: NextRequest) {
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
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
