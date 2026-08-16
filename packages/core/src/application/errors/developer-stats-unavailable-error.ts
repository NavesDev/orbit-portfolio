import { ApplicationError } from './application-error.ts';

/**
 * The declared failure of `DeveloperStatsProvider`.
 *
 * Every adapter behind that port throws this and nothing else: the caller
 * decides what an unavailable provider means for the page, and it can only do
 * that if it does not have to know whether the provider speaks HTTP, which
 * status code came back, or what an `AbortError` is.
 *
 * `cause` carries the original failure for logs, so translating it here loses
 * nothing a diagnosis would need.
 */
export class DeveloperStatsUnavailableError extends ApplicationError {
  constructor(message: string, options?: { readonly cause?: unknown }) {
    super(message, options);
  }
}
