-- Migration: Create job_postings table
-- Description: Creates the job_postings table for storing job listings

CREATE TABLE IF NOT EXISTS job_postings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  department_id INT,
  location VARCHAR(255),
  salary_range_min DECIMAL(10,2),
  salary_range_max DECIMAL(10,2),
  employment_type ENUM('full_time', 'part_time', 'contract', 'internship', 'temporary') DEFAULT 'full_time',
  experience_level ENUM('entry', 'mid', 'senior', 'executive'),
  posted_by INT NOT NULL,
  posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closing_date DATE NOT NULL,
  start_date DATE,
  application_deadline DATE NOT NULL,
  status ENUM('draft', 'open', 'closed', 'filled') DEFAULT 'draft',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (posted_by) REFERENCES users(id),
  INDEX idx_status (status),
  INDEX idx_closing_date (closing_date),
  INDEX idx_department_id (department_id),
  INDEX idx_is_active (is_active)
);