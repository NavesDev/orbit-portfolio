import { describe, expect, it } from 'vitest';
import { seedId, uuidV5 } from '../../../src/seed/ids.ts';

describe('uuidV5', () => {
  it('matches the canonical RFC 4122 vector', () => {
    // Namespace DNS + "www.example.org" is the published v5 test vector; if the
    // bit twiddling here is wrong, this is what catches it.
    expect(uuidV5('6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'www.example.org')).toBe(
      '74738ff5-5367-5958-9aee-98fffdcd1876',
    );
  });
});

describe('seedId', () => {
  it('returns a syntactically valid v5 uuid', () => {
    expect(seedId('project', 'orbit-portfolio')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('is stable across calls', () => {
    expect(seedId('project', 'navi')).toBe(seedId('project', 'navi'));
  });

  it('separates the kinds', () => {
    expect(seedId('project', 'navi')).not.toBe(seedId('skill', 'navi'));
  });
});
