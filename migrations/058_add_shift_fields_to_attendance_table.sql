-- Migration: Add shift-related fields to attendance table
-- Description: Adds fields to track attendance against dynamic schedules

-- Add scheduled_start_time column (without checking if exists, assuming it doesn't)
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS scheduled_start_time TIME NULL COMMENT 'Scheduled start time based on employee shift';

-- Add scheduled_end_time column
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS scheduled_end_time TIME NULL COMMENT 'Scheduled end time based on employee shift';

-- Add scheduled_break_duration_minutes column
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS scheduled_break_duration_minutes INT DEFAULT 0 COMMENT 'Scheduled break duration based on employee shift';

-- Add is_late column
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT NULL COMMENT 'Whether the employee was late based on their scheduled start time';

-- Add is_early_departure column
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS is_early_departure BOOLEAN DEFAULT NULL COMMENT 'Whether the employee left early based on their scheduled end time';

-- Add actual_working_hours column
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS actual_working_hours DECIMAL(4,2) DEFAULT NULL COMMENT 'Actual working hours after deducting break time';