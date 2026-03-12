-- Migration: Add location assignment fields to staff table
-- Description: Allows assigning specific attendance locations to employees
-- Date: March 1, 2026

-- Add assigned_location_id column for primary location assignment
ALTER TABLE staff
ADD COLUMN assigned_location_id INT NULL COMMENT 'Primary attendance location ID for this employee',
ADD FOREIGN KEY (assigned_location_id) REFERENCES attendance_locations(id) ON DELETE SET NULL,
ADD INDEX idx_assigned_location (assigned_location_id);

-- Add JSON field for multiple location assignments (optional, for advanced use cases)
-- Note: Functional index removed for MariaDB compatibility
ALTER TABLE staff
ADD COLUMN location_assignments JSON NULL COMMENT 'JSON: {"primary_location": 1, "secondary_locations": [2,3]}';

-- Add notes field for location-related comments (if not already exists)
ALTER TABLE staff
ADD COLUMN location_notes TEXT NULL COMMENT 'Notes about employee location assignment';

-- Migrate existing staff to default location (their branch's main location)
-- This ensures all existing employees have a location assignment
UPDATE staff s
JOIN branches b ON s.branch_id = b.id
JOIN attendance_locations al ON al.branch_id = b.id AND al.is_active = TRUE
SET s.assigned_location_id = al.id
WHERE s.assigned_location_id IS NULL
LIMIT 100; -- Limit to avoid locking table for too long

-- Create view for easy location assignment lookup
CREATE OR REPLACE VIEW staff_location_assignments AS
SELECT
  s.user_id,
  s.employee_id,
  u.full_name,
  s.branch_id,
  b.name AS branch_name,
  s.assigned_location_id,
  al.name AS location_name,
  al.location_coordinates,
  al.location_radius_meters,
  s.location_assignments,
  s.location_notes
FROM staff s
JOIN users u ON s.user_id = u.id
LEFT JOIN branches b ON s.branch_id = b.id
LEFT JOIN attendance_locations al ON s.assigned_location_id = al.id
WHERE s.status = 'active';

-- Grant permissions (adjust as needed)
-- GRANT SELECT ON staff_location_assignments TO 'hr_user';

SELECT 'Migration complete: Staff location assignment fields added' AS status;
