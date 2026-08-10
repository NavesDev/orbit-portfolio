-- Enums. A new value is a migration, never free text.
-- data-model.md § Enums

CREATE TYPE skill_category AS ENUM ('frontend', 'backend', 'tooling', 'data');

CREATE TYPE timeline_kind AS ENUM ('professional', 'academic', 'certification');
