-- Migration: Create shift_exception_types table
-- Description: Creates a dynamic table for managing shift exception types
--              Allows admins to create custom exception types instead of hardcoded ENUM

CREATE TABLE IF NOT EXISTS shift_exception_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,                    -- e.g., "Medical Appointment"
  code VARCHAR(50) NOT NULL UNIQUE,              -- e.g., "medical_appt"
  description TEXT,                               -- e.g., "For medical/doctor appointments"
  icon VARCHAR(50) DEFAULT 'AlertCircle',        -- Icon name from lucide-react
  color VARCHAR(50) DEFAULT 'bg-gray-100 text-gray-700',  -- Tailwind color classes
  default_start_time TIME,                        -- Optional: Suggested start time
  default_end_time TIME,                          -- Optional: Suggested end time
  default_break_duration INT DEFAULT 60,          -- Default break duration in minutes
  is_active BOOLEAN DEFAULT TRUE,                 -- Can be disabled but not deleted
  is_system BOOLEAN DEFAULT FALSE,                -- System types can't be deleted
  sort_order INT DEFAULT 0,                       -- Display order
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_code (code),
  INDEX idx_is_active (is_active),
  INDEX idx_sort_order (sort_order)
);

-- Insert default exception types
INSERT INTO shift_exception_types (name, code, description, icon, color, is_system, sort_order) VALUES
('Late Start', 'late_start', 'Employee starts later than their scheduled time', 'Clock', 'bg-blue-100 text-blue-700', TRUE, 1),
('Early Release', 'early_release', 'Employee leaves earlier than their scheduled time', 'Clock', 'bg-amber-100 text-amber-700', TRUE, 2),
('Day Off', 'day_off', 'Employee is not required to work on this date', 'Calendar', 'bg-red-100 text-red-700', TRUE, 3),
('Special Schedule', 'special_schedule', 'Custom schedule for this specific date', 'Settings', 'bg-purple-100 text-purple-700', TRUE, 4),
('Holiday Work', 'holiday_work', 'Employee is scheduled to work on a holiday', 'Calendar', 'bg-green-100 text-green-700', TRUE, 5),
('Medical Appointment', 'medical_appt', 'Medical or doctor appointment', 'Stethoscope', 'bg-pink-100 text-pink-700', TRUE, 6),
('Remote Work', 'remote_work', 'Working from a different location', 'Wifi', 'bg-indigo-100 text-indigo-700', TRUE, 7),
('Training', 'training', 'Attending training or professional development', 'BookOpen', 'bg-cyan-100 text-cyan-700', TRUE, 8);

-- Update shift_exceptions table to reference exception types
ALTER TABLE shift_exceptions
ADD COLUMN exception_type_id INT AFTER exception_type,
ADD FOREIGN KEY (exception_type_id) REFERENCES shift_exception_types(id) ON DELETE SET NULL,
ADD INDEX idx_exception_type_id (exception_type_id);

-- Migrate existing data: Map old ENUM values to new type IDs
UPDATE shift_exceptions se
JOIN shift_exception_types st ON se.exception_type = st.code
SET se.exception_type_id = st.id
WHERE se.exception_type_id IS NULL;
