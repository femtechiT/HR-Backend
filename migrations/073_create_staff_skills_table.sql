-- Migration: Create staff_skills table
-- Description: Creates a table to store skills for staff members

CREATE TABLE IF NOT EXISTS staff_skills (
  id INT PRIMARY KEY AUTO_INCREMENT,
  staff_id INT NOT NULL,
  skill_name VARCHAR(255) NOT NULL,
  proficiency_level ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'intermediate',
  years_of_experience DECIMAL(4, 2),
  certification_status ENUM('none', 'certified', 'in_progress') DEFAULT 'none',
  last_used_date DATE,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  INDEX idx_staff_id (staff_id),
  INDEX idx_skill_name (skill_name),
  INDEX idx_proficiency_level (proficiency_level)
);