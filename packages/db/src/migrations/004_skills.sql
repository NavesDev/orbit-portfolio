-- Technology taxonomy. A skill is one row in any language, which is what keeps
-- the skill graph and its usage lookups language-agnostic.
-- No is_published: a skill is only visible through a project or timeline entry
-- that references it.
-- data-model.md § 2

CREATE TABLE skills (
  id         uuid           NOT NULL DEFAULT gen_random_uuid(),
  name       varchar(60)    NOT NULL,
  category   skill_category NOT NULL,
  sort_order integer        NOT NULL DEFAULT 0,
  created_at timestamptz    NOT NULL DEFAULT now(),
  updated_at timestamptz    NOT NULL DEFAULT now(),

  CONSTRAINT pk_skills PRIMARY KEY (id)
);

CREATE UNIQUE INDEX ux_skills__name ON skills (name);

CREATE INDEX ix_skills__category ON skills (category);
