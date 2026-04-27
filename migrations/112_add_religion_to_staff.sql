-- Migration 111: Add religion field to staff table
-- Stores religion for staff profile completion and HR records.

ALTER TABLE staff
ADD COLUMN IF NOT EXISTS religion VARCHAR(100) NULL AFTER blood_group;
