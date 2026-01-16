# User Registration & Onboarding Flow

## Overview
This document describes the complete process for adding new users to the HR Management System, from initial registration to full system access with appropriate permissions.

## User Types & Roles

### 1. System Roles
- **Super Admin**: Full system access (typically 1 user)
- **HR Manager**: Full HR functionality access
- **Department Manager**: Access to manage their department staff
- **Employee**: Basic access to personal information and self-service features
- **Finance**: Payroll and financial operations access

### 2. Employee Categories
- **Teacher**: Education sector employees
- **Sales**: Sales representatives and executives
- **Inventory**: Inventory and warehouse staff
- **Technician**: Technical and maintenance staff

## User Addition Process

### Method 1: Admin-Initiated Registration (Recommended)

#### Step 1: Create Staff Profile
1. **Navigate to**: Staff Management → Add New Staff
2. **Enter Details**:
   - Personal Information (name, email, phone)
   - Employment Details (employee ID, designation, department, branch)
   - Position Information (role, employment type, joining date)
   - Emergency Contacts
   - Bank Details (for payroll)

#### Step 2: Assign Role & Permissions
1. **Select Role**: Choose appropriate role from dropdown
2. **Custom Permissions**: Add any role-specific permissions if needed
3. **Department Assignment**: Link to appropriate department
4. **Branch Assignment**: Assign to specific branch if applicable

#### Step 3: System Generates User Account
- **Email Address**: Used as username
- **Temporary Password**: Generated automatically
- **Account Status**: Created as 'inactive' initially

#### Step 4: Send Welcome Notification
- **Email Sent**: Welcome email with temporary credentials
- **Instructions**: How to activate account and set new password
- **First Login**: Required within 7 days of account creation

### Method 2: Self-Registration (Limited)

#### Step 1: Access Registration Page
- **URL**: `/register` or invitation link
- **Required Info**: Email, basic personal details
- **Verification**: Email verification required

#### Step 2: HR Approval Process
- **Pending Status**: Account remains pending until HR approval
- **Notification**: HR receives notification of pending registration
- **Review**: HR reviews and approves/rejects registration

## Complete User Addition Workflow

### 1. Initial Staff Creation
```
HR Admin → Staff Management → Add Staff → Enter Details → Save
```

### 2. Role Assignment
```
System → Auto-create User Account → Assign Role → Set Permissions
```

### 3. Account Activation
```
Email Notification → User Receives Credentials → First Login → Password Reset
```

### 4. Profile Completion
```
User Login → Complete Profile → Upload Documents → Set Preferences
```

## API Endpoints for User Management

### Creating New Staff
```http
POST /api/staff
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "user": {
    "email": "john.doe@company.com",
    "full_name": "John Doe",
    "phone": "+1234567890"
  },
  "staff_details": {
    "employee_id": "EMP001",
    "designation": "Software Engineer",
    "department": "Engineering",
    "branch_id": 1,
    "joining_date": "2024-01-15",
    "employment_type": "full_time"
  },
  "role_id": 4,  // Employee role
  "permissions": []  // Additional specific permissions if needed
}
```

### Assigning Permissions to Role
```http
POST /api/roles/{roleId}/permissions
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "permissions": [
    "staff.read",
    "leave.apply",
    "attendance.record",
    "appraisal.view",
    "documents.upload"
  ]
}
```

### Batch Assignment of KPIs/Targets
```http
POST /api/kpis/batch-assign
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "employee_ids": [1, 2, 3, 4, 5],
  "kpi_ids": [1, 2, 3],
  "cycle_start_date": "2024-01-01",
  "cycle_end_date": "2024-12-31"
}
```

## Permissions System

### Default Permissions by Role

#### Super Admin
- All system permissions
- Can manage all users, roles, and permissions
- Full access to all modules

#### HR Manager
- `staff.*` (all staff operations)
- `leave.*` (all leave operations)
- `attendance.*` (all attendance operations)
- `appraisal.*` (all appraisal operations)
- `payroll.*` (all payroll operations)

#### Department Manager
- `staff.read` (read staff in their department)
- `leave.approve` (approve leaves for their team)
- `attendance.view` (view attendance for their team)
- `appraisal.create` (create appraisals for their team)
- `reports.view` (view reports for their department)

#### Employee
- `staff.read_own` (view own profile)
- `leave.apply` (apply for leave)
- `attendance.record` (record own attendance)
- `appraisal.view_own` (view own appraisals)
- `documents.upload_own` (upload own documents)

## Appraisal Integration

### Automatic KPI Assignment
When a new employee is added to a department/category, the system automatically:
1. Identifies the employee's category (Teacher, Sales, Inventory, Technician)
2. Matches with appropriate appraisal template
3. Assigns relevant KPIs based on role
4. Sets up targets based on department standards
5. Creates self-assessment opportunities

### Example: Adding a New Sales Employee
1. **Create Staff Profile**: Enter sales rep details
2. **Assign Role**: Set as "Employee" with sales-specific permissions
3. **Auto-Assignment**: System assigns sales-specific KPIs:
   - Sales Target Achievement
   - Customer Satisfaction Score
   - Lead Conversion Rate
   - Territory Coverage
4. **Set Targets**: Based on sales department standards
5. **Enable Self-Assessment**: For sales performance review

## Security Considerations

### 1. Password Security
- Minimum 8 characters with complexity requirements
- Automatic password expiration (every 90 days)
- Password history (last 5 passwords cannot be reused)

### 2. Account Security
- Two-factor authentication (optional)
- Session timeout after inactivity
- IP-based access restrictions (optional)

### 3. Role-Based Access Control
- Principle of least privilege
- Regular permission audits
- Temporary permission escalation when needed

## Best Practices

### 1. For HR Administrators
- Verify all personal information before creating accounts
- Assign appropriate roles based on job responsibilities
- Regularly review and update user permissions
- Monitor account activity for security

### 2. For New Users
- Complete profile information promptly
- Update contact information when changed
- Participate in required training modules
- Regularly check system notifications

### 3. For Department Managers
- Review team member access regularly
- Ensure proper KPI assignments for team members
- Monitor team performance metrics
- Facilitate appraisal processes

## Troubleshooting

### Common Issues
1. **User cannot login**: Check account status and password reset
2. **Missing permissions**: Verify role assignment and custom permissions
3. **KPIs not appearing**: Check category assignment and template mapping
4. **Email notifications not received**: Verify email address and spam folder

### Resolution Steps
1. Check user account status in database
2. Verify role and permission assignments
3. Confirm email address validity
4. Test notification system functionality

## Automation Features

### 1. Welcome Email Automation
- Triggered when staff account is created
- Includes temporary credentials
- Provides first-time login instructions

### 2. Permission Sync
- Automatically updates permissions when role changes
- Maintains audit trail of permission changes
- Sends notifications for permission updates

### 3. KPI Assignment Automation
- Automatically assigns relevant KPIs based on employee category
- Sets up appropriate targets and timelines
- Enables self-assessment workflows

This comprehensive user addition flow ensures that new users are properly onboarded with appropriate access levels, relevant KPIs, and clear instructions for using the system effectively.