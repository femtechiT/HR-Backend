# HR Admin Dashboard Screens Documentation

This documentation provides an overview of all HR admin dashboard screens and how the frontend and backend components work together.

## Directory Structure
```
screens/
├── attendance.md          # Attendance management screen
├── leave-management.md    # Leave management screen
├── employee-management.md # Employee management screen
├── payroll-management.md  # Payroll management screen
└── index.md              # This file - main documentation
```

## Overview

The HR Admin Dashboard consists of multiple interconnected screens that allow HR administrators to manage various aspects of the organization. Each screen follows a consistent pattern of frontend-backend integration.

## Common Frontend Components

### 1. Authentication Context (`src/frontend/AuthContext.tsx`)
- Manages user authentication state
- Handles JWT token storage and retrieval
- Provides permission checking utilities

### 2. API Service (`src/frontend/api-service.ts`)
- Centralized API communication layer
- Handles authentication headers
- Provides methods for all backend endpoints
- Implements error handling and response parsing

### 3. Layout Component (`src/frontend/Layout.tsx`)
- Consistent navigation across all screens
- Role-based menu item rendering
- User profile and logout functionality

## Backend API Structure

### Authentication & Authorization
- All protected endpoints require JWT authentication
- Role-based permissions control access to different features
- Standard response format: `{ success, message, data }`

### Key Endpoints
- `/api/auth/*` - Authentication management
- `/api/staff/*` - Employee management
- `/api/attendance/*` - Attendance tracking
- `/api/leave/*` - Leave management
- `/api/payroll/*` - Payroll processing

## Integration Pattern

Each screen follows this common integration pattern:

### 1. Data Fetching
- Frontend components call API service methods
- API service adds authentication headers
- Backend validates permissions and returns data

### 2. Data Manipulation
- Frontend collects user input and validates locally
- API service sends data to backend
- Backend validates, processes, and returns results

### 3. Error Handling
- Frontend displays user-friendly error messages
- Backend returns standardized error responses
- Logging occurs on both ends for debugging

## How Frontend and Backend Fit Together

### Frontend Responsibilities
1. **UI/UX**: Present data in an intuitive, user-friendly interface
2. **Validation**: Perform client-side validation before sending requests
3. **State Management**: Manage component state and user interactions
4. **Authentication**: Handle login/logout and maintain session state
5. **Permissions**: Check user permissions before allowing actions

### Backend Responsibilities
1. **Data Storage**: Securely store and retrieve data from the database
2. **Business Logic**: Implement complex business rules and calculations
3. **Security**: Authenticate users and authorize actions
4. **Validation**: Server-side validation to ensure data integrity
5. **API**: Provide consistent, well-documented endpoints

### Communication Flow
1. User interacts with frontend component
2. Frontend validates input and calls API service
3. API service adds authentication and sends request to backend
4. Backend authenticates user and validates permissions
5. Backend processes request and accesses database
6. Backend returns standardized response
7. Frontend handles response and updates UI accordingly

## Best Practices

### For Frontend Development
- Use the existing `apiService` for all backend communications
- Implement proper loading states during API calls
- Handle errors gracefully with user-friendly messages
- Follow the existing component structure and styling patterns
- Check permissions before rendering sensitive UI elements

### For Backend Development
- Maintain consistent response format across all endpoints
- Implement proper authentication and authorization checks
- Validate all input data on the server side
- Log important operations for audit trails
- Follow RESTful API design principles

### Security Considerations
- Never expose sensitive data unnecessarily
- Implement proper access controls for all endpoints
- Use HTTPS in production environments
- Sanitize all user inputs to prevent injection attacks
- Regularly update dependencies to patch security vulnerabilities

## Extending the System

When adding new screens or features:
1. Define the required backend endpoints following existing patterns
2. Add corresponding methods to the `apiService`
3. Create React components that follow the existing structure
4. Implement proper authentication and authorization checks
5. Test thoroughly with different user roles and permissions

This architecture ensures consistency across the application while maintaining security and scalability.