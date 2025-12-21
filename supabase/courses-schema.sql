-- Courses Management Schema
-- This schema is separate from blog posts (which use Sanity CMS)

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  short_description VARCHAR(500),
  thumbnail_url TEXT,
  instructor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  estimated_duration INTEGER, -- in minutes
  category VARCHAR(100),
  is_published BOOLEAN DEFAULT FALSE,
  enrollment_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 5.00
  total_ratings INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Nairobi')::timestamptz,
  updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Nairobi')::timestamptz
);

-- Lessons (steps) within a course
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  step_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content_type VARCHAR(50) CHECK (content_type IN ('video', 'text', 'code', 'quiz', 'resource')) DEFAULT 'text',
  content JSONB, -- Flexible content storage (video_url, text_content, code_examples, quiz_data, etc.)
  video_url TEXT,
  duration INTEGER, -- in minutes
  is_preview BOOLEAN DEFAULT FALSE, -- Can be viewed without enrollment
  created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Nairobi')::timestamptz,
  updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Nairobi')::timestamptz,
  UNIQUE(course_id, step_number)
);

-- User course enrollments
CREATE TABLE IF NOT EXISTS user_course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Nairobi')::timestamptz,
  last_accessed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, course_id)
);

-- User lesson completion tracking
CREATE TABLE IF NOT EXISTS user_lesson_completion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Nairobi')::timestamptz,
  time_spent INTEGER DEFAULT 0, -- in seconds
  UNIQUE(user_id, lesson_id)
);

-- Course progress summary (computed view or updated via triggers)
-- This will be calculated, but we can add a materialized view for performance

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_difficulty ON courses(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_step ON lessons(course_id, step_number);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON user_course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON user_course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_completion_user ON user_lesson_completion(user_id);
CREATE INDEX IF NOT EXISTS idx_completion_course ON user_lesson_completion(course_id);
CREATE INDEX IF NOT EXISTS idx_completion_lesson ON user_lesson_completion(lesson_id);

-- Function to update course enrollment count
CREATE OR REPLACE FUNCTION update_course_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE courses 
    SET enrollment_count = enrollment_count + 1 
    WHERE id = NEW.course_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE courses 
    SET enrollment_count = GREATEST(enrollment_count - 1, 0) 
    WHERE id = OLD.course_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update enrollment count
DROP TRIGGER IF EXISTS trigger_update_enrollment_count ON user_course_enrollments;
CREATE TRIGGER trigger_update_enrollment_count
  AFTER INSERT OR DELETE ON user_course_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_course_enrollment_count();

-- Function to update course completion status
CREATE OR REPLACE FUNCTION update_course_completion()
RETURNS TRIGGER AS $$
DECLARE
  total_lessons INTEGER;
  completed_lessons INTEGER;
BEGIN
  -- Get total lessons for the course
  SELECT COUNT(*) INTO total_lessons
  FROM lessons
  WHERE course_id = NEW.course_id;
  
  -- Get completed lessons for this user and course
  SELECT COUNT(*) INTO completed_lessons
  FROM user_lesson_completion
  WHERE user_id = NEW.user_id AND course_id = NEW.course_id;
  
  -- Update enrollment completion status
  IF completed_lessons >= total_lessons AND total_lessons > 0 THEN
    UPDATE user_course_enrollments
    SET is_completed = TRUE, completed_at = NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Nairobi'
    WHERE user_id = NEW.user_id AND course_id = NEW.course_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update course completion
DROP TRIGGER IF EXISTS trigger_update_course_completion ON user_lesson_completion;
CREATE TRIGGER trigger_update_course_completion
  AFTER INSERT ON user_lesson_completion
  FOR EACH ROW EXECUTE FUNCTION update_course_completion();

-- RLS Policies
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lesson_completion ENABLE ROW LEVEL SECURITY;

-- Courses: Anyone can view published courses
CREATE POLICY "Anyone can view published courses" ON courses
  FOR SELECT USING (is_published = TRUE);

-- Courses: Admins can do everything
CREATE POLICY "Admins can manage courses" ON courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = TRUE
    )
  );

-- Lessons: Anyone can view lessons of published courses
CREATE POLICY "Anyone can view lessons of published courses" ON lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = lessons.course_id
      AND courses.is_published = TRUE
    )
  );

-- Lessons: Admins can manage lessons
CREATE POLICY "Admins can manage lessons" ON lessons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = TRUE
    )
  );

-- Enrollments: Users can view their own enrollments
CREATE POLICY "Users can view their own enrollments" ON user_course_enrollments
  FOR SELECT USING (auth.uid() = user_id);

-- Enrollments: Users can enroll in courses
CREATE POLICY "Users can enroll in courses" ON user_course_enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enrollments: Admins can view all enrollments
CREATE POLICY "Admins can view all enrollments" ON user_course_enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = TRUE
    )
  );

-- Lesson completion: Users can view their own completions
CREATE POLICY "Users can view their own completions" ON user_lesson_completion
  FOR SELECT USING (auth.uid() = user_id);

-- Lesson completion: Users can mark lessons as complete
CREATE POLICY "Users can complete lessons" ON user_lesson_completion
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Lesson completion: Admins can view all completions
CREATE POLICY "Admins can view all completions" ON user_lesson_completion
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = TRUE
    )
  );

