-- Populate notification_templates table with default templates

-- Leave request confirmation template
INSERT INTO notification_templates (name, title_template, body_template, subject_template, channel, variables, enabled) VALUES
('leave_request_confirmation', 'Leave Request Submitted', 'Dear {staff_name},<br><br>Your leave request for {leave_type} from {start_date} to {end_date} ({days} days) has been successfully submitted.<br><br>Reference Number: {request_id}<br>Status: Pending Approval<br><br>You will be notified once your request has been reviewed.', 'Leave Request Confirmation - {company_name}', 'email', '["staff_name", "leave_type", "start_date", "end_date", "days", "request_id", "company_name"]', TRUE);

-- Leave request approval template
INSERT INTO notification_templates (name, title_template, body_template, subject_template, channel, variables, enabled) VALUES
('leave_request_approved', 'Leave Request Approved', 'Dear {staff_name},<br><br>Your leave request for {leave_type} from {start_date} to {end_date} ({days} days) has been approved.<br><br>Approved by: {approver_name}<br>Approval Date: {approval_date}<br>Reference Number: {request_id}<br><br>Please plan accordingly and ensure your duties are covered during your absence.', 'Leave Request Approved - {company_name}', 'email', '["staff_name", "leave_type", "start_date", "end_date", "days", "approver_name", "approval_date", "request_id", "company_name"]', TRUE);

-- Leave request rejection template
INSERT INTO notification_templates (name, title_template, body_template, subject_template, channel, variables, enabled) VALUES
('leave_request_rejected', 'Leave Request Rejected', 'Dear {staff_name},<br><br>Unfortunately, your leave request for {leave_type} from {start_date} to {end_date} ({days} days) has been rejected.<br><br>Rejected by: {approver_name}<br>Rejection Date: {rejection_date}<br>Reason: {rejection_reason}<br>Reference Number: {request_id}<br><br>Please contact your manager for more information.', 'Leave Request Rejected - {company_name}', 'email', '["staff_name", "leave_type", "start_date", "end_date", "days", "approver_name", "rejection_date", "rejection_reason", "request_id", "company_name"]', TRUE);

-- Leave expiry warning template
INSERT INTO notification_templates (name, title_template, body_template, subject_template, channel, variables, enabled) VALUES
('leave_expiry_warning', 'Leave Balance Expiring Soon', 'Dear {staff_name},<br><br>This is to inform you that {days_remaining} days of your {leave_type} leave balance will expire on {expiry_date}.<br><br>If you do not utilize these days before the expiry date, they will be forfeited according to company policy.<br><br>Please plan to use these days or contact HR if you have any questions.', 'Leave Balance Expiring Soon - {company_name}', 'email', '["staff_name", "days_remaining", "leave_type", "expiry_date", "company_name"]', TRUE);

-- Payroll ready template
INSERT INTO notification_templates (name, title_template, body_template, subject_template, channel, variables, enabled) VALUES
('payroll_ready', 'Your Payroll for {pay_period} is Ready', 'Dear {staff_name},<br><br>Your payroll for {pay_period} has been processed and is now available.<br><br>Net Pay: {net_pay}<br>Pay Date: {pay_date}<br><br>You can view and download your payslip from the employee portal.', 'Payroll for {pay_period} Available - {company_name}', 'email', '["staff_name", "pay_period", "net_pay", "pay_date", "company_name"]', TRUE);

-- Appraisal reminder template
INSERT INTO notification_templates (name, title_template, body_template, subject_template, channel, variables, enabled) VALUES
('appraisal_reminder', 'Appraisal Cycle Reminder', 'Dear {staff_name},<br><br>This is a reminder that the {appraisal_cycle} appraisal cycle is ongoing.<br><br>Deadline: {deadline}<br><br>Please complete your self-assessment and submit any required documentation through the employee portal.<br><br>Contact HR if you need assistance.', 'Appraisal Cycle Reminder - {company_name}', 'email', '["staff_name", "appraisal_cycle", "deadline", "company_name"]', TRUE);

-- System announcement template
INSERT INTO notification_templates (name, title_template, body_template, subject_template, channel, variables, enabled) VALUES
('system_announcement', 'System Announcement: {announcement_title}', 'Dear {recipient_name},<br><br>{announcement_body}<br><br>This announcement was made on {announcement_date} by {announcer_name}.<br><br>Please comply with the instructions provided.', 'System Announcement: {announcement_title}', 'email', '["recipient_name", "announcement_title", "announcement_body", "announcement_date", "announcer_name"]', TRUE);

-- Password change required template
INSERT INTO notification_templates (name, title_template, body_template, subject_template, channel, variables, enabled) VALUES
('password_change_required', 'Password Change Required', 'Dear {staff_name},<br><br>For security purposes, you are required to change your password.<br><br>This is mandatory and must be completed by {deadline}.<br><br>Please log in to the system and navigate to Profile > Change Password to update your credentials.', 'Action Required: Password Change - {company_name}', 'email', '["staff_name", "deadline", "company_name"]', TRUE);

-- Welcome email template
INSERT INTO notification_templates (name, title_template, body_template, subject_template, channel, variables, enabled) VALUES
('welcome_email', 'Welcome to {company_name}, {staff_name}!', 'Dear {staff_name},<br><br>Welcome to {company_name}! We are excited to have you as part of our team.<br><br>Your account has been created with the following details:<br>Email: {work_email}<br><br>Please log in to the HR portal using your credentials and complete your profile information.<br><br>If you have any questions, feel free to reach out to HR.', 'Welcome to {company_name}!', 'email', '["staff_name", "company_name", "work_email"]', TRUE);