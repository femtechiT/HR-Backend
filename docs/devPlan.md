# HR Backend - Development Plan (Start to Finish)

**Project:** Fully Dynamic HR Management System
**Deployment Target:** cPanel (Node.js + MySQL)
**Timeline:** ~16 weeks (~4 months)
**Date:** January 14, 2026

---

## PHASE 0: ENVIRONMENT & SETUP (Week 1)

### 0.1 Repository & Tooling
- [ ] Initialize Node.js project (`npm init -y` or use Yarn/pnpm)
- [ ] Set up Git repository and GitHub/GitLab
- [ ] Create `.gitignore` for Node.js (`node_modules/`, `.env`, logs, build artifacts)
- [ ] Configure `tsconfig.json` for TypeScript support
- [ ] Set up ESLint + Prettier for code quality
- [ ] Create `.env.example` with required variables

### 0.2 Database Setup
- [ ] Provision cPanel MySQL database
- [ ] Create MySQL user with appropriate permissions
- [ ] Document database connection string
- [ ] Set up MySQL client (mysql2/promise for Node.js)
- [ ] Create database backup strategy

### 0.3 Third-Party Service Integration
- [ ] Register Resend account and obtain API key
- [ ] Test Resend email sending (simple test email)
- [ ] Set up domain verification for Resend (SPF, DKIM, DMARC in cPanel DNS)
- [ ] Document Resend email template structure
- [ ] Set up Firebase Cloud Messaging (FCM) for push notifications (optional/research)

### 0.4 Project Structure
- [ ] Create folder structure:
  ```
  src/
    api/
    workers/
    services/
    models/
    middleware/
    utils/
  config/
  migrations/
  tests/
  docs/
  ```
- [ ] Create `src/index.js` entry point
- [ ] Set up basic Express/Next.js server
- [ ] Document development workflow (starting/stopping server, running migrations)

---

## PHASE 1: CORE AUTHENTICATION & AUTHORIZATION (Weeks 2-3) - ✅ COMPLETED

### 1.1 User & Authentication Tables
- [x] Create `users` table (id, email, password_hash, full_name, phone, role_id, branch_id, status, created_at)
- [x] Create `roles` table (id, name, description, permissions JSON, created_at)
- [x] Create `user_permissions` table (id, user_id, permission, allow/deny, created_at)
- [x] Create `roles_permissions` junction table

### 1.2 JWT Authentication
- [x] Implement JWT token generation (sign, verify, decode)
- [x] Create login endpoint: **POST `/api/auth/login`** (email, password)
- [x] Create logout endpoint: **POST `/api/auth/logout`** (invalidate token)
- [x] Create refresh token endpoint: **POST `/api/auth/refresh`**
- [x] Implement middleware: `authenticateJWT` (verify token, attach user to request)
- [x] Test JWT flow end-to-end

### 1.3 Role & Permission Management
- [x] Create permission manifest generation function
- [x] Endpoint: **GET `/api/auth/permissions`** (returns user permissions + features + UI elements)
- [x] Implement permission check middleware: `checkPermission(permission)`
- [x] Create seeded roles (e.g., "Admin", "HR Manager", "Staff", "Branch Manager")
- [x] Document permission atoms (e.g., `staff:create`, `leave:approve`, `payroll:view`)

### 1.4 Testing
- [x] Write unit tests for JWT encode/decode
- [x] Write integration tests for login/logout flow
- [x] Write tests for permission resolution (role + user overrides)

---

## PHASE 2: STAFF MANAGEMENT (Weeks 4-5) - ✅ COMPLETED

### 2.1 Staff Tables & Models
- [x] Create `staff` table (id, user_id, designation, department, branch_id, joining_date, status, created_at)
- [x] Create `staff_documents` table (id, staff_id, document_type, file_path, uploaded_at)
- [x] Create `staff_addresses` table (id, staff_id, address_type, city, state, zip, country)

### 2.2 Staff CRUD APIs
- [x] **POST `/api/staff`** — Create new staff (admin only)
- [x] **GET `/api/staff`** — List all staff (with pagination, filtering by branch/department)
- [x] **GET `/api/staff/:id`** — Get staff details
- [x] **PATCH `/api/staff/:id`** — Update staff info
- [x] **DELETE `/api/staff/:id`** — Mark staff as inactive
- [x] Document staff creation workflow (user account + staff record)

### 2.3 Audit Logging
- [x] Implement audit log capture for all staff operations
- [x] Log: who changed what, when, old value → new value
- [x] Create **GET `/api/audit`** endpoint (filter by entity type, user, date range)

### 2.4 Testing
- [x] Write tests for staff CRUD operations
- [x] Test audit log creation and retrieval
- [x] Test permission checks on staff endpoints

---

## PHASE 3: DYNAMIC FORMS FRAMEWORK (Weeks 6-7) - ✅ COMPLETED

### 3.1 Form Tables
- [x] Create `forms` table (id, name, form_type, description, branch_id, created_by, is_active, created_at)
- [x] Create `form_fields` table (id, form_id, field_name, field_label, field_type, is_required, validation_rule, options JSON, field_order)
- [x] Create `form_submissions` table (id, form_id, user_id, submission_data JSON, status, reviewed_by, reviewed_at, notes, submitted_at)
- [x] Create `form_attachments` table (id, form_submission_id, field_id, file_name, file_path, mime_type, uploaded_at)

### 3.2 Form Builder APIs
- [x] **POST `/api/forms`** — Create form with fields
- [x] **GET `/api/forms`** — List all forms
- [x] **GET `/api/forms/:id`** — Get form template
- [x] **PUT `/api/forms/:id`** — Update form definition
- [x] **DELETE `/api/forms/:id`** — Deactivate form

### 3.3 Form Submission APIs
- [x] **POST `/api/forms/:id/submit`** — Submit form with data + file attachments
  - Validate fields against `form_fields` rules (required, type, regex)
  - Handle file uploads (store in cPanel storage or S3)
  - Create `form_submissions` record
  - Send notification to reviewer
- [x] **GET `/api/forms/:id/submissions`** — List submissions (paginated, filterable by status)
- [x] **GET `/api/forms/submissions/:id`** — Get single submission with attachments
- [x] **PATCH `/api/forms/submissions/:id`** — Admin approves/rejects submission

### 3.4 File Upload Handling
- [x] Implement file upload endpoint: **POST `/api/upload`** (multipart/form-data)
- [x] Validate file type and size
- [x] Store files on cPanel (or S3 for scale)
- [x] Generate signed URLs for secure downloads
- [x] Test file upload/download cycle

### 3.5 Testing
- [x] Test form creation with various field types
- [x] Test form submission with validation
- [x] Test file upload and retrieval
- [x] Test submission approval workflow

---

## PHASE 4: LEAVE MANAGEMENT (Weeks 8-9) - ✅ COMPLETED

### 4.1 Leave Tables
- [x] Create `leave_types` table (id, name, days_per_year, is_paid, allow_carryover, carryover_limit, expiry_rule_id, created_by, is_active)
- [x] Create `leave_expiry_rules` table (id, name, expire_after_days, trigger_notification_days, auto_expire_action)
- [x] Create `leave_allocations` table (id, user_id, leave_type_id, cycle_start_date, cycle_end_date, allocated_days, used_days, carried_over_days)
- [x] Create `leave_requests` (or use form_submissions for leave_request form type)
- [x] Create `leave_history` table (id, user_id, leave_type_id, start_date, end_date, days_taken, reason, approved_at)

### 4.2 Leave Type Management APIs
- [x] **POST `/api/leave-types`** — Create leave type (admin)
- [x] **GET `/api/leave-types`** — List leave types
- [x] **PUT `/api/leave-types/:id`** — Update leave type
- [x] Admin can configure expiry rules per leave type (no code changes)

### 4.3 Leave Allocation APIs
- [x] **POST `/api/leave-allocations`** — Admin allocates leave to staff (annual or custom)
- [x] **GET `/api/leave-allocations`** — List allocations
- [x] **GET `/api/leave-allocations/balance`** — Staff views their leave balance
- [x] Calculate available days (allocated + carried_over - used)

### 4.4 Leave Request Workflow
- [x] Create "Leave Request" form via form-builder (dropdown for type, date fields, reason, attachments)
- [x] **POST `/api/forms/:id/submit`** — Staff submits leave request (auto-routed to manager)
- [x] **PATCH `/api/forms/submissions/:id`** — Manager approves/rejects
- [x] On approval: deduct from `leave_allocations.used_days`, create `leave_history` record
- [x] Send notifications: staff + manager + HR

### 4.5 Testing
- [x] Test leave allocation and balance calculation
- [x] Test leave request submission and approval flow
- [x] Test remaining balance after approval
- [x] Test notification sending

---

## PHASE 5: ATTENDANCE TRACKING (Weeks 10) - ✅ COMPLETED

### 5.1 Attendance Tables
- [x] Create `attendance` table (id, user_id, date, status ENUM(present/absent/late/half_day), check_in_time, check_out_time, location, notes)
- [x] Create `shift_timings` table (id, user_id, shift_name, start_time, end_time, effective_from, override_branch_id)
- [x] Create `holidays` table (id, holiday_name, date, branch_id, is_mandatory, description)

### 5.2 Attendance APIs
- [x] **POST `/api/attendance`** — Mark attendance (manual or auto from system)
- [x] **GET `/api/attendance`** — View attendance records (staff view own, admin view all)
- [x] **PATCH `/api/attendance/:id`** — Admin adjusts attendance (creates audit log)
- [x] **GET `/api/attendance/summary`** — Monthly attendance report (present days, absent days, attendance %)

### 5.3 Late/Early Detection Logic
- [x] Compare check-in time vs. scheduled start time → mark as late
- [x] Compare check-out time vs. scheduled end time → mark as early
- [x] Respect staff-specific shift overrides and branch-level holidays

### 5.4 Testing
- [x] Test attendance marking and retrieval
- [x] Test late/early detection logic
- [x] Test shift override logic
- [x] Test attendance adjustment audit trail

---

## PHASE 6: PAYROLL & PAYMENT TYPES (Weeks 11) - ✅ COMPLETED

### 6.1 Payment Tables
- [x] Create `payment_types` table (id, name, payment_category ENUM(earning/deduction/tax/benefit), calculation_type ENUM(fixed/percentage/formula), formula, applies_to_all, created_by, is_active)
- [x] Create `staff_payment_structure` table (id, staff_id, payment_type_id, value, effective_from, override_branch_id)
- [x] Create `payroll_runs` table (id, month, year, branch_id, status, run_date, total_amount, created_at)
- [x] Create `payroll_records` table (id, payroll_run_id, staff_id, earnings JSON, deductions JSON, net_pay, created_at)

### 6.2 Payment Type Management APIs
- [x] **POST `/api/payment-types`** — Create payment component (admin, no code needed)
- [x] **GET `/api/payment-types`** — List all payment types
- [x] **PUT `/api/payment-types/:id`** — Update formula or category
- [x] Admin can add: Basic Salary, HRA, Medical Allowance, Performance Bonus, PF Deduction, Income Tax, etc.

### 6.3 Staff Payment Structure APIs
- [x] **POST `/api/staff/:id/payment-structure`** — Assign payment types to staff
- [x] **GET `/api/staff/:id/payment-structure`** — View staff payment components
- [x] **PUT `/api/staff/:id/payment-structure/:ptId`** — Update value (e.g., adjust bonus for individual)

### 6.4 Payroll Calculation
- [x] Implement payroll engine: iterates over all staff, calculates each payment_type formula
- [x] **POST `/api/payroll/run`** — Execute payroll for a month (admin)
  - Calculate all payment components for each staff
  - Generate payroll records with earnings, deductions, net pay
  - Create audit log with calculation details
  - Send notification to finance
- [x] **GET `/api/payroll/records`** — View payroll records (finance/admin only)
- [x] **GET `/api/staff/:id/payroll-history`** — Staff views own payroll history

### 6.5 Payslip Generation
- [x] Generate payslip document (HTML) from payroll record
- [x] **GET `/api/payslips/view/:staffId/:payrollRunId`** — View payslip in browser
- [x] **GET `/api/payslips/download/:staffId/:payrollRunId`** — Download payslip
- [ ] Send payslip via email on payroll completion

### 6.6 Testing
- [x] Test payment type creation and formula evaluation
- [x] Test payroll calculation with various component combinations
- [x] Test payroll run and record creation
- [ ] Test payslip generation and email delivery

---

## PHASE 7: KPI & APPRAISAL ENGINE (Weeks 12)

### 7.1 KPI Tables
- [ ] Create `kpi_definitions` table (id, name, metric_type ENUM(numeric/boolean/rating/text), target_value, unit, calculation_formula, weight, data_source ENUM(formula/manual_entry/system_metric), created_by, is_active)
- [ ] Create `kpi_assignments` table (id, user_id, kpi_definition_id, cycle_start_date, cycle_end_date, assigned_by, custom_target_value, notes)
- [ ] Create `kpi_scores` table (id, kpi_assignment_id, calculated_value, achievement_percentage, weighted_score, calculated_at, manually_overridden, override_value, override_reason, override_by)

### 7.2 KPI Management APIs
- [ ] **POST `/api/kpis`** — Create KPI definition (admin)
- [ ] **GET `/api/kpis`** — List KPI definitions
- [ ] **PUT `/api/kpis/:id`** — Update KPI
- [ ] Admin can define: Attendance Rate, Sales Value, Customer Satisfaction Score, Tasks Completed, etc.

### 7.3 KPI Assignment & Scoring APIs
- [ ] **POST `/api/kpi-assignments`** — Assign KPIs to staff for cycle (manager/admin)
- [ ] **GET `/api/kpi-assignments`** — View assigned KPIs
- [ ] **GET `/api/kpi-scores`** — View calculated scores
- [ ] **PATCH `/api/kpi-scores/:id`** — Manager manually overrides score (captures override reason)





### 7.4 Multi-Source Performance Intelligence Engine - ⏭️ FUTURE

#### 7.4.1 Enhanced KPI Definition System
- [ ] Extend `kpi_definitions` table to include metadata:
  - `data_source_type` (ENUM: system, hr, staff, mixed)
  - `department_id` and `role_id` associations for role-specific KPIs
  - `frequency` (daily, weekly, monthly, quarterly, annually)
  - `target_calculation_method` (static, dynamic, formula-based)
  - `weighting_logic` for role-specific importance
- [ ] Create `department_kpi_mappings` table to link KPIs to specific departments/roles
- [ ] **POST `/api/kpis/advanced`** — Create advanced KPI with department/role associations
- [ ] **GET `/api/kpis/by-department/:deptId`** — Get KPIs specific to department
- [ ] **GET `/api/kpis/by-role/:roleId`** — Get KPIs specific to role

#### 7.4.2 Data Intake Layer (Three-Stream Integration)
- [ ] Create `performance_data_stream` table to handle multi-source data:
  - `source_type` (system, hr, staff)
  - `entity_type` (attendance, sales, self_report, etc.)
  - `entity_id` (reference to original data)
  - `raw_value`, `processed_value`, `verification_status`
- [ ] **POST `/api/performance/data-ingest`** — Accept data from any source with source identification
- [ ] Implement automated data pull from system modules (attendance, sales, etc.)
- [ ] Implement staff self-reporting endpoints
- [ ] Implement HR subjective data entry endpoints

#### 7.4.3 Appraisal Template Engine with Formula Builder
- [ ] Create `appraisal_templates` table:
  - `name`, `department_id`, `role_id`, `formula_definition` (JSON/string)
  - `weight_distribution` (JSON mapping of KPI weights)
  - `calculation_logic` (mathematical formula string)
- [ ] Create formula builder API endpoints:
  - **POST `/api/templates`** — Create appraisal template with custom formula
  - **PUT `/api/templates/:id`** — Update template formula
  - **GET `/api/templates/formula-builder`** — Get available formula components
- [ ] Implement formula parser/evaluator for dynamic appraisal calculations
- [ ] Support complex formulas: `(A * 0.6) + (B * 0.4) + IF(C > threshold, bonus, 0)`

#### 7.4.4 Assignment & Mapping Engine
- [ ] Create `employee_template_assignments` table:
  - `employee_id`, `template_id`, `assignment_date`, `cycle_start`, `cycle_end`
- [ ] **POST `/api/assignments`** — Link employee to appropriate template
- [ ] **GET `/api/assignments/active`** — Get current assignments for calculation workers
- [ ] Implement cycle management for performance periods

#### 7.4.5 Calculation Worker (Performance Processor)
- [ ] Implement enhanced scheduled job: `src/workers/performance-intelligence-worker.js`
- [ ] Fetch active employee-template assignments in current cycle
- [ ] For each assignment:
  - Hunt for required KPI values from three data streams
  - Apply role/department-specific weighting
  - Execute dynamic formula calculation
  - Generate comparative analysis (self vs HR vs system data)
- [ ] Store results in `performance_calculations` table
- [ ] Generate insights when discrepancies detected (e.g., high self-report vs low HR rating)

#### 7.4.6 Department-Specific Modules
-Be able  to tie  KPI to a departmane
#### 7.4.7 Insight & Analytics Layer
- [ ] Create comparative analysis engine:
  - Compare self-reported vs HR-entered vs system data
  - Flag discrepancies with "Training Needed" or "Verification Required" insights
- [ ] **GET `/api/analytics/performance-heatmap`** — Cross-department performance visualization
- [ ] **GET `/api/analytics/discrepancy-report`** — Report on data source conflicts
- [ ] **GET `/api/analytics/trend-analysis`** — Performance trends over time

#### 7.4.8 Appraisal Form & Workflow (Enhanced)
- [ ] Create dynamic appraisal forms based on assigned template
- [ ] **POST `/api/appraisals/generate`** — Auto-generate appraisal based on template and collected data
- [ ] **GET `/api/appraisals/:id/detailed`** — View appraisal with source data breakdown
- [ ] Implement multi-source data visualization in appraisal forms

#### 7.4.9 Testing
- [ ] Test multi-source data ingestion and processing
- [ ] Test dynamic formula evaluation and calculation accuracy
- [ ] Test department/role-specific KPI assignments
- [ ] Test performance calculation worker with complex formulas
- [ ] Test comparative analysis and insight generation
- [ ] Test department-specific modules (PC Clinic, Logistics, Sales, Teaching)

### 7.5 Email Notification System Enhancement - ⏭️ FUTURE
- [ ] Create `notifications` table for automated domain-specific communications
- [ ] **POST `/api/notifications/configure`** — Set up email templates for different domains
- [ ] **GET `/api/notifications/templates`** — List available notification templates
- [ ] Implement automated performance-based email triggers
- [ ] Test domain-specific email delivery system

---

## PHASE 8: NOTIFICATIONS & LEAVE EXPIRY AUTOMATION (Weeks 13) - ⏭️ NEXT

### 8.1 Notification Tables
- [ ] Create `notification_logs` table (id, recipient_user_id, notification_type, title, message, channel ENUM(email/push/in_app/sms), related_entity_type, related_entity_id, sent_at, delivery_status ENUM(pending/sent/failed/bounced), retry_count, error_message, external_id, opened_at)

### 8.2 Notification Service
- [ ] Create `services/notification.js` with methods:
  - `sendEmail(to, subject, htmlBody)` — via Resend
  - `sendPush(userId, title, message)` — via FCM (optional)
  - `sendInApp(userId, message)` — store in DB, retrieve on frontend
  - `sendSMS(phone, message)` — optional Twilio integration
- [ ] Implement retry logic: exponential backoff (2s, 4s, 8s, max 3 retries)
- [ ] Log all notifications in `notification_logs` table

### 8.3 Email Templates (Resend)
- [ ] Create email template files:
  - `leave-expiry-warning.html` — Notify staff X days before leave expires
  - `leave-approved.html` — Notify staff leave approved
  - `leave-rejected.html` — Notify staff leave rejected
  - `payroll-ready.html` — Notify staff payslip is ready
  - `kpi-due-reminder.html` — Remind manager KPI assessment is due
  - `appraisal-reminder.html` — Remind manager appraisal deadline

### 8.4 Leave Expiry Worker
- [ ] Create scheduled job (daily 2 AM): `src/workers/leave-expiry-worker.js`
- [ ] Query `leave_allocations` where `cycle_end_date - NOW() <= trigger_notification_days`
- [ ] For each allocation:
  - If trigger date reached: send leave-expiry-warning email + push notification
  - Log notification in `notification_logs` (status = 'sent')
  - Mark as notified (store in DB to avoid duplicate notifications)
- [ ] If expiry date passed:
  - Query `leave_expiry_rules` for configured action
  - If 'delete': set `used_days = allocated_days + carried_over_days` (balance expires)
  - If 'convert_to_cash': create payroll_adjustment (leave encashment payout)
  - If 'transfer_to_next_cycle': create next year allocation with carryover
  - Log action in audit_logs

### 8.5 Notification Dispatch Worker (Optional)
- [ ] Create scheduled job: `src/workers/notification-dispatch-worker.js`
- [ ] Query `notification_logs` with status = 'pending'
- [ ] For each pending notification:
  - Dispatch via appropriate channel (email, push, SMS)
  - Update status to 'sent' or 'failed'
  - Increment retry_count if failed
  - Re-queue with exponential backoff if retries < 3
- [ ] Run every 5-10 minutes

### 8.6 Testing
- [ ] Test leave expiry worker (mock dates, verify notifications sent)
- [ ] Test notification retry logic
- [ ] Test email delivery via Resend
- [ ] Test notification logging

---

## PHASE 9: JOB APPLICATIONS & RECRUITMENT MODULE (Weeks 13-14) - ⏭️ NEXT

### 9.1 Recruitment Tables
- [ ] Create `job_postings` table (id, title, description, department, location, salary_range, posted_by, posted_at, closed_at, is_active)
- [ ] Create `job_applications` table (id, job_posting_id, applicant_name, applicant_email, applicant_phone, resume_file_path, cover_letter, applied_at, status ENUM(applied/shortlisted/interviewed/offer/rejected))
- [ ] Create `application_comments` table (id, job_application_id, commented_by, comment, created_at)

### 9.2 Job Posting APIs
- [ ] **POST `/api/jobs`** — Create job posting (HR/admin)
- [ ] **GET `/api/jobs`** — List active job postings (public-facing)
- [ ] **PUT `/api/jobs/:id`** — Update posting
- [ ] **DELETE `/api/jobs/:id`** — Close posting

### 9.3 Application APIs
- [ ] **POST `/api/jobs/:id/apply`** — External applicant applies (name, email, resume, cover letter)
- [ ] **GET `/api/applications`** — List all applications (HR/admin filtered by job)
- [ ] **PATCH `/api/applications/:id`** — Update application status (HR moves applicant through pipeline)
- [ ] **POST `/api/applications/:id/comments`** — HR/manager adds interview notes
- [ ] **GET `/api/applications/:id`** — View application with comments and resume

### 9.4 Application Form
- [ ] Create "Job Application" form via form-builder (name, email, phone, resume file, cover letter, custom questions)
- [ ] Form submissions stored as job applications

### 9.5 Notifications
- [ ] Send confirmation email when applicant applies
- [ ] Send email when application status changes (shortlisted, rejected, offered, etc.)
- [ ] Notify HR when new application received

### 9.6 Testing
- [ ] Test job posting CRUD
- [ ] Test application submission and status tracking
- [ ] Test notification emails

---

## PHASE 10: WORK HOURS & HOLIDAYS CONFIGURATION (Weeks 14) - ⏭️ NEXT

### 10.1 Work Hours & Holiday Tables
- [ ] Create `shift_timings` table (id, staff_id, shift_name, start_time, end_time, effective_from, override_branch_id)
- [ ] Create `global_shift_timings` table (id, shift_name, start_time, end_time, for_all_staff, created_by)
- [ ] Create `branch_shift_timings` table (id, branch_id, shift_name, start_time, end_time, created_by)
- [ ] Create `holidays` table (id, holiday_name, date, holiday_type ENUM(mandatory/optional), branch_id, is_global, description, created_by)

### 10.2 Configuration APIs
- [ ] **POST `/api/work-hours`** — Set global work hours (admin)
- [ ] **POST `/api/work-hours/branch/:id`** — Set branch-level work hours (admin)
- [ ] **POST `/api/work-hours/staff/:id`** — Set individual staff work hours (admin)
- [ ] **GET `/api/work-hours/effective`** — Get effective work hours (resolves hierarchy: staff > branch > global)
- [ ] **POST `/api/holidays`** — Create holiday (admin)
- [ ] **GET `/api/holidays`** — List holidays (filter by branch/global)

### 10.3 Attendance Logic Integration
- [ ] Update attendance check-in/out logic to use effective work hours
- [ ] Respect staff-specific overrides, branch overrides, and global defaults
- [ ] Calculate late/early based on effective start time

### 10.4 Testing
- [ ] Test work hours hierarchy resolution
- [ ] Test holiday creation and retrieval
- [ ] Test attendance logic with various overrides

---

## PHASE 11: ADVANCED FEATURES & POLISH (Week 15) - ⏭️ NEXT

### 11.1 Dashboard & Analytics
- [ ] Create admin dashboard endpoints:
  - **GET `/api/dashboard/summary`** — Total staff, active jobs, pending approvals, payroll status
  - **GET `/api/dashboard/attendance-chart`** — Monthly attendance trends
  - **GET `/api/dashboard/leave-utilization`** — Leave type usage breakdown
  - **GET `/api/dashboard/turnover`** — New hires, resignations, retention rate

### 11.2 Reports & Exports
- [ ] **GET `/api/reports/staff`** — Export staff directory (CSV/Excel)
- [ ] **GET `/api/reports/attendance`** — Export attendance report (date range, CSV)
- [ ] **GET `/api/reports/payroll`** — Export payroll records (CSV)
- [ ] **GET `/api/reports/appraisals`** — Export appraisal summary (PDF/Excel)

### 11.3 Bulk Operations
- [ ] **POST `/api/bulk/upload-attendance`** — Upload attendance file (CSV), bulk insert
- [ ] **POST `/api/bulk/allocate-leave`** — Bulk allocate leave to staff (CSV)
- [ ] **POST `/api/bulk/import-staff`** — Import staff directory (CSV)

### 11.4 Search & Filtering
- [ ] Add full-text search for staff names, email, designation
- [ ] Advanced filtering on all list endpoints (date ranges, statuses, departments)

### 11.5 Data Validation & Error Handling
- [ ] Comprehensive input validation on all endpoints
- [ ] Consistent error response format (status code, error message, details)
- [ ] Rate limiting on API endpoints (prevent abuse)

### 11.6 Security Hardening
- [ ] Enable CORS (if frontend on different origin)
- [ ] Add CSRF protection
- [ ] Sanitize user inputs (prevent SQL injection, XSS)
- [ ] Encrypt sensitive data in transit (HTTPS/TLS on cPanel)
- [ ] Password hashing (bcrypt, salt rounds = 10+)

### 11.7 Performance Optimization
- [ ] Add database indexes on frequently queried columns
- [ ] Implement Redis caching for permission manifests, leave balances
- [ ] Add query pagination (default limit 20, max 100)
- [ ] Optimize database queries (avoid N+1 queries)
- [ ] Compress API responses (gzip)

### 11.8 Testing Comprehensive Coverage
- [ ] Write unit tests for all services
- [ ] Write integration tests for all API endpoints
- [ ] Write tests for worker jobs (leave expiry, KPI recalc, notification dispatch)
- [ ] Aim for >80% code coverage

---

## PHASE 12: DEPLOYMENT & DOCUMENTATION (Week 16) - ⏭️ NEXT

### 12.1 Environment Configuration
- [ ] Create `.env.production` with production credentials
- [ ] Set up environment variables for cPanel:
  - Database connection string
  - JWT secret
  - Resend API key
  - FCM service account (if using push notifications)
  - App URL/domain
  - Email from address

### 12.2 Database Migrations
- [ ] Create migration scripts for all schema tables (Phase 1-11)
- [ ] Create seed scripts for default roles, permissions, payment types, leave types
- [ ] Document migration process (how to run on cPanel)

### 12.3 Node.js & PM2 Setup on cPanel
- [ ] Install Node.js runtime on cPanel (if not pre-installed)
- [ ] Deploy application files to cPanel (via SSH or Git)
- [ ] Install dependencies (`npm install`)
- [ ] Create PM2 ecosystem file (`ecosystem.config.js`)
- [ ] Start application with PM2 (`pm2 start ecosystem.config.js`)
- [ ] Configure PM2 to auto-restart on server reboot

### 12.4 Scheduled Jobs
- [ ] Configure cron jobs on cPanel for:
  - Leave expiry worker (daily 2 AM)
  - KPI recalculation worker (daily 3 AM)
  - Notification dispatch worker (every 5 mins, optional)
  - Database backup (daily 3 AM)

### 12.5 SSL & DNS
- [ ] Enable SSL certificate on cPanel (Let's Encrypt or paid)
- [ ] Set up domain pointing to cPanel (update DNS records)
- [ ] Configure SPF, DKIM, DMARC records (for Resend email deliverability)

### 12.6 Monitoring & Logging
- [ ] Set up application logging (Winston or Pino)
- [ ] Log all errors, API requests, background job runs
- [ ] Configure centralized logging (Sentry or file-based)
- [ ] Set up PM2 monitoring (CPU, memory, uptime)
- [ ] Create monitoring dashboard (optional: NewRelic, Datadog)

### 12.7 Documentation
- [ ] Write API documentation (Swagger/OpenAPI)
- [ ] Write deployment guide (step-by-step for cPanel)
- [ ] Write user guide (admin, staff, manager workflows)
- [ ] Write troubleshooting guide (common issues, solutions)
- [ ] Document all configuration options and environment variables

### 12.8 Testing in Production (Staging)
- [ ] Create staging environment (clone of production)
- [ ] Run full test suite on staging
- [ ] Perform load testing (simulate 50+ concurrent users)
- [ ] Test backup/restore procedures
- [ ] Validate all notifications (email, push) in staging

### 12.9 Production Deployment
- [ ] Perform final code review
- [ ] Create database backup before deployment
- [ ] Run database migrations on production
- [ ] Deploy application code
- [ ] Verify all services running (PM2, cron jobs, API endpoints)
- [ ] Monitor error logs for first 24 hours
- [ ] Communicate deployment to stakeholders

### 12.10 Post-Deployment
- [ ] Create onboarding documentation for end-users
- [ ] Conduct training with HR admin and managers
- [ ] Set up support channel (email, Slack, etc.)
- [ ] Plan for Phase 2 features (if any)

---

## CROSS-CUTTING CONCERNS (Throughout All Phases)

### C.1 Code Quality
- [ ] Follow code style guide (ESLint + Prettier)
- [ ] Write comments for complex logic
- [ ] Use meaningful variable and function names
- [ ] Avoid code duplication (DRY principle)
- [ ] Refactor as needed

### C.2 Git Workflow
- [ ] Use feature branches for each task
- [ ] Write descriptive commit messages
- [ ] Create pull requests with code reviews
- [ ] Merge to `main` after approval
- [ ] Tag releases (v0.1.0, v0.2.0, etc.)

### C.3 Documentation
- [ ] Keep `README.md` updated with setup instructions
- [ ] Document new APIs in Swagger/OpenAPI
- [ ] Add inline code comments for non-obvious logic
- [ ] Maintain CHANGELOG.md with release notes

### C.4 Security
- [ ] Never hardcode secrets (use .env)
- [ ] Validate and sanitize all inputs
- [ ] Use parameterized queries (prevent SQL injection)
- [ ] Implement proper authentication and authorization
- [ ] Keep dependencies updated (`npm audit`, `npm update`)

### C.5 Performance
- [ ] Profile API response times regularly
- [ ] Monitor database query performance
- [ ] Cache frequently accessed data (Redis)
- [ ] Optimize database indexes
- [ ] Monitor server resource usage (CPU, memory, disk)

---

## TESTING STRATEGY

### Unit Tests
- [ ] Services (notification, payroll calculation, KPI evaluation)
- [ ] Utilities (date calculations, formula evaluation)
- [ ] Middleware (authentication, permission checks)

### Integration Tests
- [ ] API endpoints (happy path + error cases)
- [ ] Database operations (create, read, update, delete)
- [ ] Authentication flow (login, token refresh, logout)

### Worker Tests
- [ ] Leave expiry worker (mock dates, verify notifications)
- [ ] KPI recalculation worker (verify score calculations)
- [ ] Notification dispatch worker (verify retry logic)

### End-to-End Tests
- [ ] Complete user workflows (staff creates account → submits leave request → manager approves)
- [ ] Admin workflows (configure leave types → allocate leave → monitor expiry)
- [ ] Payroll cycle (allocate payment types → run payroll → generate payslips)

### Performance Tests
- [ ] Load testing (simulate 50+ concurrent users)
- [ ] Database query performance (query time < 500ms)
- [ ] API response time (p95 < 500ms)

---

## SUCCESS CRITERIA

✅ **Completion Checklist:**

- [ ] All phases completed on time
- [ ] API endpoints tested and documented
- [ ] Scheduled workers running reliably
- [ ] Forms framework fully dynamic (no hardcoding)
- [ ] Notifications sending to multiple channels
- [ ] Leave expiry automation working
- [ ] KPI calculation engine running daily
- [ ] Payroll calculation accurate
- [ ] Audit trail complete for all sensitive operations
- [ ] Permission system working with RBAC + user overrides
- [ ] Database backed up and recovery tested
- [ ] Documentation complete (API, deployment, user guide)
- [ ] Deployed to cPanel and monitoring
- [ ] Team trained and ready for Go-Live

---

## RISK MITIGATION

| Risk | Mitigation |
|------|-----------|
| Database downtime | Daily backups, tested restore procedures |
| Email delivery failure | Resend retry logic, fallback to SMS/push |
| Concurrent requests breaking data integrity | Database transactions, row-level locking |
| Performance degradation at scale | Caching, query optimization, database indexes |
| Security vulnerability | Regular security audits, dependency updates, code review |
| Worker job failing silently | PM2 monitoring, error logging, email alerts |
| Staff data loss | Immutable audit logs, encrypted backups, 7-year retention |

---

## BUDGET & TIMELINE

**Timeline:** 16 weeks (~4 months from Jan 14, 2026)

**Weekly Breakdown:**
- Week 1: Environment & Setup
- Weeks 2-3: Authentication & Authorization
- Weeks 4-5: Staff Management
- Weeks 6-7: Dynamic Forms
- Weeks 8-9: Leave Management
- Week 10: Attendance
- Week 11: Payroll
- Week 12: KPI & Appraisals
- Weeks 13-14: Notifications, Leaves Expiry, Jobs
- Week 15: Advanced Features
- Week 16: Deployment & Documentation

**Go-Live Target:** Late April 2026

---

## NEXT IMMEDIATE ACTIONS

1. **Confirm stack choice:** Express.js or Next.js 14?
2. **Set up cPanel account:** Database, Node.js runtime, domain
3. **Register Resend:** Obtain API key, verify domain for email
4. **Start Phase 0:** Initialize repo, set up tooling, create folder structure
5. **Begin Phase 1:** Implement authentication and JWT

---

**Last Updated:** January 14, 2026  
**Version:** 1.0  
**Status:** Ready for Development
