import { describe, expect, it } from 'vitest';

import {
  LOCALE_COOKIE_MAX_AGE_SECONDS,
  LOCALE_COOKIE_NAME,
  readLocaleCookie,
  serializeLocaleCookie,
} from './locale-cookie';

const SECONDS_IN_A_YEAR = 31_536_000;

describe('readLocaleCookie', () => {
  it('returns the locale when the cookie holds a supported one', () => {
    expect(readLocaleCookie('pt-BR')).toBe('pt-BR');
  });

  it('returns null when the cookie is absent', () => {
    expect(readLocaleCookie(undefined)).toBeNull();
  });

  it('returns null for a value that is not a supported locale', () => {
    expect(readLocaleCookie('xx')).toBeNull();
    expect(readLocaleCookie('en')).toBeNull();
  });
});

describe('serializeLocaleCookie', () => {
  it('outlasts the tab, so the choice survives closing it (FR-33)', () => {
    expect(LOCALE_COOKIE_MAX_AGE_SECONDS).toBe(SECONDS_IN_A_YEAR);
    expect(serializeLocaleCookie('pt-BR')).toContain(`Max-Age=${SECONDS_IN_A_YEAR}`);
  });

  it('writes the chosen locale under the documented name', () => {
    expect(serializeLocaleCookie('pt-BR')).toContain(`${LOCALE_COOKIE_NAME}=pt-BR`);
  });

  it('is site-wide and Lax, so it is sent on the navigation to /', () => {
    const cookie = serializeLocaleCookie('en-US');

    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('SameSite=Lax');
  });

  it('is not Secure in development, where there is no HTTPS', () => {
    expect(serializeLocaleCookie('en-US')).not.toContain('Secure');
  });
});
