-- Migration: Add birthday notification templates
-- Description: Adds notification templates for birthday reminders

-- Insert birthday reminder template
INSERT INTO notification_templates (name, title_template, body_template, subject_template, channel, variables, enabled) 
VALUES (
  'birthday_reminder',
  'Upcoming Birthday Reminder',
  'Dear HR Team,\\\\n\\\\nThis is to inform you that {{employee_name}} ({{employee_id}}) has a birthday coming up tomorrow, {{tomorrow_date}}.\\\\n\\\\nEmployee Details:\\\\n- Name: {{employee_name}}\\\\n- Employee ID: {{employee_id}}\\\\n- Designation: {{designation}}\\\\n- Department: {{department}}\\\\n- Branch: {{branch}}\\\\n\\\\nPlease consider sending birthday wishes to make them feel valued as part of our team.\\\\n\\\\nBest regards,\\\\nThe {{company_name}} HR Management System',
  'Birthday Reminder: {{employee_name}} - Tomorrow ({{tomorrow_date}})',
  'email',
  '[\\"employee_name\\", \\"employee_id\\", \\"designation\\", \\"department\\", \\"branch\\", \\"tomorrow_date\\", \\"company_name\\"]',
  TRUE
) 
ON DUPLICATE KEY UPDATE 
  title_template = VALUES(title_template),
  body_template = VALUES(body_template),
  subject_template = VALUES(subject_template),
  channel = VALUES(channel),
  variables = VALUES(variables),
  enabled = VALUES(enabled);

-- Insert birthday summary template
INSERT INTO notification_templates (name, title_template, body_template, subject_template, channel, variables, enabled)
VALUES (
  'birthday_summary',
  'Daily Birthday Summary',
  'Dear HR Team,\\\\n\\\\nHere are the birthdays happening tomorrow, {{date}}:\\\\n\\\\n{% for birthday in birthday_list %}\\\\n- {{birthday.name}} ({{birthday.id}}), {{birthday.designation}}, {{birthday.department}}\\\\n{% endfor %}\\\\n\\\\nPlease consider sending birthday wishes to make them feel valued as part of our team.\\\\n\\\\nBest regards,\\\\nThe {{company_name}} HR Management System',
  'Birthday Summary for Tomorrow ({{date}}) - {{company_name}}',
  'email',
  '[\\"date\\", \\"birthday_list\\", \\"company_name\\"]',
  TRUE
)
ON DUPLICATE KEY UPDATE
  title_template = VALUES(title_template),
  body_template = VALUES(body_template),
  subject_template = VALUES(subject_template),
  channel = VALUES(channel),
  variables = VALUES(variables),
  enabled = VALUES(enabled);