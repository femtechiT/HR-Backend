-- Migration: Add birthday notification templates
-- Description: Adds notification templates for birthday reminders

-- Insert birthday reminder template
SET @template_body = CONCAT(
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">',
  '<h2 style="color: #333; text-align: center;">🎂 Upcoming Birthday Alert</h2>',
  '<p style="font-size: 16px; color: #555;">Dear HR Team,</p>',
  '<p style="font-size: 16px; color: #555;">This is to inform you that <strong>{{employee_name}}</strong> ({{employee_id}}) has a birthday coming up tomorrow, <strong>{{tomorrow_date}}</strong>.</p>',
  '<div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 15px 0;">',
    '<h3 style="margin-top: 0; color: #333;">Employee Details:</h3>',
    '<p><strong>Name:</strong> {{employee_name}}</p>',
    '<p><strong>Employee ID:</strong> {{employee_id}}</p>',
    '<p><strong>Designation:</strong> {{designation}}</p>',
    '<p><strong>Department:</strong> {{department}}</p>',
    '<p><strong>Branch:</strong> {{branch}}</p>',
  '</div>',
  '<p style="font-size: 16px; color: #555;">Please consider sending birthday wishes to make them feel valued as part of our team.</p>',
  '<p style="font-size: 16px; color: #555;">Best regards,<br/>The {{company_name}} HR Management System</p>',
  '</div>'
);

SET @summary_body = CONCAT(
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">',
  '<h2 style="color: #333; text-align: center;">🎂 Daily Birthday Summary</h2>',
  '<p style="font-size: 16px; color: #555;">Dear HR Team,</p>',
  '<p style="font-size: 16px; color: #555;">Here are the birthdays happening tomorrow, <strong>{{date}}</strong>.</p>',
  '<ul style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; list-style-type: none; padding-left: 0;">',
    '{% for birthday in birthday_list %}',
    '<li style="padding: 10px; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between;">',
      '<span><strong>{{birthday.name}}</strong> ({{birthday.id}})</span>',
      '<span>{{birthday.designation}}, {{birthday.department}}</span>',
    '</li>',
    '{% endfor %}',
  '</ul>',
  '<p style="font-size: 16px; color: #555;">Please consider sending birthday wishes to make them feel valued as part of our team.</p>',
  '<p style="font-size: 16px; color: #555;">Best regards,<br/>The {{company_name}} HR Management System</p>',
  '</div>'
);

-- Insert birthday reminder template
INSERT INTO notification_templates (name, title_template, body_template, subject_template, channel, variables, enabled)
VALUES (
  'birthday_reminder',
  'Upcoming Birthday Reminder',
  @template_body,
  'Birthday Reminder: {{employee_name}} - Tomorrow ({{tomorrow_date}})',
  'email',
  JSON_ARRAY('employee_name', 'employee_id', 'designation', 'department', 'branch', 'tomorrow_date', 'company_name'),
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
  @summary_body,
  'Birthday Summary for Tomorrow ({{date}}) - {{company_name}}',
  'email',
  JSON_ARRAY('date', 'birthday_list', 'company_name'),
  TRUE
)
ON DUPLICATE KEY UPDATE
  title_template = VALUES(title_template),
  body_template = VALUES(body_template),
  subject_template = VALUES(subject_template),
  channel = VALUES(channel),
  variables = VALUES(variables),
  enabled = VALUES(enabled);