# Frontend Integration Guide for HR Management System

## Overview
This guide will walk you through integrating the frontend with the HR Management System backend. The system provides a comprehensive API for managing employees, leave requests, attendance, payroll, and more.

## Prerequisites
- Basic knowledge of JavaScript/TypeScript
- Understanding of React (for UI components)
- Familiarity with REST APIs and HTTP requests
- Knowledge of JWT authentication

## Backend API Structure
The backend provides RESTful endpoints under the `/api/` path:
- Authentication: `/api/auth/login`, `/api/auth/logout`, `/api/auth/refresh`
- Leave Management: `/api/leave`, `/api/leave-types`
- Employee Management: `/api/staff`
- Attendance: `/api/attendance`
- Payroll: `/api/payroll`
- Forms: `/api/forms`, `/api/form-submissions`

## Frontend Architecture

### 1. API Service Layer
The API service layer handles all communication with the backend. It manages:
- HTTP requests (GET, POST, PUT, DELETE)
- Authentication headers
- Error handling
- Token refresh

### 2. Authentication Context
Manages user authentication state, including:
- Login/logout functionality
- JWT token storage
- Permission checking
- Session management

### 3. Components
React components that consume the API service and display data to users.

## Step-by-Step Implementation

### Step 1: Create API Service
Create a service file to handle all API communications.

### Step 2: Implement Authentication Context
Set up authentication state management.

### Step 3: Create Components
Build UI components that interact with the API service.

### Step 4: Handle Errors and Notifications
Implement proper error handling and user feedback.

## Example: Leave Request Feature
Let's walk through implementing the leave request feature as an example:

1. User fills out a leave request form
2. Component calls API service to submit the request
3. API service sends request to `/api/leave` endpoint
4. Backend validates and stores the request
5. Component receives response and updates UI

## Environment Configuration
Make sure to configure your frontend to connect to the correct backend URL:

```env
REACT_APP_API_URL=http://localhost:3001/api  # Development
REACT_APP_API_URL=https://yourdomain.com/api # Production
```

## Security Considerations
- Store JWT tokens securely (preferably in httpOnly cookies or secure localStorage)
- Implement proper error handling to prevent exposing sensitive information
- Use HTTPS in production
- Implement rate limiting on the frontend for better UX

## Testing
- Test all API endpoints with valid and invalid inputs
- Verify authentication flows work correctly
- Test error handling scenarios
- Ensure proper permission checks are in place

## Common Patterns Used in the Backend

### Authentication Headers
All protected endpoints require the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Response Format
The backend returns consistent response structures:
```json
{
  "success": true/false,
  "message": "Human-readable message",
  "data": { /* payload */ }
}
```

### Query Parameters
Many endpoints support filtering and pagination:
- `?limit=20&page=1` for pagination
- `?status=pending` for filtering
- `?sort=created_at&order=desc` for sorting

## Next Steps
After implementing the basic integration:
1. Create reusable components for common UI elements
2. Implement role-based UI rendering
3. Add loading states and skeleton screens
4. Implement offline capabilities if needed
5. Add comprehensive error boundaries