-- Timeline entry <-> skill. Same rules as project_skill.
-- data-model.md § 6

CREATE TABLE timeline_entry_skill (
  timeline_entry_id uuid NOT NULL,
  skill_id          uuid NOT NULL,
  usage_note        jsonb,

  CONSTRAINT pk_timeline_entry_skill PRIMARY KEY (timeline_entry_id, skill_id),
  CONSTRAINT fk_timeline_entry_skill__entry
    FOREIGN KEY (timeline_entry_id) REFERENCES timeline_entries (id) ON DELETE CASCADE,
  CONSTRAINT fk_timeline_entry_skill__skill
    FOREIGN KEY (skill_id) REFERENCES skills (id) ON DELETE RESTRICT,
  CONSTRAINT ck_timeline_entry_skill__usage_note
    CHECK (usage_note IS NULL OR is_localized(usage_note, 240))
);

CREATE INDEX ix_timeline_entry_skill__skill ON timeline_entry_skill (skill_id);
