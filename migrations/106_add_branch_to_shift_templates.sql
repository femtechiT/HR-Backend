-- Migration: Add branch association to shift templates
-- Description: Enables branch-level shift template management
--              Templates can be global (NULL branch_id) or branch-specific
-- Author: HR System
-- Date: 2026-03-29

-- Step 1: Add branch_id column to shift_templates
ALTER TABLE shift_templates
ADD COLUMN IF NOT EXISTS branch_id INT NULL
AFTER created_by;

-- Step 2: Add foreign key constraint (Safe check)
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'shift_templates' AND CONSTRAINT_NAME = 'fk_shift_template_branch');
SET @sql = IF(@fk_exists = 0, 'ALTER TABLE shift_templates ADD CONSTRAINT fk_shift_template_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL', 'SELECT ''FK already exists''');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 3: Add index for branch-based queries
ALTER TABLE shift_templates
ADD INDEX IF NOT EXISTS idx_branch (branch_id);

-- Step 4: Add index for combined branch + active queries
ALTER TABLE shift_templates
ADD INDEX IF NOT EXISTS idx_branch_active (branch_id, is_active);

-- Step 5: Update existing templates
-- Set branch_id based on creator's branch for existing templates
-- This ensures existing templates are associated with the creator's branch
UPDATE shift_templates st
INNER JOIN users u ON st.created_by = u.id
INNER JOIN staff s ON u.id = s.user_id
SET st.branch_id = s.branch_id
WHERE st.branch_id IS NULL
  AND s.branch_id IS NOT NULL;

-- Step 6: Add documentation comment
ALTER TABLE shift_templates
MODIFY COLUMN branch_id INT NULL 
COMMENT 'NULL = global template (all branches), INT = branch-specific template. When NULL, template is visible to all branches.';

-- Verification: Check templates by branch
SELECT 
  st.id,
  st.name,
  st.branch_id,
  b.name as branch_name,
  CASE 
    WHEN st.branch_id IS NULL THEN 'Global'
    ELSE 'Branch-specific'
  END as template_type
FROM shift_templates st
LEFT JOIN branches b ON st.branch_id = b.id
ORDER BY st.branch_id, st.name;

-- Query to find global templates (available to all branches)
SELECT COUNT(*) as global_templates
FROM shift_templates
WHERE branch_id IS NULL;

-- Query to find branch-specific templates
SELECT 
  b.name as branch_name,
  COUNT(st.id) as template_count
FROM shift_templates st
INNER JOIN branches b ON st.branch_id = b.id
GROUP BY b.id, b.name;

-- Rollback (if needed):
-- ALTER TABLE shift_templates DROP FOREIGN KEY fk_shift_template_branch;
-- ALTER TABLE shift_templates DROP INDEX idx_branch;
-- ALTER TABLE shift_templates DROP INDEX idx_branch_active;
-- ALTER TABLE shift_templates DROP COLUMN branch_id;
