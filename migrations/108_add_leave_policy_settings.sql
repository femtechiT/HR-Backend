-- Migration: Add leave policy settings
-- Description: Stores system-wide leave counting rules such as excluding Sundays

ALTER TABLE global_attendance_settings
  ADD COLUMN exclude_sundays_from_leave BOOLEAN DEFAULT FALSE AFTER enable_holiday_attendance;

UPDATE global_attendance_settings
SET exclude_sundays_from_leave = FALSE
WHERE exclude_sundays_from_leave IS NULL;
