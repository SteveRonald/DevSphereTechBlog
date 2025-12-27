-- Lesson drafts
-- Adds per-lesson publish state.

ALTER TABLE IF EXISTS lessons
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;
