# Staff PWA API Documentation

## Overview
This document outlines the API endpoints that the Staff PWA will interact with to provide core HR functionalities to employees. The PWA enables staff to perform essential tasks like attendance marking, leave requests, shift scheduling, and profile management.

## Authentication
All protected endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## API Endpoints

### 1. Authentication

#### POST /api/auth/login
**Description:** Authenticate staff member and obtain JWT token

**Request Body:**
```json
{
  "email": "staff@example.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token",
    "user": {
      "id": 1,
      "email": "staff@example.com",
      "full_name": "John Doe",
      "role_id": 4,
      "branch_id": 1
    },
    "permissions": {
      "attendance:record": true,
      "leave:request": true,
      "staff:read": true
    }
  }
}
```

**User Story:** As a staff member, I want to securely log into the system so that I can access my HR features and perform daily tasks.

---

### 2. Attendance

#### POST /api/attendance
**Description:** Mark attendance (clock in/out)

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "status": "clock_in" // or "clock_out"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Attendance marked successfully",
  "data": {
    "attendance": {
      "id": 123,
      "user_id": 1,
      "date": "2024-01-15",
      "clock_in": "2024-01-15T08:30:00Z",
      "clock_out": null,
      "status": "present"
    }
  }
}
```

**User Story:** As a staff member, I want to clock in and out of work so that my attendance is recorded accurately for payroll and compliance purposes.

#### GET /api/attendance
**Description:** Get attendance records for the authenticated user

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `startDate` (optional): Start date for filtering
- `endDate` (optional): End date for filtering
- `limit` (optional): Number of records to return (default: 20)
- `page` (optional): Page number (default: 1)

**Response:**
```json
{
  "success": true,
  "message": "Attendance records retrieved successfully",
  "data": {
    "attendance": [
      {
        "id": 123,
        "date": "2024-01-15",
        "clock_in": "2024-01-15T08:30:00Z",
        "clock_out": "2024-01-15T17:00:00Z",
        "status": "present",
        "hours_worked": 8.5
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "itemsPerPage": 20
    }
  }
}
```

**User Story:** As a staff member, I want to view my attendance history so that I can verify my work hours and ensure accuracy.

---

### 3. Shift Management

#### GET /api/attendance/shift-timings
**Description:** Get shift timing information for the authenticated user

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Shift timings retrieved successfully",
  "data": {
    "shiftTimings": [
      {
        "id": 1,
        "user_id": 1,
        "shift_name": "Standard Office Hours",
        "start_time": "09:00:00",
        "end_time": "17:00:00",
        "effective_from": "2026-01-01",
        "effective_to": "2026-12-31"
      }
    ]
  }
}
```

**User Story:** As a staff member, I want to view my assigned shift timings so that I know my work schedule.

#### GET /api/shift-scheduling/shift-templates
**Description:** Get available shift templates

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Shift templates retrieved successfully",
  "data": {
    "shiftTemplates": [
      {
        "id": 1,
        "name": "Standard Office Hours",
        "description": "Standard office working hours",
        "start_time": "09:00:00",
        "end_time": "17:00:00",
        "break_duration_minutes": 60,
        "recurrence_pattern": "weekly",
        "recurrence_days": ["monday", "tuesday", "wednesday", "thursday", "friday"]
      }
    ]
  }
}
```

**User Story:** As a staff member, I want to see available shift templates so that I understand different work schedule options.

#### GET /api/shift-scheduling/employee-shift-assignments
**Description:** Get employee shift assignments

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Employee shift assignments retrieved successfully",
  "data": {
    "employeeShiftAssignments": [
      {
        "id": 1,
        "user_id": 1,
        "shift_template_id": 1,
        "effective_from": "2026-01-01",
        "effective_to": "2026-12-31",
        "notes": "Standard shift assignment",
        "created_at": "2026-01-01T00:00:00Z"
      }
    ]
  }
}
```

**User Story:** As a staff member, I want to view my shift assignments so that I know my current work schedule.

#### POST /api/shift-scheduling/schedule-requests
**Description:** Submit a schedule request (time off, shift change, etc.)

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "request_type": "time_off_request",
  "request_subtype": "compensatory_time_use",
  "requested_date": "2026-02-01",
  "requested_duration_days": 1,
  "reason": "Using compensatory time for Sunday work",
  "scheduled_for": "2026-02-01"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Schedule request submitted successfully",
  "data": {
    "scheduleRequest": {
      "id": 1,
      "user_id": 1,
      "request_type": "time_off_request",
      "request_subtype": "compensatory_time_use",
      "requested_date": "2026-02-01",
      "requested_duration_days": 1,
      "reason": "Using compensatory time for Sunday work",
      "status": "pending",
      "created_at": "2026-01-15T10:00:00Z"
    }
  }
}
```

**User Story:** As a staff member, I want to submit schedule requests so that I can request time off or schedule changes.

#### GET /api/shift-scheduling/time-off-banks/my-balance
**Description:** Get my time off bank balance

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Time off bank balance retrieved successfully",
  "data": {
    "timeOffBanks": [
      {
        "id": 1,
        "user_id": 1,
        "program_name": "Sunday Compensatory Time",
        "description": "Time off bank for employees who worked on Sundays",
        "total_entitled_days": 5,
        "used_days": 0,
        "remaining_days": 5,
        "valid_from": "2026-01-01",
        "valid_to": "2026-12-31"
      }
    ]
  }
}
```

**User Story:** As a staff member, I want to check my time off bank balance so that I know how much compensatory time I have available.

---

### 4. Holidays

#### GET /api/attendance/holidays
**Description:** Get holiday information

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `branchId` (optional): Filter by branch
- `date` (optional): Filter by specific date
- `startDate` (optional): Start date for range filter
- `endDate` (optional): End date for range filter

**Response:**
```json
{
  "success": true,
  "message": "Holidays retrieved successfully",
  "data": {
    "holidays": [
      {
        "id": 1,
        "holiday_name": "New Year",
        "date": "2026-01-01T00:00:00.000Z",
        "branch_id": 1,
        "is_mandatory": true,
        "description": "New Year Holiday",
        "created_by": 1,
        "created_at": "2026-01-01T00:00:00.000Z",
        "updated_at": "2026-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

**User Story:** As a staff member, I want to view upcoming holidays so that I can plan my time off accordingly.

---

### 5. Leave Management

#### GET /api/leave/types
**Description:** Get all available leave types

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Leave types retrieved successfully",
  "data": {
    "leaveTypes": [
      {
        "id": 1,
        "name": "Annual Leave",
        "description": "Annual vacation days",
        "days_per_year": 21,
        "is_paid": true,
        "allow_carryover": true,
        "carryover_limit": 5,
        "expiry_rule_id": 1,
        "created_by": 1,
        "is_active": true,
        "created_at": "2026-01-01T00:00:00.000Z",
        "updated_at": "2026-01-01T00:00:00.000Z"
      },
      {
        "id": 2,
        "name": "Sick Leave",
        "description": "Medical leave for illness",
        "days_per_year": 14,
        "is_paid": true,
        "allow_carryover": false,
        "carryover_limit": 0,
        "expiry_rule_id": 1,
        "created_by": 1,
        "is_active": true,
        "created_at": "2026-01-01T00:00:00.000Z",
        "updated_at": "2026-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

**User Story:** As a staff member, I want to see all available leave types and their allowances so that I can plan my time off appropriately.

#### GET /api/leave
**Description:** Get leave requests for the authenticated user

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `status` (optional): Filter by status (pending/approved/rejected)
- `limit` (optional): Number of records to return (default: 20)
- `page` (optional): Page number (default: 1)

**Response:**
```json
{
  "success": true,
  "message": "Leave requests retrieved successfully",
  "data": {
    "leaveRequests": [
      {
        "id": 456,
        "user_id": 1,
        "leave_type_id": 1,
        "start_date": "2024-02-01",
        "end_date": "2024-02-05",
        "reason": "Family vacation",
        "status": "approved",
        "days_requested": 5,
        "submitted_at": "2024-01-10T10:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "itemsPerPage": 20
    }
  }
}
```

**User Story:** As a staff member, I want to view my leave request history so that I can track the status of my applications.

#### POST /api/leave
**Description:** Submit a new leave request

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "leave_type_id": 1,
  "start_date": "2024-02-01",
  "end_date": "2024-02-05",
  "reason": "Family vacation",
  "attachments": [] // Optional array of file IDs
}
```

**Response:**
```json
{
  "success": true,
  "message": "Leave request submitted successfully",
  "data": {
    "leaveRequest": {
      "id": 456,
      "user_id": 1,
      "leave_type_id": 1,
      "start_date": "2024-02-01",
      "end_date": "2024-02-05",
      "reason": "Family vacation",
      "status": "submitted",
      "days_requested": 5,
      "submitted_at": "2024-01-10T10:00:00Z"
    }
  }
}
```

**User Story:** As a staff member, I want to submit a leave request so that I can take time off while following company procedures.

---

### 6. Staff Profile

#### GET /api/staff/{id}
**Description:** Get staff profile information

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Staff information retrieved successfully",
  "data": {
    "staff": {
      "id": 1,
      "user_id": 1,
      "full_name": "John Doe",
      "email": "john.doe@company.com",
      "phone": "+1234567890",
      "designation": "Software Engineer",
      "department": "Engineering",
      "branch": "Main Office",
      "date_joined": "2023-01-15",
      "status": "active",
      "profile_picture": "https://example.com/profile.jpg"
    }
  }
}
```

**User Story:** As a staff member, I want to view my profile information so that I can verify my details and keep them up to date.

#### PUT /api/staff/{id}
**Description:** Update staff profile information

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "phone": "+1987654321",
  "address": "New Address Line",
  "emergency_contact": "+1123456789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Staff information updated successfully",
  "data": {
    "staff": {
      "id": 1,
      "user_id": 1,
      "full_name": "John Doe",
      "email": "john.doe@company.com",
      "phone": "+1987654321",
      "designation": "Software Engineer",
      "department": "Engineering",
      "branch": "Main Office",
      "date_joined": "2023-01-15",
      "status": "active"
    }
  }
}
```

**User Story:** As a staff member, I want to update my personal information so that my records remain accurate.

---

### 7. User Management

#### PUT /api/users/{id}/password-change
**Description:** Change user password

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "current_password": "old_password",
  "new_password": "new_secure_password",
  "confirm_new_password": "new_secure_password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**User Story:** As a staff member, I want to change my password so that my account remains secure.

---

### 8. Notifications

#### GET /api/notifications
**Description:** Get notifications for the authenticated user

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `limit` (optional): Number of records to return (default: 20)
- `page` (optional): Page number (default: 1)
- `unread_only` (optional): Only return unread notifications (true/false)

**Response:**
```json
{
  "success": true,
  "message": "Notifications retrieved successfully",
  "data": {
    "notifications": [
      {
        "id": 789,
        "title": "Leave Request Approved",
        "message": "Your leave request for Feb 1-5 has been approved",
        "type": "leave",
        "is_read": false,
        "created_at": "2024-01-10T12:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "itemsPerPage": 20
    }
  }
}
```

**User Story:** As a staff member, I want to receive notifications about important updates so that I stay informed about my requests and company news.

---

### 9. Forms

#### GET /api/forms
**Description:** Get available forms for staff

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Forms retrieved successfully",
  "data": {
    "forms": [
      {
        "id": 1,
        "name": "Expense Claim",
        "description": "Submit expense claims for reimbursement",
        "category": "Finance",
        "is_active": true
      },
      {
        "id": 2,
        "name": "Training Request",
        "description": "Request for training opportunities",
        "category": "Development",
        "is_active": true
      }
    ]
  }
}
```

**User Story:** As a staff member, I want to access company forms so that I can submit requests and claims efficiently.

---

### 10. Performance & Appraisals

#### GET /api/performance/employee/{employeeId}
**Description:** Get performance data for specific employee

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Performance data retrieved successfully",
  "data": {
    "performanceScores": [
      {
        "id": 1,
        "employee_id": 1,
        "kpi_id": 1,
        "template_id": 1,
        "score": 4.5,
        "achieved_value": 95,
        "period_start": "2024-01-01",
        "period_end": "2024-12-31",
        "calculated_by": 1,
        "calculated_at": "2024-01-15T10:00:00Z"
      }
    ]
  }
}
```

**User Story:** As a staff member, I want to view my performance scores so that I can track my progress and achievements.

#### GET /api/appraisals
**Description:** Get appraisal cycles for the employee

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Appraisal cycles retrieved successfully",
  "data": {
    "appraisals": [
      {
        "id": 1,
        "name": "Annual Performance Review 2024",
        "description": "Annual performance evaluation",
        "template_id": 1,
        "start_date": "2024-01-01",
        "end_date": "2024-12-31",
        "status": "active",
        "created_by": 1,
        "created_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

**User Story:** As a staff member, I want to see my appraisal cycles so that I can participate in performance reviews.

---

### 11. Targets & Goals

#### GET /api/targets/employee/{employeeId}
**Description:** Get targets for specific employee

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Targets retrieved successfully",
  "data": {
    "targets": [
      {
        "id": 1,
        "kpi_id": 1,
        "employee_id": 1,
        "department_id": 1,
        "template_id": 1,
        "target_type": "standard",
        "target_value": 95,
        "period_start": "2024-01-01",
        "period_end": "2024-12-31",
        "created_by": 1,
        "created_at": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

**User Story:** As a staff member, I want to view my targets so that I can work toward achieving my goals.

---

## Error Handling

All API endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "type": "ValidationError",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

## Common HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Security Considerations
- All sensitive data is transmitted over HTTPS
- JWT tokens should be stored securely and have appropriate expiration times
- Input validation is performed on all endpoints
- Rate limiting is implemented to prevent abuse

## PWA-Specific Considerations
- The API supports offline functionality where appropriate
- Endpoints are optimized for mobile network conditions
- Caching strategies are implemented for improved performance