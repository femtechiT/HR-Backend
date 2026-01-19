-- Migration: Add date_of_birth column to users table
-- Description: Adds date of birth column to users table for birthday notifications

ALTER TABLE users ADD COLUMN date_of_birth DATE NULL COMMENT 'Date of birth for birthday notifications';