-- Moves the locale set from ('pt-BR', 'en') to ('en-US', 'pt-BR') and the
-- required key from pt-BR to en-US.
--
-- Why the required key changed: the fallback can only be the language content
-- is guaranteed to exist in. `en-US` is now the locale every localized field
-- must carry, and `pt-BR` is optional — a field with no Portuguese renders its
-- English text (FR-34) rather than blank space.
--
-- 002 is not edited: migrations are forward-only, and it has already run.
-- CREATE OR REPLACE keeps the function identity, so every CHECK constraint that
-- references it picks up the new body without being dropped and recreated.
--
-- Rows written before this migration carry `en` rather than `en-US` and do not
-- satisfy the new rule. A CHECK is not re-validated on replace, so they survive
-- in place until something updates them — `pnpm db:seed` rewrites every row and
-- is the intended way to bring an existing database forward.
-- data-model.md § Localization / Validation

CREATE OR REPLACE FUNCTION is_localized(value jsonb, max_length int)
RETURNS boolean
LANGUAGE sql IMMUTABLE STRICT
AS $$
  SELECT jsonb_typeof(value) = 'object'
     AND value ? 'en-US'
     AND NOT EXISTS (
       SELECT 1
         FROM jsonb_each(value) AS entry(locale, text)
        WHERE entry.locale NOT IN ('en-US', 'pt-BR')
           OR jsonb_typeof(entry.text) <> 'string'
           OR length(entry.text #>> '{}') > max_length
     )
$$;

CREATE OR REPLACE FUNCTION is_localized_array(value jsonb, max_length int, max_items int)
RETURNS boolean
LANGUAGE sql IMMUTABLE STRICT
AS $$
  SELECT jsonb_typeof(value) = 'object'
     AND value ? 'en-US'
     AND NOT EXISTS (
       SELECT 1
         FROM jsonb_each(value) AS entry(locale, items)
        WHERE entry.locale NOT IN ('en-US', 'pt-BR')
           OR jsonb_typeof(entry.items) <> 'array'
           OR jsonb_array_length(entry.items) > max_items
           OR EXISTS (
                SELECT 1
                  FROM jsonb_array_elements(entry.items) AS item
                 WHERE jsonb_typeof(item) <> 'string'
                    OR length(item #>> '{}') > max_length
              )
     )
$$;
