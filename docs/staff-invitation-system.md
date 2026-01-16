# Staff Invitation System with cPanel Integration

## Overview
The HR Management System includes a comprehensive staff invitation system that integrates with cPanel to automatically create professional email accounts for new employees. This system streamlines the onboarding process by automating email account creation and sending welcome emails with login credentials.

## Features

### 1. cPanel Integration
- Automated email account creation via cPanel UAPI
- Configurable domain support (no hardcoded values)
- Automatic email removal when staff accounts are deactivated
- Support for email quotas and other cPanel features

### 2. Secure Onboarding Workflow
- Generates strong temporary passwords (12+ characters with mixed case, numbers, symbols)
- Forces password change on first login
- Domain-restricted login (only company domain emails allowed)
- Role and branch assignment during invitation

### 3. Email Management
- Welcome emails sent to personal email addresses with work credentials
- Automatic cleanup when staff accounts are terminated
- Resend integration for reliable email delivery

## API Endpoints

### Invite New Staff
- **Endpoint**: `POST /api/staff-invitation/invite`
- **Requires Authentication**: Yes (Admin or HR role)
- **Request Body**:
  ```json
  {
    "firstName": "string",
    "lastName": "string", 
    "personalEmail": "string", // Email to send welcome message to
    "roleId": "number",       // Role ID for the new user
    "branchId": "number"      // Branch ID (optional)
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Staff member invited successfully",
    "data": {
      "workEmail": "generated-work-email@company-domain.com"
    }
  }
  ```

### Deactivate Staff (with email removal)
- **Endpoint**: `DELETE /api/staff-invitation/:id`
- **Requires Authentication**: Yes (Admin or HR role)
- **Query Parameters**: 
  - `removeEmail=true` (optional, defaults to true)
- **Response**:
  ```json
  {
    "success": true,
    "message": "Staff member deactivated successfully and email account removed from cPanel"
  }
  ```

## Configuration

### Environment Variables
The system uses the following environment variables for configuration:

```env
# cPanel Configuration
CPANEL_HOST=your-cpanel-host.com
CPANEL_USERNAME=your-cpanel-username
CPANEL_API_TOKEN=your-cpanel-api-token
CPANEL_EMAIL_QUOTA=500  # in MB, 0 for unlimited
CPANEL_DOMAIN=your-company-domain.com
```

### Domain Flexibility
The system is designed to work with any company domain by simply changing the `CPANEL_DOMAIN` environment variable. No code changes are required when deploying to different companies.

## Security Features

### 1. Authentication & Authorization
- JWT-based authentication with access and refresh tokens
- Role-based access control
- Session management

### 2. Password Security
- Strong password generation (12+ characters with mixed case, numbers, symbols)
- Password hashing with bcrypt
- Mandatory password change on first login

### 3. Data Validation
- Input validation for all fields
- Domain verification before email operations
- SQL injection prevention via parameterized queries

## Onboarding Workflow

### 1. Staff Invitation Process
1. HR admin enters new staff details (first name, last name, personal email, role, branch)
2. System generates work email address (e.g., `firstname.lastname@company.com`)
3. System creates strong temporary password
4. System creates email account in cPanel
5. System creates user account in database with `must_change_password = true`
6. System sends welcome email to personal email with work credentials

### 2. New Employee Experience
1. Employee receives welcome email with work email and temporary password
2. Employee downloads company app
3. Employee logs in with provided credentials
4. System forces password change on first login
5. Employee sets permanent password and begins using the system

### 3. Staff Deactivation Process
1. HR admin deactivates staff account
2. System optionally removes email account from cPanel
3. User account is marked as terminated in database

## Error Handling

The system includes comprehensive error handling:
- Graceful degradation if cPanel API is unavailable
- Detailed error messages for debugging
- Proper cleanup if any step fails
- Logging for audit trails

## Integration Points

### cPanel UAPI Endpoints Used
- `Email/add_pop` - Create email account
- `Email/delete_pop` - Delete email account
- `Email/list_pops` - List email accounts
- `Email/passwd_pop` - Change email password

### External Services
- Resend API for email delivery
- MySQL database for user management
- JWT for authentication

## Development Notes

### Files Added/Modified
- `src/services/cpanel-email.service.ts` - cPanel API integration
- `src/services/staff-invitation.service.ts` - Invitation business logic
- `src/controllers/staff-invitation.controller.ts` - API endpoints
- `src/api/staff-invitation.route.ts` - Route definitions
- `src/middleware/company-email.middleware.ts` - Domain restriction middleware
- `src/models/user.model.ts` - Updated with `must_change_password` field
- `migrations/029_add_must_change_password_to_users.sql` - Database migration

### Database Changes
- Added `must_change_password` column to `users` table
- Column is BOOLEAN type with default FALSE

## Testing
The system has been tested with:
- Successful invitation of new staff members
- Automatic email account creation in cPanel
- Welcome email delivery
- Password change enforcement
- Email account removal during deactivation
- Domain restriction enforcement