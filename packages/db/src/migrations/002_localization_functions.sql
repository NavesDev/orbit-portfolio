-- Localized value validation. Second line of defence behind the domain's
-- LocalizedText value object (NFR-08) — it guards anything written outside the
-- application: seeds, migrations, manual fixes.
--
-- Both functions come before any table that references them in a CHECK.
-- data-model.md § Localization / Validation

-- Enforces, at once:
--   1. the value is an object, not a string, number or array;
--   2. the default locale is present — no row is unreadable in pt-BR;
--   3. every key is a known locale — 'en-US' is rejected, not silently ignored;
--   4. every value is a string within the column's length budget.
CREATE FUNCTION is_localized(value jsonb, max_length int)
RETURNS boolean
LANGUAGE sql IMMUTABLE STRICT
AS $$
  SELECT jsonb_typeof(value) = 'object'
     AND value ? 'pt-BR'
     AND NOT EXISTS (
       SELECT 1
         FROM jsonb_each(value) AS entry(locale, text)
        WHERE entry.locale NOT IN ('pt-BR', 'en')
           OR jsonb_typeof(entry.text) <> 'string'
           OR length(entry.text #>> '{}') > max_length
     )
$$;

-- Same rules, over an array of strings per locale, plus a cap on item count.
-- Serves projects.tags.
CREATE FUNCTION is_localized_array(value jsonb, max_length int, max_items int)
RETURNS boolean
LANGUAGE sql IMMUTABLE STRICT
AS $$
  SELECT jsonb_typeof(value) = 'object'
     AND value ? 'pt-BR'
     AND NOT EXISTS (
       SELECT 1
         FROM jsonb_each(value) AS entry(locale, items)
        WHERE entry.locale NOT IN ('pt-BR', 'en')
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
