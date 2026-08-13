import { NextResponse, type NextRequest } from 'next/server';

import {
  ACCEPT_LANGUAGE_HEADER,
  CACHE_CONTROL_HEADER,
  CACHE_CONTROL_NO_STORE,
  LOCALE_REDIRECT_STATUS,
} from './lib/http/headers';
import { LOCALE_COOKIE_NAME, readLocaleCookie } from './lib/locale/locale-cookie';
import { negotiateLocale } from './lib/locale/negotiate-locale';

/**
 * Resolves the visitor's language on `/` and sends them to its prefix.
 *
 * `proxy.ts`, not `middleware.ts`: Next 16.3 renamed the convention, and the
 * new name is the better description — this runs at a network boundary in
 * front of the app, not as an Express-style handler in a chain.
 *
 * Only `/` needs resolving — every other path already carries a locale segment
 * and goes straight to a static page. The matcher below says exactly that, so
 * `/api` and `/_next` never reach this function at all. Phase 6's CORS and
 * rate limiting widen the matcher and live in their own function.
 *
 * The response must not be cached (NFR-12): a stored `/` → `/en-US` would send
 * every later visitor to the first visitor's language.
 */
export function proxy(request: NextRequest): NextResponse {
  const chosen = readLocaleCookie(request.cookies.get(LOCALE_COOKIE_NAME)?.value);
  const locale = chosen ?? negotiateLocale(request.headers.get(ACCEPT_LANGUAGE_HEADER));

  const destination = request.nextUrl.clone();
  destination.pathname = `/${locale}`;

  const response = NextResponse.redirect(destination, LOCALE_REDIRECT_STATUS);
  response.headers.set(CACHE_CONTROL_HEADER, CACHE_CONTROL_NO_STORE);

  return response;
}

export const config = {
  matcher: ['/'],
};
