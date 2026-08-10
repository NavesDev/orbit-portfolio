import { createHash } from 'node:crypto';

/**
 * A UUIDv5 namespace for this repository's seed, generated once and pinned
 * here. Every seeded id derives from it, so ids are the same on every machine
 * and on every run — which is what lets join rows be written from natural keys
 * and lets a second seed run converge instead of duplicating.
 */
const SEED_NAMESPACE = 'b6f2b8d6-1f4c-5c5a-9b1e-2f6a7c0d4e31';

/** RFC 4122 §4.3 — SHA-1 over the namespace bytes and the name, version 5. */
export function uuidV5(namespace: string, name: string): string {
  const namespaceBytes = Buffer.from(namespace.replaceAll('-', ''), 'hex');
  const hash = createHash('sha1').update(namespaceBytes).update(name, 'utf8').digest();

  hash[6] = (hash[6]! & 0x0f) | 0x50; // version 5
  hash[8] = (hash[8]! & 0x3f) | 0x80; // RFC 4122 variant

  const hex = hash.subarray(0, 16).toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

/** The id of a seeded row, from its kind and its natural key. */
export function seedId(kind: string, key: string): string {
  return uuidV5(SEED_NAMESPACE, `${kind}:${key}`);
}
