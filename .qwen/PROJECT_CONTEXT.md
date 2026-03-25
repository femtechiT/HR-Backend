# HR Management System - Project Context

## Project Overview

**Name:** HR Management System
**Type:** Full-stack HR management application
**Backend:** Node.js + Express + TypeScript + MySQL
**Frontend:** To be implemented (React/Vue recommended)
**Database:** MySQL (currently using TiDB Cloud)
**Caching:** Redis (optional)

## Current Status

### ✅ Completed Modules

1. **Authentication & Authorization**
   - JWT-based authentication
   - Role-based permissions
   - Password change flow

2. **User Management**
   - User CRUD operations
   - Role assignment
   - Staff invitation system with token-based acceptance

3. **Staff Management**
   - Staff CRUD
   - Dynamic fields
   - File uploads for documents
   - Invitation workflow (create user + staff on acceptance)

4. **Leave Management**
   - Leave types (7 types: Annual, Sick, Personal, etc.)
   - Leave allocations (individual + bulk)
   - Leave requests with approval workflow
   - File attachments for requests (PDF, images, docs - max 5 files, 5MB each)
   - Balance calculation with pending request deduction
   - Notifications for approvers

5. **Organizational Structure**
   - Branches (5 seeded)
   - Departments (6 seeded)
   - Holidays (Kenyan public holidays)

6. **Attendance**
   - Clock in/out with GPS
   - Shift management
   - Attendance locations

7. **Payroll**
   - Payment types
   - Staff payment structure
   - Payroll runs
   - Payslips

8. **Performance Management**
   - KPIs
   - Targets
   - Appraisals
   - Self-assessment workflow

9. **Recruitment**
   - Job postings
   - Applications
   - Application comments

10. **Notifications**
    - Email notifications
    - In-app notifications
    - Notification templates
    - Scheduled notifications

11. **Reporting**
    - Analytics
    - Report templates
    - Scheduled reports

### 🔧 In Progress / Needs Frontend

- File upload UI for leave requests
- Staff invitation acceptance page
- Leave calendar view
- Dashboard widgets
- Mobile app

---

## Database Schema

### Core Tables

```
users
├── id, email, password_hash, full_name
├── role_id, branch_id, status
└── created_at, updated_at

roles
├── id, name, description
└── created_at, updated_at

roles_permissions
├── role_id, permission
└── allow_deny (enum: allow/deny)

staff
├── user_id, employee_id, designation
├── department, branch_id
└── joining_date, employment_type, status
```

### Leave Module

```
leave_types
├── id, name, days_per_year
├── is_paid, is_active
└── allow_carryover, carryover_limit

leave_allocations
├── user_id, leave_type_id
├── cycle_start_date, cycle_end_date
├── allocated_days, used_days, carried_over_days
├── expiry_rule_id, processed_for_expiry
└── UNIQUE(user_id, leave_type_id, cycle_start_date, cycle_end_date)

leave_requests
├── user_id, leave_type_id
├── start_date, end_date, days_requested
├── reason, attachments (JSON)
├── status (submitted/approved/rejected/cancelled)
└── reviewed_by, reviewed_at, notes

leave_history
├── user_id, leave_type_id
├── start_date, end_date, days_taken
├── status, reason
└── approved_at, requested_by
```

### Staff Invitations

```
staff_invitations
├── id, email, token
├── first_name, last_name, phone
├── role_id, branch_id, department_id
├── status (pending/accepted/declined/expired)
├── expires_at, accepted_at
└── created_by
```

### Attendance

```
attendance
├── user_id, branch_id
├── clock_in, clock_out
├── status (present/late/absent/half-day)
└── location_verified, shift_id

shift_timings
├── name, start_time, end_time
├── branch_id, department_id
└── is_recurring, recurring_pattern
```

---

## API Conventions

### Response Format

```typescript
// Success
{
  success: true,
  message: "Operation successful",
  data: { ... }
}

// Error
{
  success: false,
  message: "Error description"
}

// Paginated
{
  success: true,
  data: { items: [...] },
  pagination: {
    currentPage: 1,
    totalPages: 10,
    totalItems: 100,
    itemsPerPage: 20
  }
}
```

### Permission Naming

```
<resource>:<action>

Examples:
- staff:create, staff:read, staff:update, staff:delete
- leave:create, leave:read, leave:update, leave:approve
- users:create, users:read, users:update, users:delete
```

### File Upload

```typescript
// Endpoint: POST /api/leave/upload
// Content-Type: multipart/form-data
// Body: { files: [File, File, ...] }

// Response:
{
  success: true,
  data: {
    files: [
      {
        file_name: "document.pdf",
        file_path: "/uploads/leave-requests/leave-123.pdf",
        file_size: 245678,
        mime_type: "application/pdf",
        uploaded_at: "2026-02-26T10:00:00Z"
      }
    ]
  }
}
```

---

## Environment Configuration

### Required Variables

```bash
# Database (TiDB Cloud)
DATABASE_URL=mysql://user:password@host:port/database

# JWT
JWT_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# Server
PORT=3000
NODE_ENV=development
```

### Optional Variables

```bash
# Email (Resend)
RESEND_API_KEY=
EMAIL_FROM=

# cPanel (for creating work emails)
CPANEL_HOST=
CPANEL_USERNAME=
CPANEL_API_TOKEN=

# Redis
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379

# Application
APP_NAME=HR Management System
APP_URL=http://localhost:3000
```

---

## Key Implementation Details

### Staff Invitation Flow

1. Admin invites staff → creates `staff_invitations` record with token
2. System sends email with acceptance link
3. User clicks link → accepts invitation → sets password
4. System creates `users` + `staff` records
5. Invitation status changes to "accepted"

**Endpoints:**
- `POST /api/staff-invitations` - Send invitation
- `GET /api/staff-invitations/pending` - List pending
- `POST /api/staff-invitations/:id/resend` - Resend
- `DELETE /api/staff-invitations/:id` - Cancel
- `POST /api/staff-invitations/accept/:token` - Accept (public)

### Leave Request Flow

1. Employee submits request → status: "submitted"
2. Notification sent to all users with `leave:approve` permission
3. Approver reviews → approves/rejects
4. If approved:
   - Status: "approved"
   - Deduct days from allocation (`used_days += days_requested`)
   - Send approval notification
5. If rejected:
   - Status: "rejected"
   - Send rejection notification

**Balance Calculation:**
```
remaining = allocated - used - pending
```

**File Attachments:**
- Upload before or during request submission
- Max 5 files, 5MB each
- Allowed: PDF, JPG, PNG, DOC, DOCX
- Can delete files only if request is "submitted" or "pending"

### Transaction Handling

Leave approval uses database transactions:

```typescript
const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  
  // Update request status
  await LeaveRequestModel.update(id, { status: 'approved' }, connection);
  
  // Update allocation
  await LeaveAllocationModel.updateUsedDays(allocationId, days, connection);
  
  // Queue notification
  await notificationService.queueNotification(...);
  
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

---

## Background Workers

### Leave Expiry Worker
- Runs daily
- Sends expiry warnings (7 days before)
- Processes expired leaves (forfeit/carryover)

### Birthday Worker
- Runs daily
- Sends birthday notifications

### Scheduler Service
- Handles recurring tasks
- Notification queue processing

**Start workers:**
```bash
pnpm start-workers
```

---

## Testing Strategy

### Manual Testing

1. **Seed database:** `pnpm seed`
2. **Login as admin:** admin@company.co.ke / Password123!
3. **Test each module** using Postman collections

### API Testing

Use Postman collections in `postman/` folder:
- Import collection
- Set base URL variable
- Test authentication flow
- Test each module

---

## Frontend Integration Priorities

### Phase 1: Foundation
1. Authentication (login, logout, token refresh)
2. Layout (sidebar, header, footer)
3. Common components (table, modal, form inputs)

### Phase 2: User Management
1. User profile
2. Role management
3. User CRUD

### Phase 3: Staff Module
1. Staff invitation system
2. Staff list + details
3. Staff CRUD

### Phase 4: Leave Module
1. Leave balance widget
2. Request leave form
3. My requests list
4. Approval queue (for managers)

### Phase 5: Org Structure
1. Branch management
2. Department management
3. Holiday management

### Phase 6: Polish
1. Dashboard
2. Notifications
3. Settings

---

## Known Limitations

1. **File uploads:** Stored locally (not cloud storage)
2. **Email:** Requires Resend API key (or alternative SMTP)
3. **Redis:** Optional but recommended for production
4. **GPS attendance:** Requires HTTPS in production
5. **Notifications:** Email only (SMS not implemented)

---

## Future Enhancements

- [ ] Cloud storage for files (AWS S3, Cloudinary)
- [ ] SMS notifications
- [ ] Mobile app (React Native/Flutter)
- [ ] Real-time notifications (WebSocket)
- [ ] Advanced reporting dashboard
- [ ] Employee self-service portal
- [ ] Manager dashboard
- [ ] HR analytics

---

## Important Notes

1. **Database changes:** Always create migration, never edit existing migrations
2. **Permissions:** Check permissions in routes, not just authentication
3. **Transactions:** Use for multi-step database operations
4. **Caching:** Redis caches allocations for 1 hour
5. **Error handling:** Always wrap async operations in try-catch
6. **Logging:** Use console.log in development, consider Winston/Morgan for production
7. **Security:** Use helmet, rate limiting, parameterized queries

---

**This document should be referenced when:**
- Starting new development sessions
- Onboarding new developers
- Planning new features
- Debugging issues
- Making architectural decisions
