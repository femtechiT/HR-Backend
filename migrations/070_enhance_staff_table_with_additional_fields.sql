-- Migration: Enhance staff table with additional fields
-- Description: Adds comprehensive fields for professional, payroll, personal, and asset tracking

-- Add the new columns first (excluding updated_at which needs separate handling)
ALTER TABLE staff
ADD COLUMN reporting_manager_id INT NULL,
ADD COLUMN work_mode ENUM('onsite', 'remote', 'hybrid') DEFAULT 'onsite',
ADD COLUMN bank_name VARCHAR(255),
ADD COLUMN bank_account_number VARCHAR(50),
ADD COLUMN bank_ifsc_code VARCHAR(50),
ADD COLUMN tax_identification_number VARCHAR(50),
ADD COLUMN base_salary DECIMAL(10, 2),
ADD COLUMN pay_grade VARCHAR(50),
ADD COLUMN pension_insurance_id VARCHAR(50),
ADD COLUMN emergency_contact_name VARCHAR(255),
ADD COLUMN emergency_contact_phone VARCHAR(20),
ADD COLUMN emergency_contact_relationship VARCHAR(100),
ADD COLUMN date_of_birth DATE,
ADD COLUMN gender ENUM('male', 'female', 'other'),
ADD COLUMN current_address_id INT NULL,
ADD COLUMN permanent_address_id INT NULL,
ADD COLUMN company_assets JSON,
ADD COLUMN primary_skills TEXT,
ADD COLUMN education_certifications JSON,
ADD COLUMN employee_photo VARCHAR(500),
ADD COLUMN probation_end_date DATE,
ADD COLUMN contract_end_date DATE,
ADD COLUMN weekly_working_hours DECIMAL(4, 2) DEFAULT 40.00,
ADD COLUMN overtime_eligibility BOOLEAN DEFAULT TRUE,
ADD COLUMN medical_insurance_id VARCHAR(50),
ADD COLUMN provident_fund_id VARCHAR(50),
ADD COLUMN gratuity_applicable BOOLEAN DEFAULT TRUE,
ADD COLUMN notice_period_days INT DEFAULT 30,
ADD COLUMN work_email VARCHAR(255),
ADD COLUMN personal_email VARCHAR(255),
ADD COLUMN phone_number VARCHAR(20),
ADD COLUMN alternate_phone_number VARCHAR(20),
ADD COLUMN marital_status ENUM('single', 'married', 'divorced', 'widowed') DEFAULT 'single',
ADD COLUMN blood_group VARCHAR(5),
ADD COLUMN allergies TEXT,
ADD COLUMN special_medical_notes TEXT,
ADD COLUMN highest_qualification VARCHAR(100),
ADD COLUMN university_school VARCHAR(255),
ADD COLUMN year_of_graduation YEAR,
ADD COLUMN professional_certifications TEXT,
ADD COLUMN certifications_json JSON,
ADD COLUMN languages_known JSON,
ADD COLUMN notice_period_start_date DATE,
ADD COLUMN notice_period_end_date DATE,
ADD COLUMN relieving_date DATE,
ADD COLUMN experience_years DECIMAL(4, 2),
ADD COLUMN previous_company VARCHAR(255),
ADD COLUMN resignation_date DATE,
ADD COLUMN last_working_date DATE,
ADD COLUMN reason_for_leaving TEXT,
ADD COLUMN reference_check_status ENUM('pending', 'cleared', 'failed') DEFAULT 'pending',
ADD COLUMN background_verification_status ENUM('pending', 'cleared', 'failed') DEFAULT 'pending';

-- Modify the updated_at column separately to preserve its trigger behavior if any
ALTER TABLE staff MODIFY COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Add foreign key constraint for reporting manager (after the column exists)
ALTER TABLE staff
ADD CONSTRAINT fk_reporting_manager
FOREIGN KEY (reporting_manager_id) REFERENCES staff(id) ON DELETE SET NULL;

-- Add foreign key constraints for address references
ALTER TABLE staff 
ADD CONSTRAINT fk_current_address 
FOREIGN KEY (current_address_id) REFERENCES staff_addresses(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_permanent_address 
FOREIGN KEY (permanent_address_id) REFERENCES staff_addresses(id) ON DELETE SET NULL;

-- Update indexes
CREATE INDEX idx_work_mode ON staff(work_mode);
CREATE INDEX idx_date_of_birth ON staff(date_of_birth);
CREATE INDEX idx_gender ON staff(gender);
CREATE INDEX idx_probation_end_date ON staff(probation_end_date);
CREATE INDEX idx_contract_end_date ON staff(contract_end_date);
CREATE INDEX idx_resignation_date ON staff(resignation_date);
CREATE INDEX idx_last_working_date ON staff(last_working_date);
CREATE INDEX idx_reporting_manager ON staff(reporting_manager_id);