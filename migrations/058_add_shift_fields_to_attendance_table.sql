-- Migration: Add shift-related fields to attendance table
-- Description: Adds fields to track attendance against dynamic schedules

-- Check if columns already exist before adding them
SET @col_exists := (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'attendance' 
    AND COLUMN_NAME = 'scheduled_start_time'
);

SET @sql := IF(@col_exists = 0, 
    'ALTER TABLE attendance ADD COLUMN scheduled_start_time TIME NULL COMMENT ''Scheduled start time based on employee shift''', 
    'SELECT ''Column already exists'' status');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'attendance' 
    AND COLUMN_NAME = 'scheduled_end_time'
);

SET @sql := IF(@col_exists = 0, 
    'ALTER TABLE attendance ADD COLUMN scheduled_end_time TIME NULL COMMENT ''Scheduled end time based on employee shift''', 
    'SELECT ''Column already exists'' status');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'attendance' 
    AND COLUMN_NAME = 'scheduled_break_duration_minutes'
);

SET @sql := IF(@col_exists = 0, 
    'ALTER TABLE attendance ADD COLUMN scheduled_break_duration_minutes INT DEFAULT 0 COMMENT ''Scheduled break duration based on employee shift''', 
    'SELECT ''Column already exists'' status');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'attendance' 
    AND COLUMN_NAME = 'is_late'
);

SET @sql := IF(@col_exists = 0, 
    'ALTER TABLE attendance ADD COLUMN is_late BOOLEAN DEFAULT NULL COMMENT ''Whether the employee was late based on their scheduled start time''', 
    'SELECT ''Column already exists'' status');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'attendance' 
    AND COLUMN_NAME = 'is_early_departure'
);

SET @sql := IF(@col_exists = 0, 
    'ALTER TABLE attendance ADD COLUMN is_early_departure BOOLEAN DEFAULT NULL COMMENT ''Whether the employee left early based on their scheduled end time''', 
    'SELECT ''Column already exists'' status');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'attendance' 
    AND COLUMN_NAME = 'actual_working_hours'
);

SET @sql := IF(@col_exists = 0, 
    'ALTER TABLE attendance ADD COLUMN actual_working_hours DECIMAL(4,2) DEFAULT NULL COMMENT ''Actual working hours after deducting break time''', 
    'SELECT ''Column already exists'' status');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;