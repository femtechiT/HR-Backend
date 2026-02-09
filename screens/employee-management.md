# Employee Management Screen for HR Admin Dashboard

## Overview
The Employee Management screen allows HR administrators to view, add, update, and manage employee records across the organization.

## Frontend Components
- New component: `EmployeeManagementDashboard.tsx` - Main dashboard for HR admins
- New component: `EmployeeForm.tsx` - Form for adding/editing employees

## Backend API Integration

### 1. Get All Staff
- **Endpoint**: `GET /api/staff`
- **Permissions**: `staff:read`
- **Purpose**: Fetch all staff members with pagination
- **Query Parameters**:
  - `limit` - Number of records per page (default: 20)
  - `page` - Page number (default: 1)
  - `department` - Filter by department
  - `branch` - Filter by branch
- **Response**:
```json
{
  "success": true,
  "message": "Staff retrieved successfully",
  "data": {
    "staff": [
      {
        "id": 1,
        "user_id": 123,
        "full_name": "John Doe",
        "email": "john.doe@company.com",
        "department": "Engineering",
        "position": "Software Engineer",
        "branch": "Main Office",
        "hire_date": "2023-01-15",
        "status": "active",
        "created_at": "2023-01-15T08:00:00Z"
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

### 2. Get Staff by ID
- **Endpoint**: `GET /api/staff/:id`
- **Permissions**: `staff:read`
- **Purpose**: Get detailed information about a specific staff member

### 3. Create Staff Member
- **Endpoint**: `POST /api/staff`
- **Permissions**: `staff.create`
- **Purpose**: Add a new staff member to the system
- **Request Body**:
```json
{
  "full_name": "Jane Smith",
  "email": "jane.smith@company.com",
  "department": "Marketing",
  "position": "Marketing Manager",
  "branch": "Main Office",
  "hire_date": "2023-06-01",
  "salary": 75000,
  "manager_id": 1
}
```

### 4. Update Staff Member
- **Endpoint**: `PUT /api/staff/:id`
- **Permissions**: `staff.update`
- **Purpose**: Update an existing staff member's information
- **Request Body**: Same as create, with fields to update

### 5. Terminate Staff Member
- **Endpoint**: `PATCH /api/staff/:id/terminate`
- **Permissions**: `staff.terminate`
- **Purpose**: Mark a staff member as terminated
- **Request Body**:
```json
{
  "termination_date": "2023-12-31",
  "reason": "Voluntary resignation",
  "notes": "Provided 2 weeks notice"
}
```

## Frontend Implementation

### Employee Management Dashboard Component
```jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { apiService } from '../api-service';

const EmployeeManagementDashboard = () => {
  const { hasPermission } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    department: '',
    branch: '',
    status: 'active',
    limit: 20,
    page: 1
  });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, [filters]);

  const fetchEmployees = async () => {
    if (!hasPermission('staff:read')) return;
    
    setLoading(true);
    try {
      const response = await apiService.request('/staff', {
        method: 'GET',
        params: filters
      });
      
      if (response.success) {
        setEmployees(response.data.staff);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const addEmployee = async (employeeData) => {
    try {
      const response = await apiService.request('/staff', {
        method: 'POST',
        body: JSON.stringify(employeeData)
      });
      
      if (response.success) {
        // Refresh the employee list
        fetchEmployees();
        setShowAddForm(false);
      }
      return response;
    } catch (error) {
      console.error('Error adding employee:', error);
    }
  };

  const updateEmployee = async (id, employeeData) => {
    try {
      const response = await apiService.request(`/staff/${id}`, {
        method: 'PUT',
        body: JSON.stringify(employeeData)
      });
      
      if (response.success) {
        // Refresh the employee list
        fetchEmployees();
      }
      return response;
    } catch (error) {
      console.error('Error updating employee:', error);
    }
  };

  const terminateEmployee = async (id, terminationData) => {
    try {
      const response = await apiService.request(`/staff/${id}/terminate`, {
        method: 'PATCH',
        body: JSON.stringify(terminationData)
      });
      
      if (response.success) {
        // Refresh the employee list
        fetchEmployees();
      }
      return response;
    } catch (error) {
      console.error('Error terminating employee:', error);
    }
  };

  if (!hasPermission('staff:read')) {
    return <div>Access denied</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Employee Management</h1>
        {hasPermission('staff.create') && (
          <button 
            onClick={() => setShowAddForm(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Add Employee
          </button>
        )}
      </div>
      
      <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <select 
          value={filters.department}
          onChange={(e) => setFilters({...filters, department: e.target.value})}
          className="border p-2 rounded"
        >
          <option value="">All Departments</option>
          <option value="Engineering">Engineering</option>
          <option value="Marketing">Marketing</option>
          <option value="Sales">Sales</option>
          <option value="HR">HR</option>
        </select>
        
        <select 
          value={filters.branch}
          onChange={(e) => setFilters({...filters, branch: e.target.value})}
          className="border p-2 rounded"
        >
          <option value="">All Branches</option>
          <option value="Main Office">Main Office</option>
          <option value="Remote">Remote</option>
        </select>
        
        <select 
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
          className="border p-2 rounded"
        >
          <option value="active">Active</option>
          <option value="terminated">Terminated</option>
          <option value="">All</option>
        </select>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Name</th>
                <th className="py-2 px-4 border-b">Email</th>
                <th className="py-2 px-4 border-b">Department</th>
                <th className="py-2 px-4 border-b">Position</th>
                <th className="py-2 px-4 border-b">Branch</th>
                <th className="py-2 px-4 border-b">Hire Date</th>
                <th className="py-2 px-4 border-b">Status</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td className="py-2 px-4 border-b">{employee.full_name}</td>
                  <td className="py-2 px-4 border-b">{employee.email}</td>
                  <td className="py-2 px-4 border-b">{employee.department}</td>
                  <td className="py-2 px-4 border-b">{employee.position}</td>
                  <td className="py-2 px-4 border-b">{employee.branch}</td>
                  <td className="py-2 px-4 border-b">
                    {new Date(employee.hire_date).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-4 border-b">
                    <span className={`px-2 py-1 rounded ${
                      employee.status === 'active' ? 'bg-green-200' : 'bg-red-200'
                    }`}>
                      {employee.status}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">
                    <div className="space-x-2">
                      {hasPermission('staff.update') && (
                        <button className="text-blue-500">Edit</button>
                      )}
                      {hasPermission('staff.terminate') && employee.status === 'active' && (
                        <button 
                          onClick={() => terminateEmployee(employee.id, {
                            termination_date: new Date().toISOString().split('T')[0],
                            reason: 'Termination initiated by HR'
                          })}
                          className="text-red-500"
                        >
                          Terminate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddForm && (
        <EmployeeForm 
          onClose={() => setShowAddForm(false)} 
          onSave={addEmployee}
        />
      )}
    </div>
  );
};

export default EmployeeManagementDashboard;
```

### Employee Form Component
```jsx
import React, { useState } from 'react';

const EmployeeForm = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    department: '',
    position: '',
    branch: '',
    hire_date: '',
    salary: '',
    manager_id: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.department) {
      newErrors.department = 'Department is required';
    }
    
    if (!formData.position) {
      newErrors.position = 'Position is required';
    }
    
    if (!formData.branch) {
      newErrors.branch = 'Branch is required';
    }
    
    if (!formData.hire_date) {
      newErrors.hire_date = 'Hire date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const result = await onSave({
      ...formData,
      salary: parseFloat(formData.salary) || null,
      manager_id: parseInt(formData.manager_id) || null
    });
    
    if (result.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Add New Employee</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${errors.full_name ? 'border-red-500' : ''}`}
              />
              {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${errors.email ? 'border-red-500' : ''}`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department *
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${errors.department ? 'border-red-500' : ''}`}
              >
                <option value="">Select Department</option>
                <option value="Engineering">Engineering</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
              </select>
              {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position *
              </label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${errors.position ? 'border-red-500' : ''}`}
              />
              {errors.position && <p className="text-red-500 text-xs mt-1">{errors.position}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Branch *
              </label>
              <select
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${errors.branch ? 'border-red-500' : ''}`}
              >
                <option value="">Select Branch</option>
                <option value="Main Office">Main Office</option>
                <option value="Remote">Remote</option>
              </select>
              {errors.branch && <p className="text-red-500 text-xs mt-1">{errors.branch}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hire Date *
              </label>
              <input
                type="date"
                name="hire_date"
                value={formData.hire_date}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${errors.hire_date ? 'border-red-500' : ''}`}
              />
              {errors.hire_date && <p className="text-red-500 text-xs mt-1">{errors.hire_date}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Salary
              </label>
              <input
                type="number"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="e.g., 75000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manager ID
              </label>
              <input
                type="number"
                name="manager_id"
                value={formData.manager_id}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="Manager's staff ID"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeForm;
```

## Key Considerations

1. **Permissions**: Different actions require different permissions (`staff:read`, `staff.create`, `staff.update`, `staff.terminate`)
2. **Data Validation**: Both frontend and backend validate input data
3. **Security**: Sensitive employee data should be protected appropriately
4. **Audit Trail**: Changes to employee records should be logged for compliance
5. **Integration**: This screen connects with other systems like payroll and attendance