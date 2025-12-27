CREATE TABLE IF NOT EXISTS system_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  site_name TEXT DEFAULT 'CodeCraft Academy',
  support_email TEXT,
  maintenance_mode BOOLEAN DEFAULT FALSE,
  allow_new_signups BOOLEAN DEFAULT TRUE,
  newsletter_enabled BOOLEAN DEFAULT TRUE,
  featured_course_category TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT system_settings_singleton CHECK (id = 1)
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read system settings" ON system_settings;
DROP POLICY IF EXISTS "Admins can update system settings" ON system_settings;

CREATE POLICY "Admins can read system settings" ON system_settings
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid() AND up.is_admin = TRUE
  ));

CREATE POLICY "Admins can update system settings" ON system_settings
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid() AND up.is_admin = TRUE
  ));

INSERT INTO system_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;
