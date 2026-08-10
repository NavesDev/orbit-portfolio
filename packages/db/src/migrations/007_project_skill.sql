-- Project <-> skill, with the usage note that makes the skills section work.
-- Cascade from the project, restrict from the skill: deleting a project drops
-- its associations, deleting a still-referenced skill is refused.
-- data-model.md § 5

CREATE TABLE project_skill (
  project_id uuid NOT NULL,
  skill_id   uuid NOT NULL,
  usage_note jsonb,

  CONSTRAINT pk_project_skill PRIMARY KEY (project_id, skill_id),
  CONSTRAINT fk_project_skill__project
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
  CONSTRAINT fk_project_skill__skill
    FOREIGN KEY (skill_id) REFERENCES skills (id) ON DELETE RESTRICT,
  CONSTRAINT ck_project_skill__usage_note
    CHECK (usage_note IS NULL OR is_localized(usage_note, 240))
);

-- Reverse lookup: the skill modal asks "where was this used?".
CREATE INDEX ix_project_skill__skill ON project_skill (skill_id);
