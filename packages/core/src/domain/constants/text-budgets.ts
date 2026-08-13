/**
 * Length budgets for localized columns, from `data-model.md § Length budgets`.
 *
 * They live here because `LocalizedText.create` takes a budget: a call site
 * passing a bare `160` is the magic number this file removes.
 * `migrations/002_localization_functions.sql` enforces the same numbers as the
 * second line of defence (NFR-08) — one table, two expressions of it.
 */
export const TITLE_MAX_LENGTH = 160;
export const CATEGORY_MAX_LENGTH = 40;
export const TAG_MAX_LENGTH = 60;
export const TAGS_MAX_ITEMS = 8;
export const USAGE_NOTE_MAX_LENGTH = 240;
export const DESCRIPTION_MAX_LENGTH = 8000;
