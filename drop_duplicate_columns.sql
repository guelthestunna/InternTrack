-- ============================================================================
-- DROP DUPLICATE LOCATION COLUMNS
-- ============================================================================

-- Drop the duplicate columns I added (use the original ones from migration)
ALTER TABLE attendance DROP COLUMN IF EXISTS time_in_latitude;
ALTER TABLE attendance DROP COLUMN IF EXISTS time_in_longitude;
ALTER TABLE attendance DROP COLUMN IF EXISTS time_out_latitude;
ALTER TABLE attendance DROP COLUMN IF EXISTS time_out_longitude;

-- ============================================================================
-- COMPLETE
-- ============================================================================
