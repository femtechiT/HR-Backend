# Off Days Management System Interface Description

## Overview
The Off Days Management System is a comprehensive HR module that enables organizations to manage employee requests for regular off-days and official duty days. The system provides a streamlined workflow for requesting, approving, and tracking off-day requests with detailed reporting capabilities.

## Core Components

### 1. Off Days View (`OffDaysView.tsx`)
The main component that serves as the central hub for all off-day management activities. It features a tabbed interface with two primary sections:

#### A. Off Day Requests Tab
- **Statistics Cards**: Four cards displaying key metrics (Total Requests, Approved, Declined, Official Duties) with color-coded indicators
- **Search and Filter Controls**: Advanced filtering capabilities with search bar, status filters, department filters, and date range filters
- **Off Day Requests Table**: Comprehensive table displaying all off-day requests with employee details, request information, and action buttons
- **Status Indicators**: Color-coded badges for different request statuses (Approved, Declined, Pending)

#### B. Off Report Tab
- **Summary Cards**: Four cards showing total off days, regular off days, official duties, and approval rates
- **Department Breakdown**: Visual breakdown of off days by department with progress bars
- **Monthly Trend Analysis**: Chart showing monthly trends in off day requests
- **Recent Approvals**: List of recently approved requests with employee details

## Request Types and Policies

### Available Request Types
1. **Regular Off Days**: Personal time off requests for employees
2. **Official Duty**: Work-related assignments requiring employees to be away from their usual workplace

### Request Process
- Employees submit off-day requests with date, reason, and type
- Managers review and approve/decline requests based on business needs
- Approved requests are recorded in the system for tracking purposes

## User Interface Features

### Search and Filtering
- Global search by name, ID, department, or reason
- Status filtering (All, Approved, Declined, Pending, Official Duties)
- Department filtering with dropdown selector
- Date range filtering (All Time, Today, Week, Month, Quarter)
- Toggle filter panel for advanced options

### Visual Elements
- Color-coded status badges (Success, Danger, Warning, Info)
- Icon-based navigation and actions
- Progress bars for department breakdown visualization
- Interactive cards with hover effects
- Responsive grid layouts for all screen sizes

### Data Visualization
- Progress bars showing department-wise off day distribution
- Monthly trend charts with visual indicators
- Statistical cards with trend indicators

## Modal Interfaces

### Approval Modal
- Staff member information display
- Off date and request type details
- Reason for request
- Decline reason input for declined requests
- Confirmation buttons for approval/decline actions
- Special notice for official duty requests

## Backend Integration Points

### API Endpoints
```
GET /api/off-days/requests - Retrieve all off-day requests
POST /api/off-days/requests - Submit new off-day request
PUT /api/off-days/requests/{id}/approve - Approve off-day request
PUT /api/off-days/requests/{id}/decline - Decline off-day request
GET /api/off-days/report - Generate off-day reports
POST /api/off-days/export - Export off-day data
```

### Data Models

#### Off Day Request Model
```typescript
interface OffDayRequest {
  id: string;                           // Unique off-day request identifier
  staffId: string;                      // ID of the staff member requesting off-day
  staffName: string;                    // Full name of the staff member
  department: string;                   // Department the staff belongs to
  branch: string;                       // Branch location
  date: string;                         // Date of the requested off-day (YYYY-MM-DD format)
  reason: string;                       // Reason for the off-day request
  type: 'Regular' | 'Official Duty';    // Type of off-day request
  status: 'Pending' | 'Approved' | 'Declined'; // Current status of the request
  requestDate: string;                  // Date the request was submitted
  approvedBy?: string;                  // Name of the person who approved (optional)
  approvalDate?: string;                // Date of approval (optional)
  declineReason?: string;               // Reason for decline if declined (optional)
}
```

### Authentication and Authorization
- JWT token authentication for all API requests
- Role-based access control (HR Manager, Department Manager, Employee)
- Permission validation for approval/decline actions

### Error Handling
- Validation for off-day request parameters
- Proper error messaging for failed operations

## User Experience Flow

### For HR Managers
1. Navigate to Off Days Management section
2. View dashboard with key metrics
3. Filter and search off-day requests as needed
4. Review pending requests in the table
5. Approve or decline requests using modal interfaces
6. Access detailed reports and trend analysis

### For Employees
1. Submit off-day requests through employee portal
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