# Leave Management System Interface Description

## Overview
The Leave Management System is a comprehensive HR module that enables organizations to efficiently manage employee leave requests, approvals, reporting, and year-end analysis. The system provides a user-friendly interface for HR personnel and managers to handle all aspects of leave management with intuitive controls and detailed analytics.

## Core Components

### 1. Leave Management View (`LeaveManagementView.tsx`)
The main component that serves as the central hub for all leave management activities. It features a tabbed interface with three primary sections:

#### A. Leave Requests Tab
- **Interactive Statistics Cards**: Five cards displaying key metrics (All Requests, Approved, Declined, Active Now, Pending) with color-coded indicators
- **Search and Filter Controls**: Advanced filtering capabilities with search bar, status filters, leave type filters, and department filters
- **Leave Types Guide**: Visual guide showing all available leave types with icons, limits, and descriptions
- **Leave Requests Table**: Comprehensive table displaying all leave requests with employee details, leave information, and action buttons

#### B. Leave Report Tab
- **Summary Cards**: Four cards showing total leave days, employees on leave, approval rate, and pending reviews
- **Leave Distribution by Type**: Visual breakdown of leave usage by type with progress bars
- **Department Breakdown**: Detailed analysis of leave usage by department with progress indicators

#### C. Year-End Analysis Tab
- **Year-End Header**: Prominent header with gradient background for 2024 analysis
- **Key Metrics**: Total leave days taken, average per employee, unused leave days, and employee count
- **Leave Type Breakdown**: Detailed analysis of each leave type with usage statistics
- **Annual Leave Summary**: Year-end summary of unused annual leave that will be discarded
- **Policy Notes**: Important policy reminders for year-end procedures

### 2. Leave Request Card (`LeaveRequestCard.tsx`)
A compact component displaying pending leave requests in a card format with employee information and quick action buttons for approval or decline.

## Leave Types and Policies

### Available Leave Types
1. **Sick Leave** (3 days/year) - Red color (#ef4444), 🤒 icon
2. **Annual Leave** (14 days/year, 7/half, max 7/request) - Blue color (#3b82f6), 🏖️ icon
3. **Emergency Leave** (No limit) - Amber color (#f59e0b), 🚨 icon
4. **Maternity Leave** (90 days) - Pink color (#ec4899), 🤱 icon
5. **Paternity Leave** (3 days/year) - Purple color (#8b5cf6), 👶 icon
6. **Unpaid Leave** (No limit) - Gray color (#6b7280), 💼 icon
7. **Bereaved Leave** (3 days/year) - Black color (#0f172a), 🕊️ icon

### Annual Leave Policy
- 14 days per year (7 days per half-year)
- Maximum 7 consecutive days per single request
- Unused annual leave is discarded at year-end (no rollover)
- Half-year breakdown tracking (first half, second half)

## User Interface Features

### Search and Filtering
- Global search by name, ID, department, or reason
- Status filtering (All, Approved, Declined, Active, Pending)
- Leave type filtering with visual selection
- Department filtering
- Advanced filter panel with toggle visibility

### Visual Elements
- Color-coded status badges (Success, Danger, Info, Warning)
- Icon-based leave type identification
- Progress bars for leave distribution visualization
- Interactive cards with hover effects
- Responsive grid layouts for all screen sizes

### Data Visualization
- Progress bars showing leave distribution
- Statistical cards with trend indicators
- Department-wise leave usage charts
- Year-end analysis with gradient headers

## Modal Interfaces

### Approval Modal
- Employee information display
- Leave details with type, duration, dates, and reason
- Policy violation warnings for annual leave exceeding 7 days
- Decline reason input for declined requests
- Confirmation buttons for approval/decline actions

### Details Modal
- Comprehensive leave request information
- Employee details with avatar
- Leave type and status indicators
- Date range and duration information
- Reason and covering staff details
- Approval/decline history

## Backend Integration Points

### API Endpoints
```
GET /api/leave/requests - Retrieve all leave requests
POST /api/leave/requests - Submit new leave request
PUT /api/leave/requests/{id}/approve - Approve leave request
PUT /api/leave/requests/{id}/decline - Decline leave request
GET /api/leave/balances - Retrieve leave balances for all employees
GET /api/leave/report - Generate leave reports
GET /api/leave/year-end-analysis - Retrieve year-end analysis data
POST /api/leave/export - Export leave data
```

### Data Models

#### Leave Request Model
```typescript
interface LeaveRequest {
  id: string;           // Unique leave request identifier
  staffId: string;      // ID of the staff member requesting leave
  staffName: string;    // Full name of the staff member
  department: string;   // Department the staff belongs to
  branch: string;       // Branch location
  leaveType: 'Sick' | 'Annual' | 'Emergency' | 'Maternity' | 'Paternity' | 'Unpaid' | 'Bereaved';
  startDate: string;    // Start date of leave (YYYY-MM-DD format)
  endDate: string;      // End date of leave (YYYY-MM-DD format)
  duration: number;     // Number of days requested
  reason: string;       // Reason for the leave request
  status: 'Pending' | 'Approved' | 'Declined' | 'Active'; // Current status
  requestDate: string;  // Date the request was submitted
  approvedBy?: string;  // Name of the person who approved (optional)
  approvalDate?: string; // Date of approval (optional)
  declineReason?: string; // Reason for decline if declined (optional)
  coveringStaff?: string; // Staff member covering duties (optional)
}
```

#### Leave Balance Model
```typescript
interface LeaveBalance {
  staffId: string;      // Staff member ID
  sick: { used: number; total: number }; // Sick leave balance
  annual: { used: number; total: number; firstHalf: number; secondHalf: number; rollover: number }; // Annual leave with half-year breakdown
  paternity: { used: number; total: number }; // Paternity leave balance
  bereaved: { used: number; total: number }; // Bereavement leave balance
  maternity: { used: number; total: number }; // Maternity leave balance
}
```

### Authentication and Authorization
- Role-based access control (HR Manager, Department Manager, Employee)
- JWT token authentication for all API requests
- Permission validation for approval/decline actions

### Error Handling
- Validation for leave request parameters
- Policy compliance checks (e.g., annual leave duration limits)
- Proper error messaging for failed operations

## User Experience Flow

### For HR Managers
1. Navigate to Leave Management section
2. View dashboard with key metrics
3. Filter and search leave requests as needed
4. Review pending requests in the table
5. Approve or decline requests using modal interfaces
6. Access detailed reports and year-end analysis

### For Employees
1. Submit leave requests through employee portal
2. Track request status in their dashboard
3. Receive notifications for approval/decline decisions

## Responsive Design
- Mobile-first approach with responsive grid layouts
- Collapsible filter panels for smaller screens
- Adaptive table layouts with horizontal scrolling on mobile
- Touch-friendly buttons and controls

## Accessibility Features
- Semantic HTML structure
- Proper ARIA labels for interactive elements
- Keyboard navigation support
- Sufficient color contrast ratios
- Screen reader compatibility

## Performance Considerations
- Efficient data fetching with pagination
- Client-side filtering for improved responsiveness
- Lazy loading for large datasets
- Optimized rendering of table components

## Security Measures
- Input validation and sanitization
- Secure API communication with HTTPS
- Role-based access controls
- Audit logging for approval actions