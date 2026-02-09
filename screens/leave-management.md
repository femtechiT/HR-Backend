# Leave Management Screen for HR Admin Dashboard

## Overview
The Leave Management screen allows HR administrators to view, approve, and manage all leave requests across the organization.

## Frontend Components
- `LeaveRequestForm.tsx` - Already exists in the frontend directory
- New component: `LeaveManagementDashboard.tsx` - Main dashboard for HR admins

## Backend API Integration

### 1. Get All Leave Requests
- **Endpoint**: `GET /api/leave`
- **Permissions**: `leave:read`
- **Purpose**: Fetch all leave requests with optional filters
- **Response**:
```json
{
  "success": true,
  "message": "Leave requests retrieved successfully",
  "data": {
    "leaveRequests": [
      {
        "id": 1,
        "user_id": 123,
        "user_name": "John Doe",
        "submission_data": {
          "leave_type_id": 1,
          "start_date": "2023-12-01",
          "end_date": "2023-12-05",
          "days_requested": 5,
          "reason": "Annual vacation",
          "requested_by": 123
        },
        "status": "submitted",
        "submitted_at": "2023-11-20T10:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100,
      "itemsPerPage": 20
    }
  }
}
```

### 2. Update Leave Request Status
- **Endpoint**: `PUT /api/leave/:id`
- **Permissions**: `leave:update`
- **Purpose**: Approve or reject a leave request
- **Request Body**:
```json
{
  "status": "approved|rejected",
  "reason": "Optional reason for the decision"
}
```

### 3. Get Leave Types
- **Endpoint**: `GET /api/leave/types`
- **Permissions**: `leave:read`
- **Purpose**: Get available leave types for filtering

## Frontend Implementation

### Leave Management Dashboard Component
```jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { apiService } from '../api-service';

const LeaveManagementDashboard = () => {
  const { hasPermission } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    userId: '',
    limit: 20,
    page: 1
  });

  useEffect(() => {
    fetchLeaveRequests();
  }, [filters]);

  const fetchLeaveRequests = async () => {
    if (!hasPermission('leave:read')) return;
    
    setLoading(true);
    try {
      const response = await apiService.request('/leave', {
        method: 'GET',
        params: filters
      });
      
      if (response.success) {
        setLeaveRequests(response.data.leaveRequests);
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateLeaveStatus = async (requestId, status) => {
    try {
      const response = await apiService.request(`/leave/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      
      if (response.success) {
        // Update the local state to reflect the change
        setLeaveRequests(leaveRequests.map(req => 
          req.id === requestId ? { ...req, status } : req
        ));
      }
      return response;
    } catch (error) {
      console.error('Error updating leave status:', error);
    }
  };

  if (!hasPermission('leave:read')) {
    return <div>Access denied</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Leave Management</h1>
      
      <div className="mb-4 flex space-x-4">
        <select 
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
          className="border p-2 rounded"
        >
          <option value="">All Statuses</option>
          <option value="submitted">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        
        <input
          type="text"
          placeholder="Filter by user ID"
          value={filters.userId}
          onChange={(e) => setFilters({...filters, userId: e.target.value})}
          className="border p-2 rounded"
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
                <th className="py-2 px-4 border-b">Leave Type</th>
                <th className="py-2 px-4 border-b">Dates</th>
                <th className="py-2 px-4 border-b">Days</th>
                <th className="py-2 px-4 border-b">Status</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map((request) => (
                <tr key={request.id}>
                  <td className="py-2 px-4 border-b">{request.user_name}</td>
                  <td className="py-2 px-4 border-b">Vacation</td>
                  <td className="py-2 px-4 border-b">
                    {new Date(request.submission_data.start_date).toLocaleDateString()} - 
                    {new Date(request.submission_data.end_date).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-4 border-b">{request.submission_data.days_requested}</td>
                  <td className="py-2 px-4 border-b">
                    <span className={`px-2 py-1 rounded ${
                      request.status === 'submitted' ? 'bg-yellow-200' :
                      request.status === 'approved' ? 'bg-green-200' :
                      'bg-red-200'
                    }`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">
                    {request.status === 'submitted' && (
                      <div className="space-x-2">
                        <button 
                          onClick={() => updateLeaveStatus(request.id, 'approved')}
                          className="bg-green-500 text-white px-3 py-1 rounded"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => updateLeaveStatus(request.id, 'rejected')}
                          className="bg-red-500 text-white px-3 py-1 rounded"
                        >
                          Reject
                        </button>
                      </div>
                    )}
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

export default LeaveManagementDashboard;
```

## Key Considerations

1. **Permissions**: Only users with `leave:read` and `leave:update` permissions can access this screen
2. **Real-time Updates**: Consider implementing WebSocket connections for live updates when leave requests are submitted
3. **Bulk Actions**: Future enhancement could include bulk approval/rejection of leave requests
4. **Reporting**: Export functionality for leave reports could be added