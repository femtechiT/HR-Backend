# HR Admin Dashboard API Integration Guide

Based on my analysis of your HR Management System codebase, I'll provide you with a comprehensive guide on how to use the APIs for HR admin dashboard screens. Since I couldn't find the specific `@screens/attendance.md` file you mentioned, I'll provide the information based on the actual API endpoints available in your system.

## API Base URL
```
http://localhost:3001/api (development)
https://yourdomain.com/api (production)
```

## Authentication
All protected endpoints require JWT authentication:
```
Authorization: Bearer <jwt_token>
```

## Standard Response Format
All API endpoints return a consistent response structure:
```json
{
  "success": true/false,
  "message": "Human-readable message",
  "data": { /* payload */ }
}
```

## Available API Endpoints for HR Admin Dashboard

### 1. Attendance Management

#### Get All Attendance Records
- **Endpoint**: `GET /api/attendance`
- **Permissions**: `attendance:read`
- **Description**: Retrieve attendance records with optional filters
- **Query Parameters**:
  - `userId` - Filter by specific user
  - `date` - Specific date (YYYY-MM-DD)
  - `startDate` - Start date for range (YYYY-MM-DD)
  - `endDate` - End date for range (YYYY-MM-DD)
  - `status` - Filter by status (present, absent, late, half_day, leave, holiday)
  - `limit` - Number of records per page
  - `page` - Page number

#### Get Attendance Summary
- **Endpoint**: `GET /api/attendance/summary`
- **Permissions**: `attendance:read`
- **Description**: Get attendance statistics for a date range
- **Query Parameters**:
  - `userId` - Specific user (admin only)
  - `startDate` - Required start date (YYYY-MM-DD)
  - `endDate` - Required end date (YYYY-MM-DD)

#### Update Attendance Record
- **Endpoint**: `PUT /api/attendance/:id`
- **Permissions**: `attendance:update`
- **Description**: Modify an existing attendance record
- **Request Body**:
```json
{
  "status": "present|absent|late|half_day|leave|holiday",
  "check_in_time": "HH:mm:ss",
  "check_out_time": "HH:mm:ss",
  "location_verified": true|false
}
```

#### Manual Attendance Creation
- **Endpoint**: `POST /api/attendance/manual`
- **Permissions**: Requires authentication
- **Description**: Create attendance record manually (for admins)
- **Request Body**:
```json
{
  "date": "YYYY-MM-DD",
  "check_in_time": "HH:mm:ss",
  "check_out_time": "HH:mm:ss",
  "status": "present|absent|late|half_day|leave|holiday",
  "user_id": 123, // Optional, defaults to current user
  "location_coordinates": {
    "latitude": -1.286389,
    "longitude": 36.817223
  },
  "location_address": "Office Location"
}
```

### 2. Leave Management

#### Get All Leave Requests
- **Endpoint**: `GET /api/leave`
- **Permissions**: `leave:read`
- **Description**: Retrieve all leave requests with filters
- **Query Parameters**:
  - `userId` - Filter by specific user
  - `status` - Filter by status (submitted, approved, rejected)
  - `limit` - Number of records per page
  - `page` - Page number

#### Update Leave Request
- **Endpoint**: `PUT /api/leave/:id`
- **Permissions**: `leave:update`
- **Description**: Approve/reject a leave request
- **Request Body**:
```json
{
  "status": "approved|rejected|cancelled",
  "reason": "Optional reason for the decision"
}
```

### 3. Staff Management

#### Get All Staff
- **Endpoint**: `GET /api/staff`
- **Permissions**: `staff:read`
- **Description**: Retrieve all staff members with pagination
- **Query Parameters**:
  - `limit` - Number of records per page
  - `page` - Page number

#### Get Staff by ID
- **Endpoint**: `GET /api/staff/:id`
- **Permissions**: `staff:read`
- **Description**: Retrieve specific staff member details

## Frontend Integration Examples

### Using the API Service in React Components

Your frontend already has an `api-service.ts` file that handles all API communications. Here's how to use it in your dashboard components:

```typescript
import { apiService } from './api-service';

// Get attendance records for a date range
const getAttendanceForPeriod = async (startDate: string, endDate: string) => {
  try {
    const response = await apiService.getAttendanceRecords({
      startDate,
      endDate,
      limit: 50
    });
    
    if (response.success) {
      return response.data.attendance; // Array of attendance records
    } else {
      console.error('Failed to get attendance:', response.message);
      return [];
    }
  } catch (error) {
    console.error('Error getting attendance:', error);
    return [];
  }
};

// Get attendance summary
const getAttendanceSummary = async (userId: number, startDate: string, endDate: string) => {
  try {
    const response = await apiService.request(`/attendance/summary?userId=${userId}&startDate=${startDate}&endDate=${endDate}`);
    
    if (response.success) {
      return response.data.summary; // Summary object with stats
    }
  } catch (error) {
    console.error('Error getting summary:', error);
  }
};

// Update attendance record
const updateAttendance = async (attendanceId: number, data: any) => {
  try {
    const response = await apiService.request(`/attendance/${attendanceId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    return response;
  } catch (error) {
    console.error('Error updating attendance:', error);
  }
};
```

### Sample HR Admin Dashboard Component

```jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { apiService } from './api-service';

const AttendanceDashboard = () => {
  const { hasPermission } = useAuth();
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchAttendanceData();
  }, [dateRange]);

  const fetchAttendanceData = async () => {
    if (!hasPermission('attendance:read')) return;
    
    setLoading(true);
    try {
      const response = await apiService.getAttendanceRecords({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      
      if (response.success) {
        setAttendanceData(response.data.attendance);
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!hasPermission('attendance:read')) {
    return <div>Access denied</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Attendance Dashboard</h1>
      
      <div className="mb-4">
        <label className="mr-2">Start Date:</label>
        <input
          type="date"
          value={dateRange.startDate}
          onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
          className="border p-2 mr-4"
        />
        <label className="mr-2">End Date:</label>
        <input
          type="date"
          value={dateRange.endDate}
          onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
          className="border p-2"
        />
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Employee</th>
                <th className="py-2 px-4 border-b">Date</th>
                <th className="py-2 px-4 border-b">Check-in</th>
                <th className="py-2 px-4 border-b">Check-out</th>
                <th className="py-2 px-4 border-b">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((record) => (
                <tr key={record.id}>
                  <td className="py-2 px-4 border-b">{record.user_name || 'N/A'}</td>
                  <td className="py-2 px-4 border-b">{new Date(record.date).toLocaleDateString()}</td>
                  <td className="py-2 px-4 border-b">{record.check_in_time || 'N/A'}</td>
                  <td className="py-2 px-4 border-b">{record.check_out_time || 'N/A'}</td>
                  <td className="py-2 px-4 border-b">
                    <span className={`px-2 py-1 rounded ${
                      record.status === 'present' ? 'bg-green-200' :
                      record.status === 'absent' ? 'bg-red-200' :
                      record.status === 'late' ? 'bg-yellow-200' : 'bg-gray-200'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AttendanceDashboard;
```

## Important Considerations

### 1. Permissions
- Different endpoints require different permissions
- HR admins typically have broader access than regular users
- Always check permissions before making API calls

### 2. Data Validation
- Validate dates on the frontend before sending to backend
- Ensure required fields are filled before submission
- Handle edge cases like overlapping date ranges

### 3. Error Handling
- Implement proper error handling for network failures
- Show user-friendly messages for different error types
- Log errors for debugging purposes

### 4. Pagination
- Many endpoints support pagination with `limit` and `page` parameters
- Display pagination controls in your UI
- Handle empty result sets gracefully

### 5. Real-time Updates
- Consider implementing WebSocket connections for real-time attendance updates
- Poll endpoints periodically for live data if needed
- Implement optimistic UI updates where appropriate

### 6. Security
- Store JWT tokens securely (preferably in httpOnly cookies)
- Implement proper session management
- Sanitize all user inputs before sending to the backend

This guide should help you integrate the HR admin dashboard with your backend APIs effectively. The system is well-structured with proper authentication, authorization, and response formatting, making it easier to build robust admin interfaces.