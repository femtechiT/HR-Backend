/**
 * Permission Definitions Service
 * Defines all available permissions in the system
 */

export interface PermissionDefinition {
  key: string;
  category: string;
  description: string;
}

// Hardcoded list of all available permissions in the system
export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // Staff Management Permissions
  { key: 'staff:create', category: 'Staff Management', description: 'Create new staff members' },
  { key: 'staff:read', category: 'Staff Management', description: 'View staff information' },
  { key: 'staff:update', category: 'Staff Management', description: 'Update staff information' },
  { key: 'staff:delete', category: 'Staff Management', description: 'Delete staff members' },

  // User Management Permissions
  { key: 'users:create', category: 'User Management', description: 'Create new user accounts' },
  { key: 'users:read', category: 'User Management', description: 'View user information' },
  { key: 'users:update', category: 'User Management', description: 'Update user information' },
  { key: 'users:delete', category: 'User Management', description: 'Delete user accounts' },

  // Role Management Permissions
  { key: 'roles:create', category: 'Role Management', description: 'Create new roles' },
  { key: 'roles:read', category: 'Role Management', description: 'View roles' },
  { key: 'roles:update', category: 'Role Management', description: 'Update roles' },
  { key: 'roles:delete', category: 'Role Management', description: 'Delete roles' },

  // Permission Management Permissions
  { key: 'permissions:manage', category: 'Permission Management', description: 'Manage permissions' },

  // Form Management Permissions
  { key: 'forms:create', category: 'Form Management', description: 'Create new forms' },
  { key: 'forms:read', category: 'Form Management', description: 'View forms' },
  { key: 'forms:update', category: 'Form Management', description: 'Update forms' },
  { key: 'forms:delete', category: 'Form Management', description: 'Delete forms' },
  { key: 'forms:submit', category: 'Form Management', description: 'Submit forms' },

  // Report Management Permissions
  { key: 'reports:view', category: 'Report Management', description: 'View reports' },
  { key: 'reports:generate', category: 'Report Management', description: 'Generate reports' },

  // Attendance Management Permissions
  { key: 'attendance:record', category: 'Attendance Management', description: 'Record attendance' },
  { key: 'attendance:view', category: 'Attendance Management', description: 'View attendance records' },
  { key: 'attendance:manage', category: 'Attendance Management', description: 'Manage attendance records' },

  // Leave Management Permissions
  { key: 'leave:request', category: 'Leave Management', description: 'Request leave' },
  { key: 'leave:view', category: 'Leave Management', description: 'View leave records' },
  { key: 'leave:approve', category: 'Leave Management', description: 'Approve/reject leave requests' },
  { key: 'leave:read', category: 'Leave Management', description: 'View all leave requests (admin)' },
  { key: 'leave:create', category: 'Leave Management', description: 'Create leave requests' },
  { key: 'leave:update', category: 'Leave Management', description: 'Update leave requests' },
  { key: 'leave:delete', category: 'Leave Management', description: 'Delete leave requests' },

  // Leave Type Management Permissions
  { key: 'leave_type:read', category: 'Leave Management', description: 'View leave types' },

  // Leave Allocation Permissions
  { key: 'leave_allocation:read', category: 'Leave Management', description: 'View leave allocations' },
  { key: 'leave_allocation:create', category: 'Leave Management', description: 'Create leave allocations' },
  { key: 'leave_allocation:update', category: 'Leave Management', description: 'Update leave allocations' },
  { key: 'leave_allocation:delete', category: 'Leave Management', description: 'Delete leave allocations' },

  // Payroll Management Permissions
  { key: 'payroll:manage', category: 'Payroll Management', description: 'Manage payroll' },

  // KPI Management Permissions
  { key: 'kpi:manage', category: 'KPI Management', description: 'Manage KPIs' },

  // Performance Management Permissions
  { key: 'performance:review', category: 'Performance Management', description: 'Review performance' },

  // Branch Management Permissions
  { key: 'branches:create', category: 'Branch Management', description: 'Create new branches' },
  { key: 'branches:read', category: 'Branch Management', description: 'View branches' },
  { key: 'branches:update', category: 'Branch Management', description: 'Update branches' },
  { key: 'branches:delete', category: 'Branch Management', description: 'Delete branches' },

  // Department Management Permissions
  { key: 'departments:create', category: 'Department Management', description: 'Create new departments' },
  { key: 'departments:read', category: 'Department Management', description: 'View departments' },
  { key: 'departments:update', category: 'Department Management', description: 'Update departments' },
  { key: 'departments:delete', category: 'Department Management', description: 'Delete departments' },

  // Job Posting Management Permissions
  { key: 'job_posting:create', category: 'Job Posting Management', description: 'Create job postings' },
  { key: 'job_posting:read', category: 'Job Posting Management', description: 'View job postings' },
  { key: 'job_posting:update', category: 'Job Posting Management', description: 'Update job postings' },
  { key: 'job_posting:delete', category: 'Job Posting Management', description: 'Delete job postings' },

  // Job Application Management Permissions
  { key: 'job_application:create', category: 'Job Application Management', description: 'Create job applications' },
  { key: 'job_application:read', category: 'Job Application Management', description: 'View job applications' },
  { key: 'job_application:update', category: 'Job Application Management', description: 'Update job applications' },
  { key: 'job_application:delete', category: 'Job Application Management', description: 'Delete job applications' },
  { key: 'job_application:comment', category: 'Job Application Management', description: 'Comment on job applications' },

  // Document Management Permissions
  { key: 'documents:upload', category: 'Document Management', description: 'Upload documents' },
  { key: 'documents:download', category: 'Document Management', description: 'Download documents' },

  // Settings Management Permissions
  { key: 'settings:configure', category: 'Settings Management', description: 'Configure system settings' },

  // Audit Trail Permissions
  { key: 'audit:read', category: 'Audit Trail', description: 'View audit logs' },

  // Appraisal Template Permissions
  { key: 'appraisal_template:read', category: 'Appraisal Management', description: 'View appraisal templates' },
  { key: 'appraisal_template:create', category: 'Appraisal Management', description: 'Create appraisal templates' },
  { key: 'appraisal_template:update', category: 'Appraisal Management', description: 'Update appraisal templates' },
  { key: 'appraisal_template:delete', category: 'Appraisal Management', description: 'Delete appraisal templates' },

  // Metric Management Permissions
  { key: 'metric:read', category: 'Metric Management', description: 'View metrics' },
  { key: 'metric:create', category: 'Metric Management', description: 'Create metrics' },
  { key: 'metric:update', category: 'Metric Management', description: 'Update metrics' },
  { key: 'metric:delete', category: 'Metric Management', description: 'Delete metrics' },

  // KPI Management Permissions (Additional)
  { key: 'kpi:read', category: 'KPI Management', description: 'View KPIs' },
  { key: 'kpi:create', category: 'KPI Management', description: 'Create KPIs' },
  { key: 'kpi:update', category: 'KPI Management', description: 'Update KPIs' },
  { key: 'kpi:delete', category: 'KPI Management', description: 'Delete KPIs' },

  // Target Management Permissions
  { key: 'target:read', category: 'Target Management', description: 'View targets' },
  { key: 'target:create', category: 'Target Management', description: 'Create targets' },
  { key: 'target:update', category: 'Target Management', description: 'Update targets' },
  { key: 'target:delete', category: 'Target Management', description: 'Delete targets' },

  // Appraisal Management Permissions
  { key: 'appraisal:read', category: 'Appraisal Management', description: 'View appraisals' },
  { key: 'appraisal:create', category: 'Appraisal Management', description: 'Create appraisals' },
  { key: 'appraisal:update', category: 'Appraisal Management', description: 'Update appraisals' },
  { key: 'appraisal:submit', category: 'Appraisal Management', description: 'Submit appraisals' },

  // Performance Review Permissions
  { key: 'performance:read', category: 'Performance Management', description: 'View performance reviews' },

  // Employee Performance Permissions
  { key: 'employee_performance:read', category: 'Performance Management', description: 'View employee performance' },

  // KPI Assignment Permissions
  { key: 'kpi_assignment:read', category: 'KPI Management', description: 'View KPI assignments' },
  { key: 'kpi_assignment:create', category: 'KPI Management', description: 'Create KPI assignments' },
  { key: 'kpi_assignment:update', category: 'KPI Management', description: 'Update KPI assignments' },
  { key: 'kpi_assignment:delete', category: 'KPI Management', description: 'Delete KPI assignments' },

  // KPI Score Permissions
  { key: 'kpi_score:read', category: 'KPI Management', description: 'View KPI scores' },
  { key: 'kpi_score:create', category: 'KPI Management', description: 'Create KPI scores' },
  { key: 'kpi_score:update', category: 'KPI Management', description: 'Update KPI scores' },
  { key: 'kpi_score:delete', category: 'KPI Management', description: 'Delete KPI scores' },

  // Shift Management Permissions
  { key: 'shift:read', category: 'Shift Management', description: 'View shifts' },
  { key: 'shift:create', category: 'Shift Management', description: 'Create shifts' },
  { key: 'shift:update', category: 'Shift Management', description: 'Update shifts' },
  { key: 'shift:delete', category: 'Shift Management', description: 'Delete shifts' },

  // Shift Timing Permissions
  { key: 'shift_timing:read', category: 'Shift Management', description: 'View shift timings' },
  { key: 'shift_timing:create', category: 'Shift Management', description: 'Create shift timings' },
  { key: 'shift_timing:update', category: 'Shift Management', description: 'Update shift timings' },
  { key: 'shift_timing:delete', category: 'Shift Management', description: 'Delete shift timings' },

  // Shift Template Permissions
  { key: 'shift_template:read', category: 'Shift Management', description: 'View shift templates' },
  { key: 'shift_template:create', category: 'Shift Management', description: 'Create shift templates' },
  { key: 'shift_template:update', category: 'Shift Management', description: 'Update shift templates' },
  { key: 'shift_template:delete', category: 'Shift Management', description: 'Delete shift templates' },

  // Employee Shift Assignment Permissions
  { key: 'employee_shift_assignment:read', category: 'Shift Management', description: 'View employee shift assignments' },
  { key: 'employee_shift_assignment:create', category: 'Shift Management', description: 'Create employee shift assignments' },
  { key: 'employee_shift_assignment:update', category: 'Shift Management', description: 'Update employee shift assignments' },
  { key: 'employee_shift_assignment:delete', category: 'Shift Management', description: 'Delete employee shift assignments' },

  // Schedule Request Permissions
  { key: 'schedule_request:approve', category: 'Shift Management', description: 'Approve schedule requests' },
  { key: 'schedule_request:reject', category: 'Shift Management', description: 'Reject schedule requests' },

  // Time Off Bank Permissions
  { key: 'time_off_bank:create', category: 'Shift Management', description: 'Create time off banks' },
  { key: 'time_off_bank:read', category: 'Shift Management', description: 'View time off banks' },
  { key: 'time_off_bank:update', category: 'Shift Management', description: 'Update time off banks' },
  { key: 'time_off_bank:delete', category: 'Shift Management', description: 'Delete time off banks' },

  // Form Submission Permissions
  { key: 'form_submission:read', category: 'Form Management', description: 'View form submissions' },
  { key: 'form_submission:create', category: 'Form Management', description: 'Create form submissions' },
  { key: 'form_submission:update', category: 'Form Management', description: 'Update form submissions' },
  { key: 'form_submission:delete', category: 'Form Management', description: 'Delete form submissions' },

  // Payment Type Permissions
  { key: 'payment_type:read', category: 'Payment Management', description: 'View payment types' },
  { key: 'payment_type:create', category: 'Payment Management', description: 'Create payment types' },
  { key: 'payment_type:update', category: 'Payment Management', description: 'Update payment types' },
  { key: 'payment_type:delete', category: 'Payment Management', description: 'Delete payment types' },

  // Staff Payment Structure Permissions
  { key: 'staff_payment_structure:read', category: 'Payment Management', description: 'View staff payment structures' },
  { key: 'staff_payment_structure:create', category: 'Payment Management', description: 'Create staff payment structures' },
  { key: 'staff_payment_structure:update', category: 'Payment Management', description: 'Update staff payment structures' },
  { key: 'staff_payment_structure:delete', category: 'Payment Management', description: 'Delete staff payment structures' },

  // Payroll Run Permissions
  { key: 'payroll_run:read', category: 'Payroll Management', description: 'View payroll runs' },
  { key: 'payroll_run:create', category: 'Payroll Management', description: 'Create payroll runs' },
  { key: 'payroll_run:update', category: 'Payroll Management', description: 'Update payroll runs' },
  { key: 'payroll_run:delete', category: 'Payroll Management', description: 'Delete payroll runs' },
  { key: 'payroll_run:execute', category: 'Payroll Management', description: 'Execute payroll runs' },

  // Payroll Record Permissions
  { key: 'payroll_record:read', category: 'Payroll Management', description: 'View payroll records' },
  { key: 'payroll_record:create', category: 'Payroll Management', description: 'Create payroll records' },
  { key: 'payroll_record:update', category: 'Payroll Management', description: 'Update payroll records' },
  { key: 'payroll_record:delete', category: 'Payroll Management', description: 'Delete payroll records' },

  // Attendance Location Permissions
  { key: 'attendance_location:read', category: 'Attendance Management', description: 'View attendance locations' },
  { key: 'attendance_location:create', category: 'Attendance Management', description: 'Create attendance locations' },
  { key: 'attendance_location:update', category: 'Attendance Management', description: 'Update attendance locations' },
  { key: 'attendance_location:delete', category: 'Attendance Management', description: 'Delete attendance locations' },

  // API Key Permissions
  { key: 'api_key:read', category: 'System Management', description: 'View API keys' },
  { key: 'api_key:create', category: 'System Management', description: 'Create API keys' },
  { key: 'api_key:update', category: 'System Management', description: 'Update API keys' },
  { key: 'api_key:delete', category: 'System Management', description: 'Delete API keys' },

  // Report Template Permissions
  { key: 'report_template:read', category: 'Report Management', description: 'View report templates' },
  { key: 'report_template:create', category: 'Report Management', description: 'Create report templates' },
  { key: 'report_template:update', category: 'Report Management', description: 'Update report templates' },
  { key: 'report_template:delete', category: 'Report Management', description: 'Delete report templates' },

  // Scheduled Report Permissions
  { key: 'scheduled_report:read', category: 'Report Management', description: 'View scheduled reports' },
  { key: 'scheduled_report:create', category: 'Report Management', description: 'Create scheduled reports' },
  { key: 'scheduled_report:update', category: 'Report Management', description: 'Update scheduled reports' },
  { key: 'scheduled_report:delete', category: 'Report Management', description: 'Delete scheduled reports' },

  // Analytics Permissions
  { key: 'analytics:read', category: 'Analytics Management', description: 'View analytics' },
];

// Get permissions by category
export const getPermissionsByCategory = (category: string): PermissionDefinition[] => {
  return PERMISSION_DEFINITIONS.filter(permission => permission.category === category);
};

// Get all unique categories
export const getAllPermissionCategories = (): string[] => {
  const categories = new Set(PERMISSION_DEFINITIONS.map(p => p.category));
  return Array.from(categories).sort();
};

// Validate if a permission exists in the system
export const isValidPermission = (permission: string): boolean => {
  return PERMISSION_DEFINITIONS.some(p => p.key === permission);
};

// Get permission by key
export const getPermissionByKey = (key: string): PermissionDefinition | undefined => {
  return PERMISSION_DEFINITIONS.find(p => p.key === key);
};