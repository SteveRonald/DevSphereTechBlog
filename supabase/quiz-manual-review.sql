-- Quiz manual review (free-text answers)
-- Stores student quiz submissions and allows admin review.

CREATE TABLE IF NOT EXISTS lesson_quiz_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  answers JSONB NOT NULL, -- [{question_index, question_type, selected_option, answer_text}]
  score INTEGER, -- for MCQ auto-graded
  total INTEGER,
  status TEXT CHECK (status IN ('pending_review','graded')) DEFAULT 'pending_review',
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  is_passed BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE lesson_quiz_submissions ENABLE ROW LEVEL SECURITY;

-- Users can insert and read their own submissions
DROP POLICY IF EXISTS "Users can insert their quiz submissions" ON lesson_quiz_submissions;
DROP POLICY IF EXISTS "Users can read their quiz submissions" ON lesson_quiz_submissions;

CREATE POLICY "Users can insert their quiz submissions" ON lesson_quiz_submissions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their quiz submissions" ON lesson_quiz_submissions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read/update all
DROP POLICY IF EXISTS "Admins can read quiz submissions" ON lesson_quiz_submissions;
DROP POLICY IF EXISTS "Admins can update quiz submissions" ON lesson_quiz_submissions;

CREATE POLICY "Admins can read quiz submissions" ON lesson_quiz_submissions
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid() AND up.is_admin = TRUE
  ));

CREATE POLICY "Admins can update quiz submissions" ON lesson_quiz_submissions
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid() AND up.is_admin = TRUE
  ));
