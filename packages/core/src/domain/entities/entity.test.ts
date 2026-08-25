import { describe, expect, it } from 'vitest';

import { ENTITY_VIOLATIONS, InvalidEntityError } from '../errors/invalid-entity-error.ts';
import { Entity, type EntityProperties } from './entity.ts';

interface ThingProperties extends EntityProperties {
  readonly label: string;
}

/** Two entities that differ only in type, to pin down what `equals` compares. */
class Thing extends Entity<ThingProperties> {
  constructor(properties: ThingProperties) {
    super(properties);
  }

  get label(): string {
    return this.properties.label;
  }
}

class OtherThing extends Entity<ThingProperties> {
  constructor(properties: ThingProperties) {
    super(properties);
  }
}

const ID = '5f1f1f1f-1f1f-4f1f-8f1f-1f1f1f1f1f1f';

describe('Entity', () => {
  it('exposes the id it was built with', () => {
    expect(new Thing({ id: ID, label: 'one' }).id).toBe(ID);
  });

  it('lets a subclass read the rest of its own properties', () => {
    expect(new Thing({ id: ID, label: 'one' }).label).toBe('one');
  });

  it('rejects a missing id', () => {
    try {
      new Thing({ id: '   ', label: 'one' });
      throw new Error('Expected the entity to be rejected, and it was not.');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidEntityError);
      expect((error as InvalidEntityError).violation).toBe(ENTITY_VIOLATIONS.MISSING_ID);
    }
  });

  /* Identity, not equivalence: the same link renamed is still the same link. */
  it('treats two entities with the same id as the same entity', () => {
    const left = new Thing({ id: ID, label: 'one' });
    const right = new Thing({ id: ID, label: 'renamed' });

    expect(left.equals(right)).toBe(true);
  });

  it('treats two entities with different ids as different', () => {
    const left = new Thing({ id: ID, label: 'one' });
    const right = new Thing({ id: '00000000-0000-4000-8000-000000000001', label: 'one' });

    expect(left.equals(right)).toBe(false);
  });

  /* Ids are unique per table, not across them. */
  it('never equates two entities of different types sharing an id', () => {
    const thing = new Thing({ id: ID, label: 'one' });
    const other = new OtherThing({ id: ID, label: 'one' });

    expect(thing.equals(other)).toBe(false);
  });
});
