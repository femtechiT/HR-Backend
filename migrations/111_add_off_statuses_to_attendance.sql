-- Migration: Add weekend and off statuses to attendance table
-- Description: Adds 'weekend' and 'off' statuses for accurate non-working day tracking

ALTER TABLE attendance
MODIFY COLUMN status ENUM('present', 'absent', 'late', 'half_day', 'leave', 'holiday', 'holiday-working', 'weekend', 'off') DEFAULT 'absent';
