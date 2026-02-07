-- Blog, Career, and Review notifications
-- Adds notification toggles for blogs, careers, and reviews

-- Newsletter subscriptions: per-subscriber toggles
ALTER TABLE IF EXISTS newsletter_subscriptions
ADD COLUMN IF NOT EXISTS notify_new_blogs BOOLEAN DEFAULT TRUE;

ALTER TABLE IF EXISTS newsletter_subscriptions
ADD COLUMN IF NOT EXISTS notify_new_careers BOOLEAN DEFAULT TRUE;

ALTER TABLE IF EXISTS newsletter_subscriptions
ADD COLUMN IF NOT EXISTS notify_new_reviews BOOLEAN DEFAULT TRUE;

-- System settings: global toggles
ALTER TABLE IF EXISTS system_settings
ADD COLUMN IF NOT EXISTS blog_notifications_enabled BOOLEAN DEFAULT TRUE;

ALTER TABLE IF EXISTS system_settings
ADD COLUMN IF NOT EXISTS career_notifications_enabled BOOLEAN DEFAULT TRUE;

ALTER TABLE IF EXISTS system_settings
ADD COLUMN IF NOT EXISTS review_notifications_enabled BOOLEAN DEFAULT TRUE;

-- Add is_active column if it doesn't exist
ALTER TABLE IF EXISTS newsletter_subscriptions
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
