# Complete Appraisal System Workflow

## Overview
This document outlines the complete workflow for the intelligent appraisal system, including how KPIs are calculated from existing data sources, batch assignments, and self-assessment processes.

## System Architecture

### 1. Data Flow
```
Existing HR Data → Metrics Library → KPI Definitions → Appraisal Templates → Employee Assignments → Automatic Calculations → Performance Scores
```

### 2. Core Components
- **Metrics Library**: Reusable performance indicators that connect to data sources
- **KPI Definitions**: Strategic indicators combining multiple metrics
- **Appraisal Templates**: Category-specific evaluation frameworks
- **KPI Assignments**: Links employees to specific KPIs
- **KPI Scores**: Calculated performance results
- **Performance Scores**: Aggregated performance metrics

## Complete Appraisal Workflow

### Phase 1: Setup & Configuration

#### 1.1 Create Metrics (Connected to Data Sources)
```http
POST /api/metrics
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Attendance Rate",
  "description": "Percentage of days present vs total working days",
  "data_type": "percentage",
  "formula": "calculateAttendanceRate",
  "data_source": "attendance_module",
  "categories": ["Teacher", "Sales", "Inventory", "Technician"],
  "is_active": true
}
```

#### 1.2 Create KPI Definitions (Using Metrics)
```http
POST /api/kpis
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Reliability Score",
  "description": "Combination of attendance and punctuality metrics",
  "formula": "calculateReliabilityScore",
  "weight": 30.00,
  "metric_ids": [1], // Attendance Rate metric
  "categories": ["Teacher", "Sales", "Inventory", "Technician"],
  "is_active": true
}
```

#### 1.3 Create Appraisal Templates
```http
POST /api/appraisal-templates
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Teacher Appraisal Template",
  "description": "Performance evaluation for teaching staff",
  "category": "Teacher",
  "kpi_ids": [1, 2], // Reliability Score, etc.
  "is_active": true
}
```

### Phase 2: Employee Assignment

#### 2.1 Single Assignment
```http
POST /api/kpi-assignments
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "user_id": 1,
  "kpi_definition_id": 1,
  "cycle_start_date": "2024-01-01",
  "cycle_end_date": "2024-12-31",
  "custom_target_value": 90.00,
  "notes": "Annual performance review for teacher"
}
```

#### 2.2 Batch Assignment (Multiple Employees)
```http
POST /api/kpis/batch-assign
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "employee_ids": [1, 2, 3, 4, 5],
  "kpi_ids": [1, 2],
  "cycle_start_date": "2024-01-01",
  "cycle_end_date": "2024-12-31"
}
```

### Phase 3: Target Setting

#### 3.1 Set Individual Targets
```http
POST /api/targets
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "kpi_id": 1,
  "employee_id": 1,
  "target_type": "standard",
  "target_value": 90.00,
  "period_start": "2024-01-01",
  "period_end": "2024-12-31"
}
```

#### 3.2 Batch Target Assignment
```http
POST /api/targets/batch-assign
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "employee_ids": [1, 2, 3, 4, 5],
  "kpi_id": 1,
  "target_type": "standard",
  "target_value": 90.00,
  "period_start": "2024-01-01",
  "period_end": "2024-12-31"
}
```

### Phase 4: Performance Calculation

#### 4.1 Automatic Calculations
The system automatically calculates KPI scores using data from existing modules:

**Attendance Rate Calculation:**
```typescript
// Pulls from attendance table
const calculateAttendanceRate = async (employeeId: number, startDate: Date, endDate: Date) => {
  // Get total working days in period
  const totalDays = await getTotalWorkingDays(employeeId, startDate, endDate);
  
  // Get days present in period
  const presentDays = await getPresentDays(employeeId, startDate, endDate);
  
  // Calculate rate
  return (presentDays / totalDays) * 100;
};
```

**Leave Utilization Calculation:**
```typescript
// Pulls from leave_history and leave_allocations tables
const calculateLeaveUtilization = async (employeeId: number, startDate: Date, endDate: Date) => {
  // Get allocated leave days
  const allocatedDays = await getAllocatedLeaveDays(employeeId, startDate, endDate);
  
  // Get used leave days
  const usedDays = await getUsedLeaveDays(employeeId, startDate, endDate);
  
  // Calculate utilization
  return allocatedDays > 0 ? (usedDays / allocatedDays) * 100 : 0;
};
```

#### 4.2 Manual Override Capability
```http
PATCH /api/kpi-scores/:id
Authorization: Bearer <manager_token>
Content-Type: application/json

{
  "override_value": 95.00,
  "override_reason": "Exceptional performance during project delivery"
}
```

### Phase 5: Self-Assessment Workflow

#### 5.1 Employee Self-Assessment
```http
POST /api/employees/:id/self-assessment
Authorization: Bearer <employee_token>
Content-Type: application/json

{
  "appraisal_assignment_id": 1,
  "self_assessment_data": {
    "overall_performance_rating": 4,
    "strengths": ["Communication", "Problem-solving"],
    "improvement_areas": ["Time management"],
    "goals_achieved": ["Completed project on time"],
    "comments": "Had a productive year with some challenges in Q2"
  }
}
```

#### 5.2 Manager Review
- Manager accesses employee's self-assessment
- Compares with system-calculated scores
- Provides feedback and final evaluation
- Approves or adjusts scores as needed

### Phase 6: Performance Review & Reporting

#### 6.1 View Performance Scores
```http
GET /api/performance/employee/:employeeId
Authorization: Bearer <authorized_token>
```

#### 6.2 View Appraisal History
```http
GET /api/employees/:id/appraisals
Authorization: Bearer <authorized_token>
```

#### 6.3 Generate Reports
```http
GET /api/reports/appraisals
Authorization: Bearer <admin_token>
```

## Data Integration Points

### 1. Attendance Module Integration
- **Data Source**: `attendance` table
- **Metrics Calculated**:
  - Attendance Rate: `(present_days / total_working_days) * 100`
  - Punctuality Score: `(on_time_arrivals / total_arrivals) * 100`
  - Late Arrival Frequency: Count of late arrivals per period

### 2. Leave Module Integration
- **Data Source**: `leave_history` and `leave_allocations` tables
- **Metrics Calculated**:
  - Leave Utilization: `(days_used / days_allocated) * 100`
  - Leave Balance: Remaining leave days
  - Leave Pattern Analysis: Frequency and timing of leave requests

### 3. Payroll Module Integration
- **Data Source**: `payroll_records` table
- **Metrics Calculated**:
  - Payment Consistency: `(on_time_payments / total_payments) * 100`
  - Salary Growth: Year-over-year salary changes
  - Component Utilization: Usage of different salary components

## Category-Specific Appraisals

### 1. Teacher Appraisal
- **KPIs**: Classroom attendance, Student feedback, Lesson plan compliance, Professional development
- **Metrics**: Teaching effectiveness, Student performance improvement, Parent satisfaction
- **Self-Assessment**: Teaching methodology, Student engagement, Professional growth

### 2. Sales Executive Appraisal
- **KPIs**: Sales targets, Lead conversion rate, Customer retention, New client acquisition
- **Metrics**: Revenue generated, Deal closure rate, Customer satisfaction
- **Self-Assessment**: Sales techniques, Customer relationship management, Market knowledge

### 3. Inventory Officer Appraisal
- **KPIs**: Stock accuracy, Inventory turnover, Order fulfillment, Damage control
- **Metrics**: Inventory count accuracy, Reorder efficiency, Waste reduction
- **Self-Assessment**: Process improvements, Cost reduction initiatives, Supply chain management

### 4. Technician Appraisal
- **KPIs**: Repair completion rate, Equipment uptime, Safety compliance, Technical skills
- **Metrics**: Problem resolution time, Equipment performance, Safety incidents
- **Self-Assessment**: Technical proficiency, Safety awareness, Continuous learning

## Automation Features

### 1. Periodic Calculations
- **Daily**: Update attendance-based metrics
- **Weekly**: Calculate weekly performance scores
- **Monthly**: Generate monthly performance reports
- **Quarterly**: Conduct quarterly appraisal reviews
- **Annually**: Complete annual performance evaluations

### 2. Notification System
- **Upcoming Appraisals**: Notify employees and managers of pending appraisals
- **Self-Assessment Due**: Remind employees to complete self-assessments
- **Manager Reviews**: Alert managers of pending reviews
- **Results Published**: Notify employees of completed appraisals

### 3. Batch Processing
- **Mass Assignment**: Assign KPIs to multiple employees simultaneously
- **Bulk Calculations**: Calculate scores for all employees in a department
- **Automated Distribution**: Distribute appraisal assignments automatically

## Security & Permissions

### 1. Role-Based Access
- **HR Admin**: Full access to all appraisal data and functionality
- **Department Manager**: Access to appraisals for their department
- **Employee**: Access to their own appraisal data and self-assessment
- **Finance**: Access to performance data for compensation decisions

### 2. Data Privacy
- **Employee Data Isolation**: Employees can only see their own data
- **Manager Scope Limitation**: Managers only see their direct reports
- **Audit Trail**: All appraisal-related actions are logged

## Best Practices

### 1. For HR Administrators
- Regularly review and update KPI formulas
- Ensure data sources are accurate and up-to-date
- Monitor system calculation accuracy
- Maintain category-specific templates appropriately

### 2. For Managers
- Regularly review team performance metrics
- Provide timely feedback during appraisal cycles
- Compare self-assessment with objective metrics
- Use data-driven insights for development planning

### 3. For Employees
- Participate actively in self-assessment process
- Understand how KPIs are calculated from actual data
- Set realistic targets based on historical performance
- Use performance insights for career development

## Troubleshooting

### Common Issues
1. **KPI Scores Not Updating**: Check if data sources are current
2. **Self-Assessment Not Visible**: Verify permissions and assignment status
3. **Batch Assignment Failures**: Check employee IDs and KPI validity
4. **Calculation Discrepancies**: Review formula definitions and data sources

### Resolution Steps
1. Verify data source integrity and completeness
2. Check permission assignments and role configurations
3. Validate KPI formulas and metric connections
4. Review calculation logs for errors or anomalies

This comprehensive workflow ensures that the appraisal system is fully automated, data-driven, and provides meaningful insights for employee performance evaluation and development.