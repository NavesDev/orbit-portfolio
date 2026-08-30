-- The per-project decorative visual (U-5, sprint-01.md).
--
-- `text`, not `varchar(n)`: the length ceiling for this column is `IconSvg`'s
-- own MAX_LENGTH (4096), enforced in the domain exactly like `icon_svg`'s is
-- on social_links — a CHECK here would just restate that number a second time
-- with no independent value, since sanitization (the actual risk) is not
-- something SQL can express. No CHECK is added for the same reason
-- `icon_svg` has none beyond its own column type.
-- data-model.md § 3

ALTER TABLE projects ADD COLUMN visual_svg text;
