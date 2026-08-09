/**
 * Placeholder for `/`, so the App Router has one route to build.
 *
 * This is not the home page. `/` is meant to redirect to the visitor's locale,
 * and that redirect has to happen per request — a prerendered one would send
 * every later visitor to the first visitor's language. So it belongs in
 * `middleware.ts`, which already owns locale negotiation, and this file is
 * deleted once that lands.
 */
export default function Page() {
  return null;
}
