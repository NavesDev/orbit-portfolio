// @vitest-environment node
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { proxy } from './proxy';

const HOME_URL = 'http://localhost:3000/';

function requestTo(headers: Record<string, string>, cookie?: string): NextRequest {
  const request = new NextRequest(HOME_URL, { headers });

  if (cookie !== undefined) {
    request.cookies.set('locale', cookie);
  }

  return request;
}

function redirectPathOf(response: Response): string {
  const location = response.headers.get('location');

  expect(location).not.toBeNull();

  return new URL(location as string).pathname;
}

describe('proxy on /', () => {
  it('sends an English browser to /en-US (FR-30)', () => {
    const response = proxy(requestTo({ 'accept-language': 'en-GB,en;q=0.9' }));

    expect(redirectPathOf(response)).toBe('/en-US');
  });

  it('sends a Portuguese browser to /pt-BR (FR-30)', () => {
    const response = proxy(requestTo({ 'accept-language': 'pt-BR,pt;q=0.9' }));

    expect(redirectPathOf(response)).toBe('/pt-BR');
  });

  it('sends an unsupported language to /en-US (FR-31)', () => {
    const response = proxy(requestTo({ 'accept-language': 'fr' }));

    expect(redirectPathOf(response)).toBe('/en-US');
  });

  it('sends a request with no Accept-Language to /en-US (FR-31)', () => {
    const response = proxy(requestTo({}));

    expect(redirectPathOf(response)).toBe('/en-US');
  });

  it('lets the cookie outrank the browser (FR-33)', () => {
    const response = proxy(
      requestTo({ 'accept-language': 'en-GB,en;q=0.9' }, 'pt-BR'),
    );

    expect(redirectPathOf(response)).toBe('/pt-BR');
  });

  it('ignores a cookie holding an unsupported locale', () => {
    const response = proxy(
      requestTo({ 'accept-language': 'pt-BR,pt;q=0.9' }, 'xx'),
    );

    expect(redirectPathOf(response)).toBe('/pt-BR');
  });

  it('redirects temporarily, never permanently', () => {
    expect(proxy(requestTo({})).status).toBe(307);
  });

  it('is never cached across visitors (NFR-12)', () => {
    const response = proxy(requestTo({ 'accept-language': 'en-GB,en;q=0.9' }));

    expect(response.headers.get('cache-control')).toBe('no-store');
  });
});
