import { ENTITY_VIOLATIONS, InvalidEntityError } from '../errors/invalid-entity-error.ts';

/**
 * What every entity carries, and the whole of it.
 *
 * **Only the id.** The temptation is to put `createdAt`, `updatedAt`,
 * `isPublished` and `sortOrder` here, since `data-model.md` gives those columns
 * to almost every table — but "almost" is the problem, twice over.
 *
 * The timestamps are on every table and belong to none of these objects: no
 * rule in this layer reads them, they exist so a row can be audited, and a
 * domain that declares them is a domain shaped by its storage. They stay in the
 * row type, where `packages/db` can use them.
 *
 * `isPublished` is not universal: `skills` deliberately has no such column,
 * because a skill is only ever visible through the project or timeline entry
 * that uses it. A base declaring it would make `Skill` implement a field that
 * answers a question nobody asks of it, and "published" would quietly come to
 * mean two things.
 *
 * What is left is identity, which is exactly what separates an entity from a
 * value object: two `SocialLink`s with the same id are the same link even after
 * one is renamed, while two `IconSvg`s are the same only while their markup is.
 */
export interface EntityProperties {
  readonly id: string;
}

/**
 * The base every entity extends.
 *
 * It owns two things and refuses the rest: an id that is present, and equality
 * decided by that id.
 *
 * The constructor is `protected`, so the always-valid rule survives
 * inheritance — a subclass still has to expose a `create` of its own, and
 * `new SomeEntity(...)` stays impossible from outside. This class validates
 * what it declares; everything past the id is the subclass's to check before
 * it calls `super`.
 */
export abstract class Entity<Properties extends EntityProperties> {
  protected constructor(protected readonly properties: Properties) {
    if (typeof properties.id !== 'string' || properties.id.trim().length === 0) {
      throw new InvalidEntityError(
        ENTITY_VIOLATIONS.MISSING_ID,
        'An entity needs an id — it is what makes it the same thing across two reads.',
      );
    }
  }

  get id(): string {
    return this.properties.id;
  }

  /**
   * Identity, not equivalence.
   *
   * Two entities of the same type sharing an id are the same entity, however
   * far their other fields have drifted — that is what an id is for. The
   * constructor check is not ceremony: ids are unique per table, not across
   * them, so without it a `Project` and a `TimelineEntry` seeded from the same
   * natural key could compare equal.
   */
  equals(other: Entity<EntityProperties>): boolean {
    return this.constructor === other.constructor && this.id === other.id;
  }
}
