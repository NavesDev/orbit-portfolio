-- Professional experience, academic background and certifications in one table,
-- discriminated by kind. ended_on IS NULL means open — ongoing, current, or
-- never expires. No separate is_current flag.
-- data-model.md § 4

CREATE TABLE timeline_entries (
  id             uuid          NOT NULL DEFAULT gen_random_uuid(),
  kind           timeline_kind NOT NULL,
  title          jsonb         NOT NULL,
  organization   varchar(160)  NOT NULL,
  description    jsonb,
  credential_url varchar(2048),
  started_on     date          NOT NULL,
  ended_on       date,
  is_featured    boolean       NOT NULL DEFAULT false,
  is_published   boolean       NOT NULL DEFAULT false,
  sort_order     integer       NOT NULL DEFAULT 0,
  created_at     timestamptz   NOT NULL DEFAULT now(),
  updated_at     timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT pk_timeline_entries PRIMARY KEY (id),
  CONSTRAINT ck_timeline_entries__date_order
    CHECK (ended_on IS NULL OR ended_on >= started_on),
  CONSTRAINT ck_timeline_entries__title
    CHECK (is_localized(title, 160)),
  CONSTRAINT ck_timeline_entries__description
    CHECK (description IS NULL OR is_localized(description, 8000))
);

CREATE INDEX ix_timeline_entries__published_started
    ON timeline_entries (is_published, started_on DESC);

CREATE INDEX ix_timeline_entries__kind ON timeline_entries (kind);
