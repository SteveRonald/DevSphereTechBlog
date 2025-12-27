-- Course publish notifications
-- Adds a global enable/disable flag and a per-subscriber opt-in flag.

-- System settings: global toggle
ALTER TABLE IF EXISTS system_settings
ADD COLUMN IF NOT EXISTS course_notifications_enabled BOOLEAN DEFAULT TRUE;

-- Newsletter subscriptions: per-subscriber toggle
ALTER TABLE IF EXISTS newsletter_subscriptions
ADD COLUMN IF NOT EXISTS notify_new_courses BOOLEAN DEFAULT TRUE;

-- System settings: global toggle for course updates
ALTER TABLE IF EXISTS system_settings
ADD COLUMN IF NOT EXISTS course_update_notifications_enabled BOOLEAN DEFAULT FALSE;

-- Newsletter subscriptions: per-subscriber toggle for course updates
ALTER TABLE IF EXISTS newsletter_subscriptions
ADD COLUMN IF NOT EXISTS notify_course_updates BOOLEAN DEFAULT FALSE;
