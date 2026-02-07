-- Clean up unused career listing columns
-- Note: Only run this after confirming you don't need these columns

-- The 'description' field is used as excerpt (plain text summary)
-- The 'responsibilities' field is used as the main content
-- The 'requirements' field is now unused (was merged into responsibilities/content)
-- The 'benefits' field is now unused (removed from UI)

-- Option 1: Drop unused columns (DESTRUCTIVE - data will be lost)
-- Uncomment these lines if you're sure you want to remove the data:

-- ALTER TABLE career_listings DROP COLUMN IF EXISTS requirements;
-- ALTER TABLE career_listings DROP COLUMN IF EXISTS benefits;

-- Option 2: Keep columns but mark as deprecated (SAFE)
-- Add comments to document the column usage:

COMMENT ON COLUMN career_listings.description IS 'Excerpt/summary - plain text shown in listings';
COMMENT ON COLUMN career_listings.responsibilities IS 'Main content - markdown formatted, shown as "Content" on detail page';
COMMENT ON COLUMN career_listings.requirements IS 'DEPRECATED - merged into responsibilities/content field';
COMMENT ON COLUMN career_listings.benefits IS 'DEPRECATED - removed from UI, can be included in content if needed';

-- If you want to migrate existing requirements/benefits into responsibilities:
-- UPDATE career_listings
-- SET responsibilities = CONCAT(
--   responsibilities,
--   E'\n\n## Requirements\n',
--   COALESCE(requirements, ''),
--   E'\n\n## Benefits\n',
--   COALESCE(benefits, '')
-- )
-- WHERE requirements IS NOT NULL OR benefits IS NOT NULL;
