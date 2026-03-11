-- Migration: Add holiday-working status to attendance table
-- Description: Adds 'holiday-working' status for employees scheduled to work on holidays

ALTER TABLE attendance
MODIFY COLUMN status ENUM('present', 'absent', 'late', 'half_day', 'leave', 'holiday', 'holiday-working') DEFAULT 'absent';
