-- Migration: Create application_comments table
-- Description: Creates the application_comments table for storing comments on job applications

CREATE TABLE IF NOT EXISTS application_comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  job_application_id INT NOT NULL,
  commented_by INT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (job_application_id) REFERENCES job_applications(id),
  FOREIGN KEY (commented_by) REFERENCES users(id),
  INDEX idx_job_application_id (job_application_id),
  INDEX idx_commented_by (commented_by),
  INDEX idx_created_at (created_at)
);