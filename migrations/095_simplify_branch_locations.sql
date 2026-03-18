-- Migration: Simplify Branch and Location System
-- Description: Unifies all location data into attendance_locations table
--              Removes redundant location data from branches table
--              Simplifies staff location assignments
-- Date: March 18, 2026

-- ========================================
-- PHASE 1: Create New Structure
-- ========================================

-- 1. Add location_type to attendance_locations (if not exists)
ALTER TABLE attendance_locations
ADD COLUMN IF NOT EXISTS location_type ENUM('branch_office', 'remote_site', 'client_location', 'co_working', 'other') 
DEFAULT 'branch_office' COMMENT 'Type of location for better categorization';

-- 2. Add address to attendance_locations (if not exists)
ALTER TABLE attendance_locations
ADD COLUMN IF NOT EXISTS address VARCHAR(500) COMMENT 'Full address of location';

-- 3. Create staff_secondary_locations table for multiple location assignments
CREATE TABLE IF NOT EXISTS staff_secondary_locations (
  staff_id INT NOT NULL,
  location_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (staff_id, location_id),
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES attendance_locations(id) ON DELETE CASCADE,
  INDEX idx_location_id (location_id)
) COMMENT 'Secondary locations for staff who work at multiple sites';

-- 4. Migrate branch locations to attendance_locations
-- This creates attendance locations for all branches that have coordinates
INSERT INTO attendance_locations (
  name, 
  location_type, 
  branch_id, 
  location_coordinates, 
  location_radius_meters, 
  address,
  is_active
)
SELECT 
  CONCAT(b.name, ' - Main Office'),
  'branch_office',
  b.id,
  ST_GeomFromText(CONCAT('POINT(', 
    SUBSTRING_INDEX(b.location_coordinates, ',', -1), ' ', 
    SUBSTRING_INDEX(b.location_coordinates, ',', 1), 
  ')')),
  b.location_radius_meters,
  CONCAT_WS(', ', b.address, b.city, b.state, b.country),
  IF(b.status = 'active', TRUE, FALSE)
FROM branches b
WHERE b.location_coordinates IS NOT NULL 
  AND b.location_coordinates != ''
  AND NOT EXISTS (
    SELECT 1 FROM attendance_locations al 
    WHERE al.branch_id = b.id AND al.location_type = 'branch_office'
  );

-- ========================================
-- PHASE 2: Update Staff Assignments
-- ========================================

-- Migrate staff location_assignments JSON to staff_secondary_locations table
-- This extracts secondary locations from JSON and creates proper relational rows
INSERT IGNORE INTO staff_secondary_locations (staff_id, location_id)
SELECT 
  s.id as staff_id,
  CAST(sec_loc AS UNSIGNED) as location_id
FROM staff s,
JSON_TABLE(
  s.location_assignments->'$.secondary_locations',
  '$[*]' COLUMNS(sec_loc VARCHAR(100) PATH '$')
) as jt
WHERE s.location_assignments IS NOT NULL
  AND s.location_assignments->'$.secondary_locations' IS NOT NULL
  AND CAST(sec_loc AS UNSIGNED) > 0;

-- ========================================
-- PHASE 3: Update Attendance Check-in Logic
-- ========================================

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_staff_location ON staff(assigned_location_id);
CREATE INDEX IF NOT EXISTS idx_location_branch ON attendance_locations(branch_id);
CREATE INDEX IF NOT EXISTS idx_location_active ON attendance_locations(is_active);

-- ========================================
-- PHASE 4: Create Views for Backward Compatibility
-- ========================================

-- Create view for easy staff location lookup
CREATE OR REPLACE VIEW staff_locations_simple AS
SELECT 
  s.id as staff_id,
  s.user_id,
  u.full_name,
  s.employee_id,
  al.id as primary_location_id,
  al.name as primary_location_name,
  al.location_type,
  al.branch_id,
  b.name as branch_name,
  GROUP_CONCAT(DISTINCT ssl.location_id SEPARATOR ',') as secondary_location_ids,
  GROUP_CONCAT(DISTINCT al2.name SEPARATOR ', ') as secondary_location_names
FROM staff s
LEFT JOIN users u ON s.user_id = u.id
LEFT JOIN attendance_locations al ON s.assigned_location_id = al.id
LEFT JOIN branches b ON al.branch_id = b.id
LEFT JOIN staff_secondary_locations ssl ON s.id = ssl.staff_id
LEFT JOIN attendance_locations al2 ON ssl.location_id = al2.id
WHERE s.status != 'terminated'
GROUP BY s.id, s.user_id, al.id, al.name, al.location_type, al.branch_id, b.name;

-- ========================================
-- PHASE 5: Deprecation Notices (DO NOT DELETE YET)
-- ========================================

-- We're NOT deleting old columns yet for safety
-- These columns are now DEPRECATED and will be removed in a future migration

-- Mark deprecated columns with comments
ALTER TABLE branches 
MODIFY COLUMN location_coordinates VARCHAR(255) COMMENT '[DEPRECATED] Use attendance_locations table instead',
MODIFY COLUMN location_radius_meters INT COMMENT '[DEPRECATED] Use attendance_locations table instead',
MODIFY COLUMN attendance_mode ENUM('branch_based', 'multiple_locations') COMMENT '[DEPRECATED] All locations now use attendance_locations';

ALTER TABLE staff
MODIFY COLUMN location_assignments JSON COMMENT '[DEPRECATED] Use staff_secondary_locations table instead';

-- ========================================
-- Summary
-- ========================================

SELECT 'Migration Complete!' as status;
SELECT '✅ Created staff_secondary_locations table' as result;
SELECT '✅ Migrated branch locations to attendance_locations' as result;
SELECT '✅ Migrated staff secondary locations from JSON to relational table' as result;
SELECT '✅ Created staff_locations_simple view for easy queries' as result;
SELECT '⚠️  Deprecated columns marked for future removal' as result;
SELECT '' as result;
SELECT 'Next Steps:' as result;
SELECT '1. Update backend code to use new unified location system' as result;
SELECT '2. Simplify attendance check-in logic' as result;
SELECT '3. Test thoroughly' as result;
SELECT '4. After verification, remove deprecated columns' as result;
