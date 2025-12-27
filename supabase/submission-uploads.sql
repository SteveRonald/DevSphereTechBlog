-- Adds attachment_urls for quiz and project submissions

ALTER TABLE lesson_quiz_submissions
  ADD COLUMN IF NOT EXISTS attachment_urls JSONB;

ALTER TABLE lesson_project_submissions
  ADD COLUMN IF NOT EXISTS attachment_urls JSONB;
