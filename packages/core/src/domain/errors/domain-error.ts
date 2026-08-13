/**
 * Base for every invariant this layer enforces.
 *
 * Domain failures are thrown at construction, never returned: an invalid value
 * object must not exist to be passed around, so no code downstream has to ask
 * whether what it holds is valid.
 */
export abstract class DomainError extends Error {
  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
