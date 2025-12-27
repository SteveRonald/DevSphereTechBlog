CREATE TABLE IF NOT EXISTS lesson_project_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  submission_text TEXT,
  submission_url TEXT,
  status TEXT CHECK (status IN ('pending_review','approved','rejected')) DEFAULT 'pending_review',
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE lesson_project_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their project submissions" ON lesson_project_submissions;
DROP POLICY IF EXISTS "Users can update their project submissions" ON lesson_project_submissions;
DROP POLICY IF EXISTS "Users can read their project submissions" ON lesson_project_submissions;
DROP POLICY IF EXISTS "Admins can read project submissions" ON lesson_project_submissions;
DROP POLICY IF EXISTS "Admins can update project submissions" ON lesson_project_submissions;

CREATE POLICY "Users can insert their project submissions" ON lesson_project_submissions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their project submissions" ON lesson_project_submissions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read their project submissions" ON lesson_project_submissions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read project submissions" ON lesson_project_submissions
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND up.is_admin = TRUE
  ));

CREATE POLICY "Admins can update project submissions" ON lesson_project_submissions
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND up.is_admin = TRUE
  ));

ALTER TABLE lessons DROP CONSTRAINT IF EXISTS lessons_content_type_check;
ALTER TABLE lessons
  ADD CONSTRAINT lessons_content_type_check
  CHECK (content_type IN ('video', 'text', 'code', 'quiz', 'resource', 'project'));
