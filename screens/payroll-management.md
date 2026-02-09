# Payroll Management Screen for HR Admin Dashboard

## Overview
The Payroll Management screen allows HR administrators to view, process, and manage payroll runs and employee compensation across the organization.

## Frontend Components
- New component: `PayrollDashboard.tsx` - Main dashboard for HR admins
- New component: `PayrollRunForm.tsx` - Form for initiating payroll runs
- New component: `PayrollRecordDetail.tsx` - Detailed view of individual payroll records

## Backend API Integration

### 1. Get Payroll Records
- **Endpoint**: `GET /api/payroll`
- **Permissions**: `payroll:read`
- **Purpose**: Fetch payroll records with optional filters
- **Query Parameters**:
  - `userId` - Filter by specific user
  - `month` - Filter by month (e.g., "2023-12")
  - `year` - Filter by year (e.g., "2023")
  - `limit` - Number of records per page
  - `page` - Page number
- **Response**:
```json
{
  "success": true,
  "message": "Payroll records retrieved successfully",
  "data": {
    "payrollRecords": [
      {
        "id": 1,
        "user_id": 123,
        "user_name": "John Doe",
        "pay_period": "2023-12",
        "basic_salary": 5000.00,
        "allowances": 500.00,
        "deductions": 300.00,
        "net_pay": 5200.00,
        "payment_status": "paid",
        "processed_at": "2023-12-28T10:00:00Z",
        "payment_date": "2023-12-29T00:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 50,
      "itemsPerPage": 20
    }
  }
}
```

### 2. Get Payroll Runs
- **Endpoint**: `GET /api/payroll-runs`
- **Permissions**: `payroll:read`
- **Purpose**: Fetch payroll run history
- **Response**:
```json
{
  "success": true,
  "message": "Payroll runs retrieved successfully",
  "data": {
    "payrollRuns": [
      {
        "id": 1,
        "run_name": "December 2023 Payroll",
        "pay_period": "2023-12",
        "status": "completed",
        "total_employees": 150,
        "total_amount": 750000.00,
        "processed_by": 1,
        "processed_at": "2023-12-28T10:00:00Z",
        "completed_at": "2023-12-29T15:30:00Z"
      }
    ]
  }
}
```

### 3. Create Payroll Run
- **Endpoint**: `POST /api/payroll-runs`
- **Permissions**: `payroll:create`
- **Purpose**: Initiate a new payroll run
- **Request Body**:
```json
{
  "run_name": "January 2024 Payroll",
  "pay_period": "2024-01",
  "employee_ids": [123, 124, 125], // Optional: specific employees
  "branch_id": 1, // Optional: specific branch
  "process_date": "2024-01-28"
}
```

### 4. Get Employee Payslip
- **Endpoint**: `GET /api/payslips/:userId/:period`
- **Permissions**: `payroll:read`
- **Purpose**: Get payslip for a specific employee and pay period
- **Response**:
```json
{
  "success": true,
  "message": "Payslip retrieved successfully",
  "data": {
    "payslip": {
      "id": 1,
      "user_id": 123,
      "pay_period": "2023-12",
      "earnings": [
        {
          "type": "Basic Salary",
          "amount": 5000.00,
          "description": "Monthly basic salary"
        },
        {
          "type": "Transport Allowance",
          "amount": 500.00,
          "description": "Monthly transport allowance"
        }
      ],
      "deductions": [
        {
          "type": "Tax",
          "amount": 200.00,
          "description": "Income tax deduction"
        },
        {
          "type": "NHIF",
          "amount": 100.00,
          "description": "National Hospital Insurance Fund"
        }
      ],
      "gross_pay": 5500.00,
      "total_deductions": 300.00,
      "net_pay": 5200.00,
      "payment_status": "paid"
    }
  }
}
```

## Frontend Implementation

### Payroll Dashboard Component
```jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { apiService } from '../api-service';

const PayrollDashboard = () => {
  const { hasPermission } = useAuth();
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [payrollRuns, setPayrollRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [showRunForm, setShowRunForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  const fetchData = async () => {
    if (!hasPermission('payroll:read')) return;
    
    setLoading(true);
    try {
      // Fetch payroll records
      const recordsResponse = await apiService.request('/payroll', {
        method: 'GET',
        params: selectedPeriod ? { month: selectedPeriod } : {}
      });
      
      if (recordsResponse.success) {
        setPayrollRecords(recordsResponse.data.payrollRecords);
      }
      
      // Fetch payroll runs
      const runsResponse = await apiService.request('/payroll-runs');
      if (runsResponse.success) {
        setPayrollRuns(runsResponse.data.payrollRuns);
      }
    } catch (error) {
      console.error('Error fetching payroll data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initiatePayrollRun = async (runData) => {
    try {
      const response = await apiService.request('/payroll-runs', {
        method: 'POST',
        body: JSON.stringify(runData)
      });
      
      if (response.success) {
        // Refresh data
        fetchData();
        setShowRunForm(false);
      }
      return response;
    } catch (error) {
      console.error('Error initiating payroll run:', error);
    }
  };

  if (!hasPermission('payroll:read')) {
    return <div>Access denied</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Payroll Management</h1>
        {hasPermission('payroll:create') && (
          <button 
            onClick={() => setShowRunForm(true)}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Process Payroll Run
          </button>
        )}
      </div>
      
      <div className="mb-4">
        <label className="mr-2">Filter by Period:</label>
        <input
          type="month"
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="border p-2 rounded"
        />
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-8">
          {/* Payroll Runs Section */}
          <div>
            <h2 className="text-xl font-semibold mb-2">Recent Payroll Runs</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b">Run Name</th>
                    <th className="py-2 px-4 border-b">Pay Period</th>
                    <th className="py-2 px-4 border-b">Status</th>
                    <th className="py-2 px-4 border-b">Employees</th>
                    <th className="py-2 px-4 border-b">Total Amount</th>
                    <th className="py-2 px-4 border-b">Processed At</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollRuns.map((run) => (
                    <tr key={run.id}>
                      <td className="py-2 px-4 border-b">{run.run_name}</td>
                      <td className="py-2 px-4 border-b">{run.pay_period}</td>
                      <td className="py-2 px-4 border-b">
                        <span className={`px-2 py-1 rounded ${
                          run.status === 'completed' ? 'bg-green-200' :
                          run.status === 'processing' ? 'bg-yellow-200' : 'bg-red-200'
                        }`}>
                          {run.status}
                        </span>
                      </td>
                      <td className="py-2 px-4 border-b">{run.total_employees}</td>
                      <td className="py-2 px-4 border-b">${run.total_amount.toFixed(2)}</td>
                      <td className="py-2 px-4 border-b">
                        {new Date(run.processed_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payroll Records Section */}
          <div>
            <h2 className="text-xl font-semibold mb-2">Payroll Records</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b">Employee</th>
                    <th className="py-2 px-4 border-b">Pay Period</th>
                    <th className="py-2 px-4 border-b">Basic Salary</th>
                    <th className="py-2 px-4 border-b">Allowances</th>
                    <th className="py-2 px-4 border-b">Deductions</th>
                    <th className="py-2 px-4 border-b">Net Pay</th>
                    <th className="py-2 px-4 border-b">Status</th>
                    <th className="py-2 px-4 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="py-2 px-4 border-b">{record.user_name}</td>
                      <td className="py-2 px-4 border-b">{record.pay_period}</td>
                      <td className="py-2 px-4 border-b">${record.basic_salary.toFixed(2)}</td>
                      <td className="py-2 px-4 border-b">${record.allowances.toFixed(2)}</td>
                      <td className="py-2 px-4 border-b">${record.deductions.toFixed(2)}</td>
                      <td className="py-2 px-4 border-b font-semibold">${record.net_pay.toFixed(2)}</td>
                      <td className="py-2 px-4 border-b">
                        <span className={`px-2 py-1 rounded ${
                          record.payment_status === 'paid' ? 'bg-green-200' : 
                          record.payment_status === 'pending' ? 'bg-yellow-200' : 'bg-red-200'
                        }`}>
                          {record.payment_status}
                        </span>
                      </td>
                      <td className="py-2 px-4 border-b">
                        <button className="text-blue-500">View Payslip</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showRunForm && (
        <PayrollRunForm 
          onClose={() => setShowRunForm(false)} 
          onSave={initiatePayrollRun}
        />
      )}
    </div>
  );
};

export default PayrollDashboard;
```

### Payroll Run Form Component
```jsx
import React, { useState } from 'react';

const PayrollRunForm = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    run_name: `Payroll Run ${new Date().toLocaleDateString()}`,
    pay_period: new Date().toISOString().slice(0, 7), // YYYY-MM
    process_date: new Date().toISOString().split('T')[0]
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
    
    if (!formData.run_name.trim()) {
      newErrors.run_name = 'Run name is required';
    }
    
    if (!formData.pay_period) {
      newErrors.pay_period = 'Pay period is required';
    }
    
    if (!formData.process_date) {
      newErrors.process_date = 'Process date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const result = await onSave(formData);
    
    if (result.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4">Initiate Payroll Run</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Run Name *
              </label>
              <input
                type="text"
                name="run_name"
                value={formData.run_name}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${errors.run_name ? 'border-red-500' : ''}`}
              />
              {errors.run_name && <p className="text-red-500 text-xs mt-1">{errors.run_name}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pay Period *
              </label>
              <input
                type="month"
                name="pay_period"
                value={formData.pay_period}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${errors.pay_period ? 'border-red-500' : ''}`}
              />
              {errors.pay_period && <p className="text-red-500 text-xs mt-1">{errors.pay_period}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Process Date *
              </label>
              <input
                type="date"
                name="process_date"
                value={formData.process_date}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${errors.process_date ? 'border-red-500' : ''}`}
              />
              {errors.process_date && <p className="text-red-500 text-xs mt-1">{errors.process_date}</p>}
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded">
            <h3 className="font-medium mb-2">Run Details</h3>
            <p className="text-sm text-gray-600">
              This payroll run will process payments for all active employees for the selected pay period.
              Please verify all employee data and payment details before proceeding.
            </p>
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
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Initiate Payroll Run
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PayrollRunForm;
```

## Key Considerations

1. **Permissions**: Different actions require different permissions (`payroll:read`, `payroll:create`)
2. **Data Sensitivity**: Payroll data is highly sensitive; ensure proper access controls
3. **Accuracy**: Payroll calculations must be accurate; implement proper validation
4. **Compliance**: Ensure compliance with local tax laws and regulations
5. **Audit Trail**: Maintain detailed logs of all payroll activities
6. **Security**: Encrypt sensitive financial data both in transit and at rest
7. **Notifications**: Notify employees when their payslips are available