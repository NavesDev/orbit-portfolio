-- Portfolio work. slug stays single and untranslated: one project, one
-- canonical URL across locales.
-- data-model.md § 3

CREATE TABLE projects (
  id               uuid          NOT NULL DEFAULT gen_random_uuid(),
  slug             varchar(120)  NOT NULL,
  title            jsonb         NOT NULL,
  category         jsonb,
  description      jsonb,
  tags             jsonb,
  repo_url         varchar(2048),
  live_url         varchar(2048),
  progress_percent smallint,
  started_on       date,
  ended_on         date,
  is_featured      boolean       NOT NULL DEFAULT false,
  is_published     boolean       NOT NULL DEFAULT false,
  sort_order       integer       NOT NULL DEFAULT 0,
  created_at       timestamptz   NOT NULL DEFAULT now(),
  updated_at       timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT pk_projects PRIMARY KEY (id),
  CONSTRAINT ck_projects__progress_range
    CHECK (progress_percent BETWEEN 0 AND 100),
  CONSTRAINT ck_projects__date_order
    CHECK (ended_on IS NULL OR ended_on >= started_on),
  CONSTRAINT ck_projects__title
    CHECK (is_localized(title, 160)),
  CONSTRAINT ck_projects__category
    CHECK (category IS NULL OR is_localized(category, 40)),
  CONSTRAINT ck_projects__description
    CHECK (description IS NULL OR is_localized(description, 8000)),
  CONSTRAINT ck_projects__tags
    CHECK (tags IS NULL OR is_localized_array(tags, 60, 8))
);

CREATE UNIQUE INDEX ux_projects__slug ON projects (slug);

CREATE INDEX ix_projects__published_featured_sort
    ON projects (is_published, is_featured, sort_order);
