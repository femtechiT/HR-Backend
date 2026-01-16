 Appraisals System Strategy

  Overview
  A simple, dynamic system to evaluate employee performance using existing data from attendance, leave, and other modules. The system allows HR admins to create performance
  metrics, set targets, and conduct appraisals without complex coding.

  Core Components

  1. Metrics Library
   - Purpose: Reusable performance indicators
   - Examples: Attendance rate, Leave utilization, Compliance score
   - Management: Create/edit through admin interface
   - Reuse: Same metric can be used in multiple KPIs

  2. KPI Definitions 
   - Purpose: Strategic performance indicators
   - Examples: Reliability score, Productivity index, Compliance rate
   - Formulas: Simple calculations like (attendance_rate * 0.6) + (compliance_score * 0.4)

  3. Targets
   - Purpose: Performance goals for employees
   - Types: Minimum, Standard, Stretch goals
   - Assignment: Individual, departmental, or role-based

  4. Appraisal Cycles
   - Purpose: Time-bounded evaluation periods
   - Examples: Quarterly, Bi-annually, Annually
   - Workflow: Self-assessment → Manager review → Final rating

  Data Translation Strategy

  Existing Data → Performance Metrics
   - Attendance Data → Reliability score, Punctuality rating
   - Leave Data → Availability metrics, Planning effectiveness
   - Form Submissions → Compliance rate, Documentation quality
   - Staff Data → Tenure impact, Role competency

  Simple Formula Examples
   - attendance_rate = (present_days / total_work_days) * 100
   - reliability_score = (attendance_rate * 0.6) + (leave_balance * 0.4)
   - compliance_rate = (approved_forms / total_forms) * 100

  User Stories

  HR Admin Perspective

  As an HR Admin, I want to:

  1. Create Performance Metrics
   - Navigate to "Performance → Metrics Library"
   - Click "Add New Metric"
   - Enter: Name ("Attendance Rate"), Type (Numeric), Formula ("present_days / total_days * 100")
   - Save and use in multiple KPIs

  2. Define KPIs for Departments
   - Go to "Performance → KPI Definitions"
   - Create "Customer Service Performance"
   - Select metrics: Attendance Rate (40%), Compliance Score (30%), Response Time (30%)
   - Formula: (attendance_rate * 0.4) + (compliance_score * 0.3) + (response_time_score * 0.3)

  3. Set Performance Targets
   - Navigate to "Performance → Targets"
   - Select department: "Sales Team"
   - Set period: "Q1 2026"
   - Define targets:
     - Minimum: 80% attendance
     - Standard: 90% attendance
     - Stretch: 95% attendance

  4. Conduct Appraisals
   - Go to "Performance → Appraisal Cycles"
   - Create "Q1 2026 Appraisals"
   - Select employees and assign relevant KPIs
   - Set timeline and approval workflow

  5. Monitor Performance
   - View dashboard showing all employee scores
   - See who is meeting/exceeding/falling below targets
   - Generate reports for management review

  Manager Perspective

  As a Manager, I want to:

  1. Review My Team's Performance
   - Log in and see "Team Performance Dashboard"
   - View current scores for all direct reports
   - Identify team members who need support

  2. Conduct Performance Reviews
   - Access "My Team → Performance Reviews"
   - Review self-assessment and system-calculated scores
   - Add my evaluation and feedback
   - Submit for HR approval

  3. Set Individual Goals
   - Go to "Team Members → Individual Targets"
   - Adjust company targets for specific employees based on role/level
   - Track progress toward goals

  Employee Perspective

  As an Employee, I want to:

  1. View My Performance Score
   - Log in and see "My Performance Dashboard"
   - View current scores and how they compare to targets
   - See historical trends and improvement areas

  2. Complete Self-Assessment
   - Access "My Performance → Self-Assessment"
   - Evaluate my own performance against set criteria
   - Submit for manager review

  3. Understand Expectations
   - See what metrics I'm being evaluated on
   - Know the targets I need to achieve
   - Get feedback on my performance

  API Endpoints

  Metrics Management
   - GET /api/metrics - List all available metrics
   - POST /api/metrics - Create new metric
   - GET /api/metrics/:id - Get specific metric
   - PUT /api/metrics/:id - Update metric
   - DELETE /api/metrics/:id - Delete metric

  KPI Definitions
   - GET /api/kpis - List all KPI definitions
   - POST /api/kpis - Create new KPI
   - GET /api/kpis/:id - Get specific KPI
   - PUT /api/kpis/:id - Update KPI
   - DELETE /api/kpis/:id - Delete KPI

  Targets Management
   - GET /api/targets - List all targets
   - POST /api/targets - Create new target assignment
   - GET /api/targets/:id - Get specific target
   - PUT /api/targets/:id - Update target
   - DELETE /api/targets/:id - Delete target
   - GET /api/targets/employee/:employeeId - Get targets for specific employee
   - GET /api/targets/department/:departmentId - Get targets for specific department

  Performance Scores
   - GET /api/performance/employee/:employeeId - Get performance scores for employee
   - GET /api/performance/department/:departmentId - Get performance scores for department
   - GET /api/performance/period/:startDate/:endDate - Get performance for specific period
   - POST /api/performance/recalculate - Recalculate scores for all employees

  Appraisal Cycles
   - GET /api/appraisals - List all appraisal cycles
   - POST /api/appraisals - Create new appraisal cycle
   - GET /api/appraisals/:id - Get specific appraisal cycle
   - PUT /api/appraisals/:id - Update appraisal cycle
   - DELETE /api/appraisals/:id - Delete appraisal cycle
   - POST /api/appraisals/:id/start - Start appraisal cycle
   - POST /api/appraisals/:id/end - End appraisal cycle

  Employee Performance
   - GET /api/employees/:id/performance - Get employee's performance history
   - GET /api/employees/:id/appraisals - Get employee's appraisal history
   - POST /api/employees/:id/self-assessment - Submit self-assessment
   - GET /api/employees/:id/self-assessment - Get employee's self-assessment

  Database Schema

  metrics_library
   - id (Primary Key)
   - name (String)
   - description (Text)
   - data_type (Enum: numeric, percentage, boolean, rating)
   - formula (Text)
   - data_source (String)
   - is_active (Boolean)
   - created_by (Foreign Key: users)
   - created_at (Timestamp)
   - updated_at (Timestamp)

  kpi_definitions
   - id (Primary Key)
   - name (String)
   - description (Text)
   - formula (Text)
   - weight (Decimal)
   - metric_ids (JSON Array)
   - is_active (Boolean)
   - created_by (Foreign Key: users)
   - created_at (Timestamp)
   - updated_at (Timestamp)

  targets
   - id (Primary Key)
   - kpi_id (Foreign Key: kpi_definitions)
   - employee_id (Foreign Key: staff)
   - department_id (Foreign Key: branches)
   - target_type (Enum: minimum, standard, stretch)
   - target_value (Decimal)
   - period_start (Date)
   - period_end (Date)
   - created_by (Foreign Key: users)
   - created_at (Timestamp)
   - updated_at (Timestamp)

  performance_scores
   - id (Primary Key)
   - employee_id (Foreign Key: staff)
   - kpi_id (Foreign Key: kpi_definitions)
   - score (Decimal)
   - achieved_value (Decimal)
   - period_start (Date)
   - period_end (Date)
   - calculated_at (Timestamp)
   - calculated_by (Foreign Key: users)

  appraisal_cycles
   - id (Primary Key)
   - name (String)
   - description (Text)
   - start_date (Date)
   - end_date (Date)
   - status (Enum: draft, active, completed, cancelled)
   - created_by (Foreign Key: users)
   - created_at (Timestamp)
   - updated_at (Timestamp)

  Implementation Plan

  Phase 1: Core Metrics (Week 1)
   - Create metrics library with basic attendance/leave metrics
   - Build simple formula calculator
   - Connect to existing attendance and leave data
   - Implement basic API endpoints

  Phase 2: KPI Definitions (Week 2) 
   - Add KPI creation interface
   - Implement formula builder
   - Allow combination of multiple metrics
   - Create KPI management endpoints

  Phase 3: Targets & Appraisals (Week 3)
   - Add target setting functionality
   - Create appraisal cycle management
   - Build evaluation workflow
   - Implement target assignment endpoints

  Phase 4: Reporting & Analytics (Week 4)
   - Add performance dashboards
   - Generate reports
   - Trend analysis
   - Performance score calculation endpoints

  This system leverages existing data to create meaningful performance evaluations without complex infrastructure, focusing on simplicity and practical use.


   📊 Appraisals System Strategy - Enhanced

  Overview
  A simple, dynamic system to evaluate employee performance using existing data from attendance, leave, and other modules. The system allows HR admins to create performance
  metrics, set targets, and conduct appraisals without complex coding. The system supports multiple appraisal templates for different employee categories and comprehensive
  permissions.

  Core Components

  1. Metrics Library
   - Purpose: Reusable performance indicators
   - Examples: Attendance rate, Leave utilization, Compliance score
   - Management: Create/edit through admin interface
   - Reuse: Same metric can be used in multiple KPIs
   - Category-Specific: Metrics can be tagged for specific employee categories (Teachers, Sales, etc.)

  2. KPI Definitions 
   - Purpose: Strategic performance indicators
   - Examples: Reliability score, Productivity index, Compliance rate
   - Formulas: Simple calculations like (attendance_rate * 0.6) + (compliance_score * 0.4)
   - Category Restrictions: KPIs can be restricted to specific employee categories

  3. Targets
   - Purpose: Performance goals for employees
   - Types: Minimum, Standard, Stretch goals
   - Assignment: Individual, departmental, role-based, or category-based
   - Category-Specific: Different targets for different employee categories

  4. Appraisal Templates
   - Purpose: Category-specific evaluation frameworks
   - Examples: Teachers Appraisal, Sales Executive Appraisal, Inventory Officer Appraisal, Technician Appraisal
   - Customization: Each template can have different KPIs, targets, and evaluation criteria
   - Multiple Active: Multiple templates can run simultaneously

  5. Permissions System
   - Granular Access: Specific permissions for each appraisal category
   - Role-Based: Different access levels for HR, Managers, and Employees
   - Template-Specific: Permissions tied to specific appraisal templates

  Data Translation Strategy

  Existing Data → Performance Metrics
   - Attendance Data → Reliability score, Punctuality rating
   - Leave Data → Availability metrics, Planning effectiveness
   - Form Submissions → Compliance rate, Documentation quality
   - Staff Data → Tenure impact, Role competency

  Simple Formula Examples
   - attendance_rate = (present_days / total_work_days) * 100
   - reliability_score = (attendance_rate * 0.6) + (leave_balance * 0.4)
   - compliance_rate = (approved_forms / total_forms) * 100

  Category-Specific Appraisal Templates

  Teachers Appraisal Template
   - KPIs: Classroom attendance, Student feedback, Lesson plan compliance, Professional development
   - Metrics: Teaching effectiveness, Student performance improvement, Parent satisfaction
   - Permissions: Academic heads, HR, Department managers

  Sales Executive Appraisal Template
   - KPIs: Sales targets, Lead conversion rate, Customer retention, New client acquisition
   - Metrics: Revenue generated, Deal closure rate, Customer satisfaction
   - Permissions: Sales managers, Regional heads, HR

  Inventory Officer Appraisal Template
   - KPIs: Stock accuracy, Inventory turnover, Order fulfillment, Damage control
   - Metrics: Inventory count accuracy, Reorder efficiency, Waste reduction
   - Permissions: Operations managers, Warehouse supervisors, HR

  Technician Appraisal Template
   - KPIs: Repair completion rate, Equipment uptime, Safety compliance, Technical skills
   - Metrics: Problem resolution time, Equipment performance, Safety incidents
   - Permissions: Technical supervisors, Maintenance managers, HR

  User Stories

  HR Admin Perspective

  As an HR Admin, I want to:

  1. Create Performance Metrics
   - Navigate to "Performance → Metrics Library"
   - Click "Add New Metric"
   - Enter: Name ("Attendance Rate"), Type (Numeric), Formula ("present_days / total_days * 100")
   - Select categories this metric applies to (Teachers, Sales, etc.)
   - Save and use in multiple KPIs

  2. Define KPIs for Categories
   - Go to "Performance → KPI Definitions"
   - Create "Customer Service Performance"
   - Select applicable categories: Sales, Customer Service
   - Select metrics: Attendance Rate (40%), Compliance Score (30%), Response Time (30%)
   - Formula: (attendance_rate * 0.4) + (compliance_score * 0.3) + (response_time_score * 0.3)

  3. Create Category-Specific Appraisal Templates
   - Navigate to "Performance → Appraisal Templates"
   - Create "Teachers Appraisal Template"
   - Select KPIs relevant to teachers
   - Set evaluation criteria and weights
   - Assign to "Teachers" category

  4. Set Category-Specific Targets
   - Navigate to "Performance → Targets"
   - Select template: "Teachers Appraisal"
   - Select category: "Teachers"
   - Set period: "Q1 2026"
   - Define targets:
     - Minimum: 85% classroom attendance
     - Standard: 90% classroom attendance
     - Stretch: 95% classroom attendance

  5. Manage Multiple Active Templates
   - View all active appraisal templates
   - Start/stop specific templates independently
   - Monitor progress across different employee categories

  6. Configure Permissions
   - Set permissions for each appraisal template
   - Assign access to specific roles (HR, Managers, etc.)
   - Control who can view, edit, or approve appraisals

  Manager Perspective

  As a Manager, I want to:

  1. Review My Team's Performance
   - Log in and see "Team Performance Dashboard"
   - View current scores for all direct reports in my category
   - Identify team members who need support

  2. Conduct Category-Specific Appraisals
   - Access "My Team → Performance Reviews"
   - See only appraisals relevant to my employee category
   - Review self-assessment and system-calculated scores
   - Add my evaluation and feedback
   - Submit for HR approval

  3. Set Individual Goals Within Category Standards
   - Go to "Team Members → Individual Targets"
   - Adjust category targets for specific employees based on role/level
   - Track progress toward goals

  Employee Perspective

  As an Employee, I want to:

  1. View My Category-Specific Performance Score
   - Log in and see "My Performance Dashboard"
   - View scores relevant to my category (Teacher, Sales, etc.)
   - See how I compare to category-specific targets
   - See historical trends and improvement areas

  2. Complete Relevant Self-Assessment
   - Access "My Performance → Self-Assessment"
   - Only see evaluation criteria relevant to my category
   - Evaluate my own performance against set criteria
   - Submit for manager review

  3. Understand Category-Specific Expectations
   - See what metrics I'm being evaluated on based on my category
   - Know the category-specific targets I need to achieve
   - Get feedback on my performance

  Permissions System

  Permission Categories
   - appraisal_template.read - View appraisal templates
   - appraisal_template.create - Create new appraisal templates
   - appraisal_template.update - Update appraisal templates
   - appraisal_template.delete - Delete appraisal templates
   - metric.read - View metrics
   - metric.create - Create metrics
   - metric.update - Update metrics
   - metric.delete - Delete metrics
   - kpi.read - View KPIs
   - kpi.create - Create KPIs
   - kpi.update - Update KPIs
   - kpi.delete - Delete KPIs
   - target.read - View targets
   - target.create - Create targets
   - target.update - Update targets
   - target.delete - Delete targets
   - appraisal.read - View appraisals
   - appraisal.create - Create appraisals
   - appraisal.update - Update appraisals
   - appraisal.submit - Submit appraisals
   - performance.read - View performance scores

  Role-Based Permissions
   - HR Admin: Full access to all appraisal features
   - Department Manager: Access to appraisals for their department/category
   - Team Leader: Access to appraisals for their direct reports
   - Employee: Access to view their own appraisals and submit self-assessments

  API Endpoints

  Metrics Management
   - GET /api/metrics - List all available metrics
   - POST /api/metrics - Create new metric
   - GET /api/metrics/:id - Get specific metric
   - PUT /api/metrics/:id - Update metric
   - DELETE /api/metrics/:id - Delete metric
   - GET /api/metrics/categories/:category - Get metrics for specific category

  KPI Definitions
   - GET /api/kpis - List all KPI definitions
   - POST /api/kpis - Create new KPI
   - GET /api/kpis/:id - Get specific KPI
   - PUT /api/kpis/:id - Update KPI
   - DELETE /api/kpis/:id - Delete KPI
   - GET /api/kpis/categories/:category - Get KPIs for specific category

  Appraisal Templates
   - GET /api/appraisal-templates - List all appraisal templates
   - POST /api/appraisal-templates - Create new appraisal template
   - GET /api/appraisal-templates/:id - Get specific template
   - PUT /api/appraisal-templates/:id - Update template
   - DELETE /api/appraisal-templates/:id - Delete template
   - GET /api/appraisal-templates/categories/:category - Get templates for specific category

  Targets Management
   - GET /api/targets - List all targets
   - POST /api/targets - Create new target assignment
   - GET /api/targets/:id - Get specific target
   - PUT /api/targets/:id - Update target
   - DELETE /api/targets/:id - Delete target
   - GET /api/targets/employee/:employeeId - Get targets for specific employee
   - GET /api/targets/department/:departmentId - Get targets for specific department
   - GET /api/targets/template/:templateId - Get targets for specific template
   - GET /api/targets/categories/:category - Get targets for specific category

  Performance Scores
   - GET /api/performance/employee/:employeeId - Get performance scores for employee
   - GET /api/performance/department/:departmentId - Get performance scores for department
   - GET /api/performance/period/:startDate/:endDate - Get performance for specific period
   - POST /api/performance/recalculate - Recalculate scores for all employees
   - GET /api/performance/template/:templateId - Get scores for specific template
   - GET /api/performance/categories/:category - Get scores for specific category

  Appraisal Cycles
   - GET /api/appraisals - List all appraisal cycles
   - POST /api/appraisals - Create new appraisal cycle
   - GET /api/appraisals/:id - Get specific appraisal cycle
   - PUT /api/appraisals/:id - Update appraisal cycle
   - DELETE /api/appraisals/:id - Delete appraisal cycle
   - POST /api/appraisals/:id/start - Start appraisal cycle
   - POST /api/appraisals/:id/end - End appraisal cycle
   - GET /api/appraisals/template/:templateId - Get appraisals for specific template
   - GET /api/appraisals/categories/:category - Get appraisals for specific category

  Employee Performance
   - GET /api/employees/:id/performance - Get employee's performance history
   - GET /api/employees/:id/appraisals - Get employee's appraisal history
   - POST /api/employees/:id/self-assessment - Submit self-assessment
   - GET /api/employees/:id/self-assessment - Get employee's self-assessment
   - GET /api/employees/:id/appraisals/template/:templateId - Get employee's appraisals for specific template

  Permissions Management
   - GET /api/permissions - List all available permissions
   - POST /api/permissions/assign - Assign permissions to roles
   - DELETE /api/permissions/remove - Remove permissions from roles
   - GET /api/permissions/role/:roleId - Get permissions for specific role

  Database Schema

  appraisal_templates
   - id (Primary Key)
   - name (String)
   - description (Text)
   - category (String) - Teacher, Sales, Inventory, Technician, etc. - Please note we are on hardcoding this any cateogories we are running this 
   - kpi_ids (JSON Array)
   - is_active (Boolean)
   - created_by (Foreign Key: users)
   - created_at (Timestamp)
   - updated_at (Timestamp)

  metrics_library
   - id (Primary Key)
   - name (String)
   - description (Text)
   - data_type (Enum: numeric, percentage, boolean, rating)
   - formula (Text)
   - data_source (String)
   - categories (JSON Array) - ["Teacher", "Sales", "Inventory", "Technician"] - Please note we are on hardcoding this any cateogories we are running this 
   - is_active (Boolean)
   - created_by (Foreign Key: users)
   - created_at (Timestamp)
   - updated_at (Timestamp)

  kpi_definitions
   - id (Primary Key)
   - name (String)
   - description (Text)
   - formula (Text)
   - weight (Decimal)
   - metric_ids (JSON Array)
   - categories (JSON Array) - ["Teacher", "Sales", "Inventory", "Technician"]  - Please note we are on hardcoding this any cateogories we are running this  we can 
   - is_active (Boolean)
   - created_by (Foreign Key: users)
   - created_at (Timestamp)
   - updated_at (Timestamp)

  targets
   - id (Primary Key)
   - kpi_id (Foreign Key: kpi_definitions)
   - employee_id (Foreign Key: staff)
   - department_id (Foreign Key: branches)
   - template_id (Foreign Key: appraisal_templates)
   - target_type (Enum: minimum, standard, stretch)
   - target_value (Decimal)
   - period_start (Date)
   - period_end (Date)
   - created_by (Foreign Key: users)
   - created_at (Timestamp)
   - updated_at (Timestamp)

  performance_scores
   - id (Primary Key)
   - employee_id (Foreign Key: staff)
   - kpi_id (Foreign Key: kpi_definitions)
   - template_id (Foreign Key: appraisal_templates)
   - score (Decimal)
   - achieved_value (Decimal)
   - period_start (Date)
   - period_end (Date)
   - calculated_at (Timestamp)
   - calculated_by (Foreign Key: users)

  appraisal_cycles
   - id (Primary Key)
   - name (String)
   - description (Text)
   - template_id (Foreign Key: appraisal_templates)
   - start_date (Date)
   - end_date (Date)
   - status (Enum: draft, active, completed, cancelled)
   - created_by (Foreign Key: users)
   - created_at (Timestamp)
   - updated_at (Timestamp)

  appraisal_assignments
   - id (Primary Key)
   - employee_id (Foreign Key: staff)
   - appraisal_cycle_id (Foreign Key: appraisal_cycles)
   - status (Enum: pending, in_progress, submitted, reviewed, completed)
   - assigned_by (Foreign Key: users)
   - assigned_at (Timestamp)
   - completed_at (Timestamp)

  role_permissions
   - id (Primary Key)
   - role_id (Foreign Key: roles)
   - permission (String) - e.g., "appraisal_template.create"
   - granted_by (Foreign Key: users)
   - granted_at (Timestamp)

  Implementation Plan

  Phase 1: Core Metrics & Permissions (Week 1)
   - Create metrics library with category tagging
   - Build simple formula calculator
   - Connect to existing attendance and leave data
   - Implement basic API endpoints
   - Set up permissions system

  Phase 2: KPI Definitions & Templates (Week 2) 
   - Add KPI creation interface with category restrictions
   - Implement formula builder
   - Allow combination of multiple metrics
   - Create appraisal template system
   - Create KPI management endpoints

  Phase 3: Targets & Multi-Category Appraisals (Week 3)
   - Add category-specific target setting functionality
   - Create appraisal cycle management for multiple templates
   - Build evaluation workflow for different categories
   - Implement target assignment endpoints
   - Add employee category assignment

  Phase 4: Reporting & Analytics (Week 4)
   - Add performance dashboards by category
   - Generate reports for different employee categories
   - Trend analysis by category
   - Performance score calculation endpoints
   - Complete permissions implementation

  This system leverages existing data to create meaningful performance evaluations without complex infrastructure, focusing on simplicity and practical use. It supports
  multiple appraisal templates simultaneously, category-specific metrics and targets, and comprehensive permissions management.