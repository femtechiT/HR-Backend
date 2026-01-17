-- Migration: Create job_applications table
-- Description: Creates the job_applications table for storing job applications

CREATE TABLE IF NOT EXISTS job_applications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  job_posting_id INT NOT NULL,
  applicant_name VARCHAR(255) NOT NULL,
  applicant_email VARCHAR(255) NOT NULL,
  applicant_phone VARCHAR(20),
  resume_file_path VARCHAR(500),
  cover_letter TEXT,
  application_status ENUM('applied', 'under_review', 'shortlisted', 'interviewed', 'offered', 'rejected', 'withdrawn') DEFAULT 'applied',
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  reviewed_by INT NULL,
  hired_at TIMESTAMP NULL,
  hired_by INT NULL,
  rejection_reason TEXT,
  offer_accepted BOOLEAN DEFAULT NULL,
  offer_accepted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (job_posting_id) REFERENCES job_postings(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id),
  FOREIGN KEY (hired_by) REFERENCES users(id),
  INDEX idx_job_posting_id (job_posting_id),
  INDEX idx_application_status (application_status),
  INDEX idx_applicant_email (applicant_email),
  INDEX idx_applied_at (applied_at)
);