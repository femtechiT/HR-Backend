-- Migration 102: Add course_of_study field to staff table
-- Created: 2026-03-26
-- Purpose: Add course of study field for staff education information

ALTER TABLE staff
ADD COLUMN course_of_study VARCHAR(255) NULL AFTER year_of_graduation;

-- Add index for better query performance (optional)
-- ALTER TABLE staff ADD INDEX idx_course_of_study (course_of_study);
