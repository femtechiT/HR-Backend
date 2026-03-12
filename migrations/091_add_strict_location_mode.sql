-- Migration: Add strict location mode to attendance settings
-- Description: Allows toggling between strict (assigned locations only) and legacy (branch-based) mode
-- Date: March 12, 2026

-- Add strict_location_mode column
ALTER TABLE attendance_settings
ADD COLUMN strict_location_mode BOOLEAN DEFAULT FALSE COMMENT 'TRUE = Staff must check in at assigned locations only, FALSE = Use branch-based legacy mode';

-- Update existing settings to use legacy mode by default (backward compatible)
UPDATE attendance_settings SET strict_location_mode = FALSE WHERE strict_location_mode IS NULL;

-- Add to global settings too
ALTER TABLE global_attendance_settings
ADD COLUMN strict_location_mode BOOLEAN DEFAULT FALSE COMMENT 'Global default: TRUE = Staff must check in at assigned locations only';

SELECT 'Migration complete: Strict location mode added' AS status;
