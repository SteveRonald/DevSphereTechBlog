-- Enrollment count trigger to keep courses.enrollment_count accurate
-- This automatically updates the count when enrollments are added or removed

-- Function to update enrollment count
CREATE OR REPLACE FUNCTION update_course_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE courses
    SET enrollment_count = enrollment_count + 1
    WHERE id = NEW.course_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE courses
    SET enrollment_count = GREATEST(0, enrollment_count - 1)
    WHERE id = OLD.course_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS enrollment_count_trigger ON user_course_enrollments;

-- Create trigger on user_course_enrollments
CREATE TRIGGER enrollment_count_trigger
AFTER INSERT OR DELETE ON user_course_enrollments
FOR EACH ROW
EXECUTE FUNCTION update_course_enrollment_count();

-- Backfill existing enrollment counts (run once)
UPDATE courses
SET enrollment_count = (
  SELECT COUNT(*)
  FROM user_course_enrollments
  WHERE user_course_enrollments.course_id = courses.id
);
