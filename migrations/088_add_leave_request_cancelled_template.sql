-- Migration: Add leave request cancelled notification template
-- Description: Email template for when leave is cancelled

INSERT INTO notification_templates (name, title_template, body_template, subject_template, channel, variables, enabled)
VALUES (
  'leave_request_cancelled',
  'Your Leave Request has been Cancelled',
  'Dear {staff_name},\n\nYour {leave_type} request from {start_date} to {end_date} ({days} days) has been cancelled.\n\nReason: {rejection_reason}\n\nIf you have any questions, please contact your manager or HR department.\n\nBest regards,\n{company_name}',
  'Leave Request Cancelled - {staff_name}',
  'email',
  '["staff_name", "leave_type", "start_date", "end_date", "days", "rejection_reason", "company_name"]',
  TRUE
)
ON DUPLICATE KEY UPDATE
  title_template = VALUES(title_template),
  body_template = VALUES(body_template),
  subject_template = VALUES(subject_template),
  variables = VALUES(variables),
  enabled = VALUES(enabled);
