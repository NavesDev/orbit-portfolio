-- Footer contacts, including e-mail. Nothing here is translated.
-- data-model.md § 1

CREATE TABLE social_links (
  id           uuid         NOT NULL DEFAULT gen_random_uuid(),
  platform     varchar(40)  NOT NULL,
  url          varchar(2048) NOT NULL,
  icon_svg     text         NOT NULL,
  is_published boolean      NOT NULL DEFAULT true,
  sort_order   integer      NOT NULL DEFAULT 0,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now(),

  CONSTRAINT pk_social_links PRIMARY KEY (id)
);

CREATE INDEX ix_social_links__published_sort
    ON social_links (is_published, sort_order);
