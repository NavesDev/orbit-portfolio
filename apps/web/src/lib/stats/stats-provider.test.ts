import { GITHUB_LOGIN, GITHUB_TOKEN } from '@portfolio/infra';
import { describe, expect, it } from 'vitest';

import { createDeveloperStatsProvider } from './stats-provider';

const LOGIN = 'NavesDev';

describe('createDeveloperStatsProvider', () => {
  it('builds an adapter from the login alone — the token only raises the rate limit', () => {
    expect(createDeveloperStatsProvider({ [GITHUB_LOGIN]: LOGIN })).not.toBeNull();
  });

  it('builds one with both variables set', () => {
    expect(
      createDeveloperStatsProvider({ [GITHUB_LOGIN]: LOGIN, [GITHUB_TOKEN]: 'a-token' }),
    ).not.toBeNull();
  });

  it('returns null with no login — a token alone says nothing about whom to count', () => {
    expect(createDeveloperStatsProvider({ [GITHUB_TOKEN]: 'a-token' })).toBeNull();
  });

  it('returns null on an empty environment, so a bare clone still builds', () => {
    expect(createDeveloperStatsProvider({})).toBeNull();
  });

  it('treats a blank login as unset rather than as an account named " "', () => {
    expect(createDeveloperStatsProvider({ [GITHUB_LOGIN]: '  ' })).toBeNull();
  });

  it('reads no public variable, so nothing here can reach the browser (NFR-03)', () => {
    expect(GITHUB_TOKEN.startsWith('NEXT_PUBLIC_')).toBe(false);
    expect(GITHUB_LOGIN.startsWith('NEXT_PUBLIC_')).toBe(false);
  });
});
