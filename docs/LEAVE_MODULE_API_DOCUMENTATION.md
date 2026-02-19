# Leave Management Module - API Documentation

## Overview

The Leave Management Module handles all leave-related operations including:
- Viewing and requesting leave
- Checking leave balances
- Managing leave types
- Managing leave allocations
- Approving/rejecting leave requests

---

## Table of Contents

1. [Leave Types](#leave-types)
2. [Leave Requests](#leave-requests)
3. [Leave Balances](#leave-balances)
4. [Leave Allocations](#leave-allocations)
5. [Permission Requirements](#permission-requirements)
6. [Error Responses](#error-responses)

---

## Authentication

All endpoints require JWT authentication. Include the access token in the Authorization header:

```http
Authorization: Bearer <your_access_token>
```

---

## Leave Types

### 1. Get All Leave Types

**Endpoint:** `GET /api/leave-types`

**Permission Required:** None (just authentication)

**Purpose:** Fetch all available leave types for dropdown selection.

**Request:**
```http
GET /api/leave-types
Authorization: Bearer <token>
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
        "days_per_year": 20,
        "is_paid": true,
        "allow_carryover": true,
        "carryover_limit": 5,
        "is_active": true,
        "created_at": "2026-01-01T00:00:00Z"
      },
      {
        "id": 2,
        "name": "Sick Leave",
        "days_per_year": 10,
        "is_paid": true,
        "allow_carryover": false,
        "carryover_limit": 0,
        "is_active": true,
        "created_at": "2026-01-01T00:00:00Z"
      },
      {
        "id": 3,
        "name": "Personal Leave",
        "days_per_year": 5,
        "is_paid": false,
        "allow_carryover": false,
        "carryover_limit": 0,
        "is_active": true,
        "created_at": "2026-01-01T00:00:00Z"
      }
    ]
  }
}
```

**Frontend Usage:**
```javascript
// Fetch leave types for dropdown
const response = await api.get('/api/leave-types');
const leaveTypes = response.data.data.leaveTypes;

// Populate dropdown
leaveTypes.forEach(type => {
  dropdownOptions.push({
    value: type.id,
    label: `${type.name} (${type.days_per_year} days/year)`
  });
});
```

---

### 2. Get Leave Type by ID

**Endpoint:** `GET /api/leave-types/:id`

**Permission Required:** None (just authentication)

**Request:**
```http
GET /api/leave-types/1
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Leave type retrieved successfully",
  "data": {
    "leaveType": {
      "id": 1,
      "name": "Annual Leave",
      "days_per_year": 20,
      "is_paid": true,
      "allow_carryover": true,
      "carryover_limit": 5,
      "is_active": true
    }
  }
}
```

---

## Leave Requests

### 1. Get My Leave Requests (Current User)

**Endpoint:** `GET /api/leave/my-requests`

**Permission Required:** None (just authentication)

**Purpose:** Get the current user's own leave request history.

**Query Parameters:**
| Parameter | Type   | Default | Description                    |
|-----------|--------|---------|--------------------------------|
| status    | string | -       | Filter by status (submitted/approved/rejected/cancelled) |
| limit     | number | 20      | Number of items per page (max 100) |
| page      | number | 1       | Page number                    |

**Request:**
```http
GET /api/leave/my-requests?status=submitted&limit=10&page=1
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Your leave requests retrieved successfully",
  "data": {
    "leaveRequests": [
      {
        "id": 1,
        "form_id": 5,
        "user_id": 123,
        "user_name": "John Doe",
        "submission_data": {
          "leave_type_id": 1,
          "leave_type_name": "Annual Leave",
          "start_date": "2026-03-01",
          "end_date": "2026-03-05",
          "days_requested": 5,
          "reason": "Family vacation",
          "requested_by": 123
        },
        "status": "submitted",
        "submitted_at": "2026-02-15T10:30:00Z",
        "notes": null
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25,
      "itemsPerPage": 10
    }
  }
}
```

**Frontend Usage:**
```javascript
// Fetch user's leave requests
const fetchMyLeaveRequests = async (page = 1, status = '') => {
  const params = { page, limit: 20 };
  if (status) params.status = status;
  
  const response = await api.get('/api/leave/my-requests', { params });
  return response.data.data;
};

// Display in table
const { leaveRequests, pagination } = await fetchMyLeaveRequests();
leaveRequests.forEach(request => {
  console.log(`${request.submission_data.start_date} - ${request.submission_data.end_date} (${request.status})`);
});
```

---

### 2. Get Leave Request by ID

**Endpoint:** `GET /api/leave/:id`

**Permission Required:** None (just authentication)

**Access Control:** 
- Owner of the request can always view it
- Admins (role 1 or 2) can view all requests
- Other users cannot view requests they don't own

**Request:**
```http
GET /api/leave/1
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Leave request retrieved successfully",
  "data": {
    "leaveRequest": {
      "id": 1,
      "form_id": 5,
      "user_id": 123,
      "user_name": "John Doe",
      "submission_data": {
        "leave_type_id": 1,
        "start_date": "2026-03-01",
        "end_date": "2026-03-05",
        "days_requested": 5,
        "reason": "Family vacation"
      },
      "status": "approved",
      "submitted_at": "2026-02-15T10:30:00Z",
      "notes": "Approved by manager"
    }
  }
}
```

---

### 3. Create Leave Request

**Endpoint:** `POST /api/leave`

**Permission Required:** `leave:create`

**Purpose:** Submit a new leave request.

**Request Body:**
```json
{
  "leave_type_id": 1,
  "start_date": "2026-03-01",
  "end_date": "2026-03-05",
  "reason": "Family vacation"
}
```

**Field Descriptions:**
| Field         | Type   | Required | Description                           |
|---------------|--------|----------|---------------------------------------|
| leave_type_id | number | Yes      | ID of the leave type from dropdown    |
| start_date    | string | Yes      | Start date (YYYY-MM-DD format)        |
| end_date      | string | Yes      | End date (YYYY-MM-DD format)          |
| reason        | string | Yes      | Reason for leave request              |

**Validation Rules:**
- `start_date` cannot be in the past
- `end_date` cannot be before `start_date`
- User must have sufficient leave balance

**Request:**
```http
POST /api/leave
Authorization: Bearer <token>
Content-Type: application/json

{
  "leave_type_id": 1,
  "start_date": "2026-03-01",
  "end_date": "2026-03-05",
  "reason": "Family vacation"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Leave request submitted successfully",
  "data": {
    "leaveRequest": {
      "id": 15,
      "form_id": 5,
      "user_id": 123,
      "submission_data": {
        "leave_type_id": 1,
        "start_date": "2026-03-01",
        "end_date": "2026-03-05",
        "days_requested": 5,
        "reason": "Family vacation",
        "requested_by": 123
      },
      "status": "submitted",
      "submitted_at": "2026-02-19T14:30:00Z"
    }
  }
}
```

**Error Response (400) - Insufficient Balance:**
```json
{
  "success": false,
  "message": "Insufficient leave balance. Requested: 5 days, Available: 3 days"
}
```

**Error Response (400) - Invalid Dates:**
```json
{
  "success": false,
  "message": "Start date cannot be in the past"
}
```

**Frontend Usage:**
```javascript
// Submit leave request
const submitLeaveRequest = async (formData) => {
  try {
    const response = await api.post('/api/leave', {
      leave_type_id: formData.leaveType,
      start_date: formData.startDate,
      end_date: formData.endDate,
      reason: formData.reason
    });
    
    if (response.data.success) {
      alert('Leave request submitted successfully!');
      // Refresh leave requests list
      fetchMyLeaveRequests();
    }
  } catch (error) {
    if (error.response?.status === 400) {
      alert(error.response.data.message);
    }
  }
};
```

---

### 4. Update Leave Request (Approve/Reject)

**Endpoint:** `PUT /api/leave/:id`

**Permission Required:** `leave:update`

**Purpose:** Approve or reject a leave request (admin/approver only).

**Request Body:**
```json
{
  "status": "approved",
  "reason": "Approved - coverage arranged"
}
```

**Valid Status Values:**
- `approved` - Approve the request
- `rejected` - Reject the request
- `cancelled` - Cancel the request

**Request:**
```http
PUT /api/leave/15
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "approved",
  "reason": "Approved - coverage arranged"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Leave request updated successfully",
  "data": {
    "leaveRequest": {
      "id": 15,
      "status": "approved",
      "notes": "Approved - coverage arranged"
    }
  }
}
```

---

### 5. Delete/Cancel Leave Request

**Endpoint:** `DELETE /api/leave/:id`

**Permission Required:** `leave:delete`

**Purpose:** Cancel a leave request (only if status is "submitted").

**Request:**
```http
DELETE /api/leave/15
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Leave request cancelled successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Cannot cancel leave request that is already approved or rejected"
}
```

---

## Leave Balances

### Get My Leave Balances

**Endpoint:** `GET /api/leave/balance`

**Permission Required:** None (just authentication)

**Purpose:** Get current user's leave balances for all leave types.

**Request:**
```http
GET /api/leave/balance
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Leave balances retrieved successfully",
  "data": {
    "balances": [
      {
        "leave_type_id": 1,
        "leave_type_name": "Annual Leave",
        "allocated_days": 20,
        "used_days": 5,
        "carried_over_days": 2,
        "remaining_days": 17,
        "cycle_start_date": "2026-01-01T00:00:00Z",
        "cycle_end_date": "2026-12-31T00:00:00Z"
      },
      {
        "leave_type_id": 2,
        "leave_type_name": "Sick Leave",
        "allocated_days": 10,
        "used_days": 3,
        "carried_over_days": 0,
        "remaining_days": 7,
        "cycle_start_date": "2026-01-01T00:00:00Z",
        "cycle_end_date": "2026-12-31T00:00:00Z"
      },
      {
        "leave_type_id": 3,
        "leave_type_name": "Personal Leave",
        "allocated_days": 5,
        "used_days": 0,
        "carried_over_days": 0,
        "remaining_days": 5,
        "cycle_start_date": "2026-01-01T00:00:00Z",
        "cycle_end_date": "2026-12-31T00:00:00Z"
      }
    ]
  }
}
```

**Frontend Usage:**
```javascript
// Fetch leave balances
const fetchLeaveBalances = async () => {
  const response = await api.get('/api/leave/balance');
  return response.data.data.balances;
};

// Display in dashboard
const balances = await fetchLeaveBalances();
balances.forEach(balance => {
  console.log(`${balance.leave_type_name}: ${balance.remaining_days} days remaining`);
});

// Show warning if low balance
balances.forEach(balance => {
  if (balance.remaining_days < 3) {
    showWarning(`Low ${balance.leave_type_name} balance: ${balance.remaining_days} days`);
  }
});
```

---

## Leave Allocations

### 1. Get My Allocations

**Endpoint:** `GET /api/leave/allocations/my-allocations`

**Permission Required:** None (just authentication)

**Purpose:** Get current user's leave allocations with details.

**Request:**
```http
GET /api/leave/allocations/my-allocations
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Your leave allocations retrieved successfully",
  "data": {
    "allocations": [
      {
        "id": 1,
        "user_id": 123,
        "leave_type_id": 1,
        "leave_type_name": "Annual Leave",
        "cycle_start_date": "2026-01-01T00:00:00Z",
        "cycle_end_date": "2026-12-31T00:00:00Z",
        "allocated_days": 20,
        "used_days": 5,
        "carried_over_days": 2,
        "remaining_days": 17,
        "created_at": "2026-01-01T00:00:00Z"
      },
      {
        "id": 2,
        "user_id": 123,
        "leave_type_id": 2,
        "leave_type_name": "Sick Leave",
        "cycle_start_date": "2026-01-01T00:00:00Z",
        "cycle_end_date": "2026-12-31T00:00:00Z",
        "allocated_days": 10,
        "used_days": 3,
        "carried_over_days": 0,
        "remaining_days": 7,
        "created_at": "2026-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

### 2. Get All Leave Allocations (Admin)

**Endpoint:** `GET /api/leave/allocations`

**Permission Required:** `leave_allocation:read`

**Query Parameters:**
| Parameter  | Type   | Default | Description                    |
|------------|--------|---------|--------------------------------|
| userId     | number | -       | Filter by user ID              |
| leaveTypeId| number | -       | Filter by leave type ID        |
| limit      | number | 20      | Items per page (max 100)       |
| page       | number | 1       | Page number                    |

**Request:**
```http
GET /api/leave/allocations?userId=123&limit=10&page=1
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Leave allocations retrieved successfully",
  "data": {
    "leaveAllocations": [
      {
        "id": 1,
        "user_id": 123,
        "user_name": "John Doe",
        "leave_type_id": 1,
        "leave_type_name": "Annual Leave",
        "cycle_start_date": "2026-01-01T00:00:00Z",
        "cycle_end_date": "2026-12-31T00:00:00Z",
        "allocated_days": 20,
        "used_days": 5,
        "carried_over_days": 2,
        "created_at": "2026-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10
    }
  }
}
```

---

### 3. Create Leave Allocation (Admin)

**Endpoint:** `POST /api/leave/allocations`

**Permission Required:** `leave_allocation:create`

**Purpose:** Allocate leave days to a user.

**Request Body:**
```json
{
  "user_id": 123,
  "leave_type_id": 1,
  "allocated_days": 20,
  "cycle_start_date": "2026-01-01",
  "cycle_end_date": "2026-12-31",
  "carried_over_days": 2
}
```

**Field Descriptions:**
| Field              | Type   | Required | Description                        |
|--------------------|--------|----------|------------------------------------|
| user_id            | number | Yes      | ID of the user                     |
| leave_type_id      | number | Yes      | ID of the leave type               |
| allocated_days     | number | Yes      | Number of days to allocate         |
| cycle_start_date   | string | Yes      | Start of leave cycle (YYYY-MM-DD)  |
| cycle_end_date     | string | Yes      | End of leave cycle (YYYY-MM-DD)    |
| carried_over_days  | number | No       | Days carried over from previous cycle |

**Request:**
```http
POST /api/leave/allocations
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_id": 123,
  "leave_type_id": 1,
  "allocated_days": 20,
  "cycle_start_date": "2026-01-01",
  "cycle_end_date": "2026-12-31",
  "carried_over_days": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Leave allocation created successfully",
  "data": {
    "leaveAllocation": {
      "id": 15,
      "user_id": 123,
      "leave_type_id": 1,
      "allocated_days": 20,
      "used_days": 0,
      "carried_over_days": 2,
      "cycle_start_date": "2026-01-01T00:00:00Z",
      "cycle_end_date": "2026-12-31T00:00:00Z"
    }
  }
}
```

---

### 4. Update Leave Allocation (Admin)

**Endpoint:** `PUT /api/leave/allocations/:id`

**Permission Required:** `leave_allocation:update`

**Request Body:**
```json
{
  "allocated_days": 25,
  "used_days": 5,
  "carried_over_days": 3
}
```

**Request:**
```http
PUT /api/leave/allocations/15
Authorization: Bearer <token>
Content-Type: application/json

{
  "allocated_days": 25
}
```

**Response:**
```json
{
  "success": true,
  "message": "Leave allocation updated successfully",
  "data": {
    "leaveAllocation": {
      "id": 15,
      "allocated_days": 25,
      "used_days": 5,
      "carried_over_days": 3
    }
  }
}
```

---

### 5. Delete Leave Allocation (Admin)

**Endpoint:** `DELETE /api/leave/allocations/:id`

**Permission Required:** `leave_allocation:delete`

**Request:**
```http
DELETE /api/leave/allocations/15
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Leave allocation deleted successfully"
}
```

---

## Permission Requirements

### Regular User (No Special Permissions Needed)

| Endpoint                              | Permission |
|---------------------------------------|------------|
| `GET /api/leave-types`                | None       |
| `GET /api/leave-types/:id`            | None       |
| `GET /api/leave/my-requests`          | None       |
| `GET /api/leave/:id` (own requests)   | None       |
| `GET /api/leave/balance`              | None       |
| `GET /api/leave/allocations/my-allocations` | None |
| `POST /api/leave`                     | `leave:create` |

### Admin/Manager Permissions

| Permission                  | Description                          |
|-----------------------------|--------------------------------------|
| `leave:read`                | View all leave requests              |
| `leave:create`              | Create leave requests                |
| `leave:update`              | Approve/reject leave requests        |
| `leave:delete`              | Delete/cancel leave requests         |
| `leave_allocation:read`     | View all leave allocations           |
| `leave_allocation:create`   | Create leave allocations             |
| `leave_allocation:update`   | Update leave allocations             |
| `leave_allocation:delete`   | Delete leave allocations             |
| `leave_type:read`           | View leave types                     |

---

## Error Responses

### Common Error Codes

| Status Code | Description                          |
|-------------|--------------------------------------|
| 400         | Bad Request (invalid data)           |
| 401         | Unauthorized (missing/invalid token) |
| 403         | Forbidden (insufficient permissions) |
| 404         | Not Found                            |
| 500         | Internal Server Error                |

### Error Response Format

```json
{
  "success": false,
  "message": "Error description here"
}
```

### Example Error Handling

```javascript
// Frontend error handling
try {
  const response = await api.post('/api/leave', formData);
  // Handle success
} catch (error) {
  if (error.response?.status === 400) {
    // Bad request - show validation error
    alert(error.response.data.message);
  } else if (error.response?.status === 401) {
    // Unauthorized - redirect to login
    redirectToLogin();
  } else if (error.response?.status === 403) {
    // Forbidden - show permission error
    alert('You do not have permission to perform this action');
  } else if (error.response?.status === 404) {
    // Not found
    alert('Resource not found');
  } else {
    // Server error
    alert('An error occurred. Please try again later.');
  }
}
```

---

## Frontend Integration Examples

### Complete Leave Request Form Component

```javascript
import React, { useState, useEffect } from 'react';
import api from '../api';

const LeaveRequestForm = () => {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [balances, setBalances] = useState([]);
  const [formData, setFormData] = useState({
    leave_type_id: '',
    start_date: '',
    end_date: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);

  // Fetch leave types and balances on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [typesRes, balanceRes] = await Promise.all([
        api.get('/api/leave-types'),
        api.get('/api/leave/balance')
      ]);
      
      setLeaveTypes(typesRes.data.data.leaveTypes);
      setBalances(balanceRes.data.data.balances);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/api/leave', formData);
      
      if (response.data.success) {
        alert('Leave request submitted successfully!');
        setFormData({
          leave_type_id: '',
          start_date: '',
          end_date: '',
          reason: ''
        });
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error submitting request');
    } finally {
      setLoading(false);
    }
  };

  const getRemainingDays = (leaveTypeId) => {
    const balance = balances.find(b => b.leave_type_id === leaveTypeId);
    return balance ? balance.remaining_days : 0;
  };

  return (
    <form onSubmit={handleSubmit}>
      <select
        value={formData.leave_type_id}
        onChange={(e) => setFormData({...formData, leave_type_id: e.target.value})}
        required
      >
        <option value="">Select Leave Type</option>
        {leaveTypes.map(type => (
          <option key={type.id} value={type.id}>
            {type.name} ({getRemainingDays(type.id)} days available)
          </option>
        ))}
      </select>

      <input
        type="date"
        value={formData.start_date}
        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
        min={new Date().toISOString().split('T')[0]}
        required
      />

      <input
        type="date"
        value={formData.end_date}
        onChange={(e) => setFormData({...formData, end_date: e.target.value})}
        min={formData.start_date}
        required
      />

      <textarea
        value={formData.reason}
        onChange={(e) => setFormData({...formData, reason: e.target.value})}
        placeholder="Reason for leave"
        required
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Request'}
      </button>
    </form>
  );
};

export default LeaveRequestForm;
```

---

## Quick Reference

### Endpoints Summary

| Method | Endpoint                              | Permission              | Description           |
|--------|---------------------------------------|-------------------------|-----------------------|
| GET    | `/api/leave-types`                    | None                    | Get all leave types   |
| GET    | `/api/leave-types/:id`                | None                    | Get leave type by ID  |
| GET    | `/api/leave/my-requests`              | None                    | Get my leave requests |
| GET    | `/api/leave/:id`                      | None (owner/admin)      | Get specific request  |
| POST   | `/api/leave`                          | `leave:create`          | Create leave request  |
| PUT    | `/api/leave/:id`                      | `leave:update`          | Update leave request  |
| DELETE | `/api/leave/:id`                      | `leave:delete`          | Cancel leave request  |
| GET    | `/api/leave/balance`                  | None                    | Get my leave balance  |
| GET    | `/api/leave/allocations/my-allocations` | None                 | Get my allocations    |
| GET    | `/api/leave/allocations`              | `leave_allocation:read` | Get all allocations   |
| POST   | `/api/leave/allocations`              | `leave_allocation:create` | Create allocation |
| PUT    | `/api/leave/allocations/:id`          | `leave_allocation:update` | Update allocation |
| DELETE | `/api/leave/allocations/:id`          | `leave_allocation:delete` | Delete allocation |

---

## Support

For issues or questions, please refer to the project documentation or contact the development team.
