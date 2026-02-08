-- Initialize system settings if they don't exist
INSERT INTO system_settings (id, site_name, maintenance_mode, allow_new_signups, newsletter_enabled)
VALUES (1, 'CodeCraft Academy', false, true, true)
ON CONFLICT (id) DO NOTHING;
