-- Migration: Create guarantors table for staff emergency contacts and guarantees
-- Description: Creates the guarantors table for storing staff guarantor information
-- Features: 
--   - Multiple guarantors per staff member
--   - Comprehensive contact information
--   - Document upload support for signed guarantor forms
--   - Verification workflow for admin

CREATE TABLE IF NOT EXISTS guarantors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  staff_id INT NOT NULL,
  
  -- Personal Information
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100) NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NULL,
  gender ENUM('male', 'female', 'other') NULL,
  phone_number VARCHAR(20) NOT NULL,
  alternate_phone VARCHAR(20) NULL,
  email VARCHAR(100) NULL,
  
  -- Address
  address_line_1 VARCHAR(255) NOT NULL,
  address_line_2 VARCHAR(255) NULL,
  city VARCHAR(100) NULL,
  state VARCHAR(100) NULL,
  postal_code VARCHAR(20) NULL,
  country VARCHAR(100) DEFAULT 'Nigeria',
  
  -- Identification
  id_type ENUM('national_id', 'passport', 'drivers_license', 'voters_card', 'other') NULL,
  id_number VARCHAR(50) NULL,
  id_issuing_authority VARCHAR(100) NULL,
  id_issue_date DATE NULL,
  id_expiry_date DATE NULL,
  
  -- Relationship to Staff
  relationship VARCHAR(100) NULL COMMENT 'Relationship to the staff member',
  occupation VARCHAR(100) NULL,
  employer_name VARCHAR(200) NULL,
  employer_address VARCHAR(255) NULL,
  employer_phone VARCHAR(20) NULL,
  
  -- Guarantee Details
  guarantee_type ENUM('personal', 'financial', 'both') DEFAULT 'personal',
  guarantee_amount DECIMAL(15,2) NULL COMMENT 'Maximum guarantee amount if financial',
  guarantee_start_date DATE NULL,
  guarantee_end_date DATE NULL,
  guarantee_terms TEXT NULL COMMENT 'Special terms or conditions',
  
  -- Document Reference (for uploaded signed form)
  guarantor_form_path VARCHAR(500) NULL COMMENT 'Path to uploaded signed guarantor form',
  id_document_path VARCHAR(500) NULL COMMENT 'Path to uploaded ID document',
  
  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by INT NULL,
  verified_at TIMESTAMP NULL,
  verification_notes TEXT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
  
  -- Indexes
  INDEX idx_guarantor_staff (staff_id),
  INDEX idx_guarantor_active (is_active),
  INDEX idx_guarantor_verified (is_verified)
);

-- Create view for easy guarantor lookup
CREATE OR REPLACE VIEW staff_guarantors_summary AS
SELECT
  g.id,
  g.staff_id,
  s.user_id,
  CONCAT(g.first_name, ' ', IFNULL(g.middle_name, ''), ' ', g.last_name) AS guarantor_name,
  g.first_name,
  g.middle_name,
  g.last_name,
  g.phone_number,
  g.alternate_phone,
  g.email,
  g.relationship,
  g.occupation,
  g.guarantee_type,
  g.is_verified,
  g.is_active,
  g.guarantor_form_path,
  g.id_document_path,
  g.created_at,
  u.full_name AS verified_by_name,
  g.verified_at,
  g.verification_notes
FROM guarantors g
LEFT JOIN staff s ON g.staff_id = s.id
LEFT JOIN users u ON g.verified_by = u.id
ORDER BY g.is_active DESC, g.created_at DESC;
