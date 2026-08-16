/**
 * Base for failures the application layer defines.
 *
 * Separate from `DomainError` because the two mean different things and are
 * handled at different places. A `DomainError` says a value could never be
 * valid, so no caller can recover from it. An `ApplicationError` says a use
 * case could not complete this time — an adapter was unreachable, a policy
 * refused — and the caller may well have something sensible to do about it.
 *
 * Infrastructure translates its own failures into these before they cross the
 * port. A `fetch` rejection or a `pg` error reaching presentation would mean
 * the layer boundary leaked.
 */
export abstract class ApplicationError extends Error {
  protected constructor(message: string, options?: { readonly cause?: unknown }) {
    super(message, options);
    this.name = new.target.name;
  }
}
