# Comprehensive Appraisal System Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Default Metrics & KPIs](#default-metrics--kpi)
4. [Batch Assignment System](#batch-assignment-system)
5. [Self-Assessment Workflow](#self-assessment-workflow)
6. [Data Integration](#data-integration)
7. [API Endpoints](#api-endpoints)
8. [User Stories](#user-stories)
9. [Setup Guide](#setup-guide)
10. [Best Practices](#best-practices)

## Overview

The Intelligent Appraisal System is a comprehensive performance evaluation framework that automatically integrates with existing HR data sources to provide accurate, real-time performance metrics. The system enables organizations to evaluate employee performance across multiple dimensions using both automated calculations and manual assessments.

### Key Features:
- **Automatic Data Integration**: Pulls data from attendance, leave, payroll, and other HR modules
- **Batch Assignment**: Assign KPIs and targets to multiple employees simultaneously
- **Self-Assessment Workflow**: Employees can evaluate themselves with manager review
- **Category-Specific Templates**: Different appraisal templates for different employee categories
- **Real-time Calculations**: Automatic performance score calculations based on actual data
- **Flexible KPI Definitions**: Create custom KPIs using formulas and existing metrics

## System Architecture

### Core Components:
1. **Metrics Library**: Reusable performance indicators that connect to data sources
2. **KPI Definitions**: Strategic performance indicators combining multiple metrics
3. **Appraisal Templates**: Category-specific evaluation frameworks
4. **Targets**: Specific goals assigned to employees
5. **Appraisal Cycles**: Time-bound evaluation periods
6. **Performance Scores**: Calculated results from KPI evaluations

### Data Flow:
```
Existing HR Data (Attendance, Leave, Payroll) 
    ↓
Default Metrics (Attendance Rate, Leave Utilization, etc.)
    ↓
KPI Definitions (Combined metrics with formulas)
    ↓
Appraisal Templates (Category-specific KPI collections)
    ↓
Employee Assignments (KPIs assigned to employees)
    ↓
Automatic Calculations (Real-time score generation)
    ↓
Performance Reports (Visual dashboards and analytics)
```

## Default Metrics & KPIs

The system comes with pre-configured metrics that automatically connect to your existing data sources:

### Default Metrics:
1. **Attendance Rate**
   - Source: `attendance` table
   - Formula: `(days_present / total_working_days) * 100`
   - Categories: All employee types

2. **Leave Utilization**
   - Source: `leave_history` and `leave_allocations` tables
   - Formula: `(days_used / days_allocated) * 100`
   - Categories: All employee types

3. **Punctuality Score**
   - Source: `attendance` table (check-in times)
   - Formula: `(on_time_arrivals / total_arrivals) * 100`
   - Categories: All employee types

4. **Salary Consistency**
   - Source: `payroll_records` table
   - Formula: `(consistent_payments / total_payment_periods) * 100`
   - Categories: All employee types

### Default KPIs:
1. **Overall Performance Score**
   - Formula: `calculateOverallPerformance`
   - Combines: Attendance Rate, Leave Utilization, Punctuality Score
   - Weight: 100%

2. **Reliability Score**
   - Formula: `calculateReliabilityScore`
   - Combines: Attendance Rate (60%), Punctuality Score (40%)
   - Weight: 30%

3. **Stability Score**
   - Formula: `calculateStabilityScore`
   - Combines: Attendance Rate (50%), Leave Utilization (50%)
   - Weight: 25%

## Batch Assignment System

### Purpose
Enable HR administrators to assign KPIs and targets to multiple employees simultaneously, reducing manual effort and ensuring consistency.

### How It Works
1. **Select Employees**: Choose multiple employees from the system
2. **Select KPIs/Targets**: Choose which KPIs or targets to assign
3. **Set Period**: Define the evaluation period
4. **Execute Assignment**: System creates assignments for all selected employees

### API Endpoints
- `POST /api/kpis/batch-assign` - Assign KPIs to multiple employees
- `POST /api/targets/batch-assign` - Assign targets to multiple employees

### Example Request
```json
{
  "employee_ids": [1, 2, 3, 4, 5],
  "kpi_ids": [1, 2, 3],
  "cycle_start_date": "2024-01-01",
  "cycle_end_date": "2024-12-31"
}
```

## Self-Assessment Workflow

### Process Flow
1. **Employee Access**: Employees access their self-assessment portal
2. **Self-Evaluation**: Employees rate themselves on assigned KPIs
3. **Manager Review**: Managers review and adjust employee self-assessments
4. **Final Approval**: HR approves the final scores
5. **Comparison Report**: System generates comparison between self vs manager assessments

### Self-Assessment KPIs
Special KPIs can be created specifically for self-assessment:
- Mark with `is_self_assessment: true`
- Employees can update these scores directly
- Managers can review and override if needed

### API Endpoints
- `GET /api/employees/:id/self-assessment` - Get employee's self-assessment
- `POST /api/employees/:id/self-assessment` - Submit self-assessment
- `PUT /api/employees/:id/self-assessment` - Update self-assessment (by manager/HR)

## Data Integration

### Automatic Data Sources
The system automatically connects to existing HR modules:

#### 1. Attendance Module
- **Data Points**: Daily attendance records, check-in/check-out times
- **Metrics**: Attendance rate, punctuality, late arrivals
- **Integration**: Direct database queries to `attendance` table

#### 2. Leave Module
- **Data Points**: Leave requests, approvals, utilization
- **Metrics**: Leave utilization rate, approval patterns
- **Integration**: Direct database queries to `leave_history` and `leave_allocations` tables

#### 3. Payroll Module
- **Data Points**: Salary consistency, payment history
- **Metrics**: Payment reliability, consistency scores
- **Integration**: Direct database queries to `payroll_records` table

#### 4. Task Management (Future)
- **Data Points**: Task completion rates, project delivery
- **Metrics**: Productivity, efficiency scores
- **Integration**: Planned for future implementation

### Calculation Engine
The system includes a calculation engine that:
- Runs periodic calculations (daily, weekly, monthly)
- Updates performance scores automatically
- Maintains audit trails for all calculations
- Handles complex formulas with multiple data sources

## API Endpoints

### Metrics Management
- `GET /api/metrics` - Get all metrics
- `GET /api/metrics/:id` - Get specific metric
- `GET /api/metrics/categories/:category` - Get metrics by category
- `POST /api/metrics` - Create new metric
- `PUT /api/metrics/:id` - Update metric
- `DELETE /api/metrics/:id` - Delete metric

### KPI Management
- `GET /api/kpis` - Get all KPIs
- `GET /api/kpis/:id` - Get specific KPI
- `GET /api/kpis/categories/:category` - Get KPIs by category
- `POST /api/kpis` - Create new KPI
- `PUT /api/kpis/:id` - Update KPI
- `DELETE /api/kpis/:id` - Delete KPI
- `POST /api/kpis/batch-assign` - Batch assign KPIs to employees

### Appraisal Templates
- `GET /api/appraisal-templates` - Get all templates
- `GET /api/appraisal-templates/:id` - Get specific template
- `GET /api/appraisal-templates/categories/:category` - Get templates by category
- `POST /api/appraisal-templates` - Create new template
- `PUT /api/appraisal-templates/:id` - Update template
- `DELETE /api/appraisal-templates/:id` - Delete template

### Targets Management
- `GET /api/targets` - Get all targets
- `GET /api/targets/employee/:employeeId` - Get targets for employee
- `GET /api/targets/template/:templateId` - Get targets for template
- `GET /api/targets/categories/:category` - Get targets by category
- `POST /api/targets` - Create new target
- `PUT /api/targets/:id` - Update target
- `DELETE /api/targets/:id` - Delete target
- `POST /api/targets/batch-assign` - Batch assign targets

### Appraisal Cycles
- `GET /api/appraisals` - Get all appraisal cycles
- `GET /api/appraisals/:id` - Get specific cycle
- `GET /api/appraisals/template/:templateId` - Get cycles by template
- `POST /api/appraisals` - Create new appraisal cycle
- `PUT /api/appraisals/:id` - Update appraisal cycle
- `DELETE /api/appraisals/:id` - Delete appraisal cycle
- `POST /api/appraisals/:id/start` - Start appraisal cycle
- `POST /api/appraisals/:id/end` - End appraisal cycle

### Performance Management
- `GET /api/performance/employee/:employeeId` - Get employee performance
- `GET /api/performance/template/:templateId` - Get performance by template
- `GET /api/performance/categories/:category` - Get performance by category
- `GET /api/performance/period/:startDate/:endDate` - Get performance by period
- `POST /api/performance/recalculate` - Recalculate all scores

### Employee Performance
- `GET /api/employees/:id/performance` - Get employee's performance history
- `GET /api/employees/:id/appraisals` - Get employee's appraisal history
- `GET /api/employees/:id/appraisals/template/:templateId` - Get employee's appraisals by template
- `POST /api/employees/:id/self-assessment` - Submit self-assessment
- `GET /api/employees/:id/self-assessment` - Get self-assessment

### Permissions Management
- `GET /api/permissions/available` - Get all possible permissions
- `GET /api/roles/:roleId/permissions` - Get permissions for role
- `POST /api/roles/:roleId/permissions` - Assign permissions to role
- `DELETE /api/roles/:roleId/permissions` - Remove permissions from role

## User Stories

### HR Administrator
**As an HR administrator, I want to:**
1. Create appraisal templates for different employee categories
2. Assign KPIs to multiple employees at once
3. Monitor overall performance across the organization
4. Generate performance reports by department/category
5. Manage self-assessment workflows
6. Set targets for employees automatically based on historical data

**Implementation:**
- Use batch assignment endpoints to assign KPIs to multiple employees
- Create category-specific templates with appropriate KPIs
- Access performance dashboards for organization-wide insights
- Set up automated calculation workers for regular updates

### Department Manager
**As a department manager, I want to:**
1. View performance of my team members
2. Review and approve self-assessments
3. Assign department-specific KPIs to my team
4. Compare self-assessment vs my evaluation
5. Identify performance improvement areas

**Implementation:**
- Access employee performance data through role-based permissions
- Use manager-specific endpoints for review and approval
- Create department-specific KPIs using the metrics library
- Generate comparison reports between self and manager assessments

### Employee
**As an employee, I want to:**
1. View my assigned KPIs and targets
2. Submit my self-assessment
3. Track my performance over time
4. Understand how my performance is calculated
5. Set personal development goals

**Implementation:**
- Access self-service portal for viewing assignments
- Submit self-assessments through dedicated endpoints
- View performance history and trends
- Receive explanations of how scores are calculated

### System Administrator
**As a system administrator, I want to:**
1. Configure the calculation engine
2. Set up automated workflows
3. Manage user permissions for appraisal system
4. Monitor system performance and data accuracy
5. Backup and restore appraisal data

**Implementation:**
- Configure calculation intervals and parameters
- Set up role-based permissions for different user types
- Monitor system logs and performance metrics
- Implement backup strategies for appraisal data

## Setup Guide

### 1. Initial Setup
After installing the system, run the appraisal migration to create all necessary tables:

```bash
npm run migrate-appraisal
```

This will:
- Create all appraisal-related database tables
- Insert default metrics that connect to existing data sources
- Create default KPIs using existing HR data
- Set up default appraisal templates for each category
- Add all appraisal permissions to admin role

### 2. Configure Data Sources
The system automatically connects to existing HR modules:
- Attendance data from `attendance` table
- Leave data from `leave_history` and `leave_allocations` tables
- Payroll data from `payroll_records` table

### 3. Create Custom Metrics (Optional)
If you need additional metrics beyond the defaults:

```javascript
// Example: Create a new metric
POST /api/metrics
{
  "name": "Project Delivery Rate",
  "description": "Percentage of projects delivered on time",
  "data_type": "percentage",
  "formula": "calculateProjectDeliveryRate",
  "data_source": "task_management_module",
  "categories": ["Teacher", "Sales", "Inventory", "Technician"],
  "is_active": true
}
```

### 4. Create Appraisal Templates
Create templates for different employee categories:

```javascript
// Example: Create teacher appraisal template
POST /api/appraisal-templates
{
  "name": "Teacher Appraisal Template",
  "description": "Performance evaluation for teaching staff",
  "category": "Teacher",
  "kpi_ids": [1, 2, 3], // Overall Performance, Reliability, Stability
  "is_active": true
}
```

### 5. Set Up Calculation Workers
Configure the system to run periodic calculations:

```javascript
// Example: Run monthly calculations
// This can be set up as a cron job or background worker
await runPeriodicCalculations();
```

### 6. Assign Permissions
Set up role-based permissions for the appraisal system:

```javascript
// Example: Grant appraisal permissions to HR Manager role
POST /api/roles/3/permissions
{
  "permissions": [
    "appraisal_template.read",
    "appraisal_template.create", 
    "kpi.read",
    "kpi.create",
    "target.read",
    "appraisal.read",
    "performance.read"
  ]
}
```

## Best Practices

### 1. Data Quality
- Ensure existing HR data (attendance, leave, payroll) is accurate and up-to-date
- Regularly validate data sources to maintain calculation accuracy
- Implement data validation rules to prevent invalid entries

### 2. Performance Optimization
- Use database indexes on frequently queried fields
- Implement caching for frequently accessed metrics
- Schedule heavy calculations during off-peak hours

### 3. Security
- Implement proper role-based access controls
- Encrypt sensitive performance data
- Maintain audit trails for all performance changes
- Regular security audits of the appraisal system

### 4. User Experience
- Provide clear explanations of how KPIs are calculated
- Offer training materials for managers and employees
- Create intuitive dashboards for performance visualization
- Implement notification systems for important events

### 5. Maintenance
- Regularly review and update KPI formulas
- Monitor calculation accuracy and adjust as needed
- Keep appraisal templates current with business needs
- Backup appraisal data regularly

## Troubleshooting

### Common Issues:
1. **Calculation Errors**: Verify data sources have valid data for the requested period
2. **Permission Issues**: Check that user roles have appropriate appraisal permissions
3. **Performance Issues**: Ensure database indexes are properly set up
4. **Integration Problems**: Verify that existing HR modules are accessible

### Debugging Tips:
- Check system logs for calculation errors
- Verify database connections and permissions
- Test individual metrics before creating complex KPIs
- Use the test endpoints to validate API functionality

## Future Enhancements

### Planned Features:
1. **Advanced Analytics**: Predictive performance modeling
2. **AI Recommendations**: Suggested KPIs based on role and performance
3. **Integration Hub**: Connect with external systems (CRM, ERP, etc.)
4. **Mobile App Support**: Performance tracking on mobile devices
5. **Advanced Reporting**: Custom report builder with drag-and-drop interface

### Integration Possibilities:
- **CRM Systems**: Sales performance integration
- **Project Management**: Task completion and delivery metrics
- **Learning Management**: Training completion and skill development
- **Customer Feedback**: Client satisfaction scores
- **Financial Systems**: Revenue and cost center metrics

This appraisal system provides a comprehensive, automated solution for employee performance evaluation that leverages your existing HR data infrastructure while maintaining flexibility for custom requirements.