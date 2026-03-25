# HR Management System - Development Guidelines

## 🚀 Quick Start (Development Setup)

### Prerequisites
- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- MySQL/TiDB database accessible
- Redis installed (optional, for caching)

### Initial Setup (First Time Only)

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
# Edit .env file with your database credentials
# For TiDB Cloud:
# DATABASE_URL=mysql://user:password@host:port/database

# 3. Run database migrations
pnpm migrate

# 4. Seed database with test data (WARNING: Deletes all existing data!)
pnpm seed

# 5. Start development server
pnpm dev
```

**Server will start on:** `http://localhost:3000`

---

## 📋 Available Scripts

| Command | Description | When to Use |
|---------|-------------|-------------|
| `pnpm dev` | Start development server with auto-reload | Daily development |
| `pnpm migrate` | Run all pending database migrations | After pulling new migrations |
| `pnpm seed` | Seed database with test data | When you need fresh test data |
| `pnpm build` | Compile TypeScript to JavaScript | Before production deployment |
| `pnpm start` | Start production server | After building |
| `pnpm start-workers` | Start background workers separately | For leave expiry, notifications |
| `pnpm lint` | Check code quality | Before committing |
| `pnpm lint:fix` | Fix linting errors | Before committing |
| `pnpm format` | Format code with Prettier | Before committing |

---

## 🔑 Test Credentials (After Seeding)

### Admin Account
```
Email: admin@company.co.ke
Password: Password123!
```

### Employee Accounts
```
Format: firstname.lastname[number]@company.co.ke
Password: Password123!

Examples:
- john.doe1@company.co.ke
- jane.smith2@company.co.ke
```

---

## 📁 Project Structure

```
hrApp/
├── src/
│   ├── api/                  # Express routes (controllers)
│   ├── models/               # Database models (SQL queries)
│   ├── services/             # Business logic layer
│   ├── controllers/          # Request handlers
│   ├── middleware/           # Express middleware (auth, upload, etc.)
│   ├── workers/              # Background jobs (leave expiry, notifications)
│   ├── config/               # Configuration (database, redis)
│   ├── utils/                # Utility functions
│   └── index.ts              # Application entry point
│
├── migrations/               # SQL migration files (001, 002, 003...)
├── scripts/                  # Utility scripts
│   ├── run-migrations.ts     # Migration runner
│   └── seed-database.ts      # Database seeder
│
├── docs/                     # Documentation
├── screens/                  # UI/UX specifications
├── postman/                  # Postman collections
├── uploads/                  # Uploaded files (leave attachments, etc.)
│
├── .env                      # Environment variables (DO NOT COMMIT)
├── .env.example              # Environment template
├── package.json              # Dependencies and scripts
└── tsconfig.json             # TypeScript configuration
```

---

## 🗄️ Database Management

### Running Migrations

```bash
# Run all pending migrations
pnpm migrate

# Check migration status
SELECT * FROM schema_migrations ORDER BY id;
```

### Seeding Data

```bash
# Seed database (WARNING: Deletes ALL existing data!)
pnpm seed
```

**What gets created:**
- 5 Branches (Nairobi, Mombasa, Kisumu, Nakuru, Eldoret)
- 51 Users (1 admin + 50 employees)
- 6 Departments
- 7 Leave Types
- ~19 Kenyan Holidays (2024-2025)
- ~7,000+ Attendance Records (6+ months)
- ~100+ Leave Requests

### TiDB Cloud Connection

Use connection string format in `.env`:

```bash
DATABASE_URL=mysql://user:password@host:port/database
```

**Example:**
```bash
DATABASE_URL=mysql://3Zt1gwWGJZReUTW.root:MyPass@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test
```

See `docs/TIDB_CLOUD_SETUP.md` for detailed instructions.

---

## 🔐 Authentication Flow

### JWT Token Structure

- **Access Token:** Expires in 2 hours
- **Refresh Token:** Expires in 7 days
- **Stored in:** HTTP-only cookies (recommended) or localStorage

### Permission System

```typescript
// Check permission in route
router.get('/protected', checkPermission('staff:read'), handler);

// Available permission categories:
// - staff:create, staff:read, staff:update, staff:delete
// - leave:create, leave:read, leave:update, leave:approve
// - users:create, users:read, users:update, users:delete
// - roles:create, roles:read, roles:update, roles:delete
// - etc.
```

---

## 📦 Key Modules

### 1. Staff Management
- **Routes:** `/api/staff/*`
- **Invitations:** `/api/staff-invitation/*`
- **Features:** CRUD, dynamic fields, file uploads

### 2. Leave Management
- **Routes:** `/api/leave/*`
- **Features:** Types, allocations, requests, approvals, file attachments
- **Balance Calculation:** `allocated - used - pending = remaining`

### 3. Attendance
- **Routes:** `/api/attendance/*`
- **Features:** Clock in/out, GPS verification, shift management

### 4. Payroll
- **Routes:** `/api/payroll-*/*`
- **Features:** Salary structure, payroll runs, payslips

### 5. Performance/Appraisals
- **Routes:** `/api/performance/*`, `/api/appraisal/*`
- **Features:** KPIs, targets, self-assessment, manager review

### 6. Notifications
- **Routes:** `/api/notification/*`
- **Features:** Email, in-app, scheduled notifications

---

## 🛠️ Development Workflow

### 1. Creating New Features

```bash
# 1. Create migration (if database changes needed)
# Add file: migrations/083_your_feature.sql

# 2. Create model (database layer)
# src/models/your-feature.model.ts

# 3. Create service (business logic)
# src/services/your-feature.service.ts

# 4. Create controller (request handling)
# src/controllers/your-feature.controller.ts

# 5. Create route (API endpoints)
# src/api/your-feature.route.ts

# 6. Mount route in src/index.ts
app.use('/api/your-feature', yourFeatureRoutes);

# 7. Run migrations
pnpm migrate
```

### 2. Adding Database Columns

```sql
-- 1. Create migration file
-- migrations/083_add_column_to_table.sql

ALTER TABLE your_table ADD COLUMN new_column VARCHAR(255);

-- 2. Run migration
pnpm migrate

-- 3. Update model interface
export interface YourModel {
  new_column?: string;
}

-- 4. Update TypeScript types throughout codebase
```

### 3. Background Workers

Workers run automatically on server start. To run separately:

```bash
pnpm start-workers
```

**Existing workers:**
- `leave-expiry.worker.ts` - Daily leave expiry processing
- `birthday-notification.worker.ts` - Birthday wishes
- `scheduler.service.ts` - General task scheduler

---

## 📝 Code Style & Conventions

### Naming Conventions

```typescript
// Files: kebab-case
// user-controller.ts, leave-request.model.ts

// Classes: PascalCase
class LeaveRequestModel {}

// Functions/Variables: camelCase
const getUserById = () => {}

// Constants: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Database tables: snake_case, plural
// users, leave_requests, staff_invitations
```

### Error Handling

```typescript
// Always use try-catch for async operations
try {
  const result = await someAsyncOperation();
  return res.json({ success: true, data: result });
} catch (error) {
  console.error('Operation failed:', error);
  return res.status(500).json({
    success: false,
    message: 'Descriptive error message'
  });
}
```

### Database Queries

```typescript
// Use parameterized queries (prevent SQL injection)
const [rows] = await pool.execute(
  'SELECT * FROM users WHERE id = ?',
  [userId]
);

// Use transactions for multi-step operations
const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  // ... multiple queries
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

---

## 🧪 Testing

### Manual Testing Checklist

Before committing:

- [ ] Server starts without errors
- [ ] Database connects successfully
- [ ] New endpoints work in Postman
- [ ] Existing features still work
- [ ] No console errors or warnings
- [ ] Migrations run successfully
- [ ] Seed script works (if changed data structure)

### API Testing

Use Postman collections in `postman/` folder:
- Import collection
- Set environment variables
- Test endpoints

---

## 🚨 Common Issues & Solutions

### Issue: "Too many connections"
**Solution:** Reduce connection limit in `database.ts` or restart database

### Issue: "Migration failed"
**Solution:**
```sql
-- Remove failed migration from tracking
DELETE FROM schema_migrations WHERE migration_name = '083_your_migration.sql';

-- Fix the migration file
-- Run again
pnpm migrate
```

### Issue: "Port already in use"
**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change PORT in .env
PORT=3001
```

### Issue: "Cannot find module"
**Solution:**
```bash
# Rebuild TypeScript
pnpm build

# Or restart dev server
pnpm dev
```

### Issue: Redis connection failed
**Solution:**
```bash
# Start Redis (if using local)
redis-server

# Or disable Redis temporarily
REDIS_ENABLED=false
```

---

## 📚 Documentation References

| Document | Purpose |
|----------|---------|
| `docs/TIDB_CLOUD_SETUP.md` | TiDB Cloud configuration |
| `docs/LEAVE_MODULE_API_DOCUMENTATION.md` | Leave module complete API |
| `docs/LEAVE_REQUEST_FILE_UPLOAD_GUIDE.md` | File upload implementation |
| `docs/staff-invitation-system.md` | Staff invitation workflow |
| `docs/database-seeder.md` | Seeder script details |
| `docs/POSTMAN_API_DOCUMENTATION.md` | API testing guide |
| `screens/*.md` | UI/UX specifications |

---

## 🔒 Security Best Practices

- ✅ Use environment variables for secrets (never commit `.env`)
- ✅ Use parameterized SQL queries (prevent injection)
- ✅ Validate all user inputs
- ✅ Use helmet for security headers
- ✅ Implement rate limiting
- ✅ Hash passwords with bcrypt
- ✅ Use HTTPS in production
- ✅ Sanitize file uploads

---

## 📊 System Initialization

On server start, the following happens automatically:

```typescript
// src/index.ts
1. Test database connection
2. Initialize Redis (if enabled)
3. SystemInitService.initialize() - Pre-load cache:
   - Roles
   - Permissions
   - Branches
   - Departments
   - Leave Types
   - Upcoming Holidays
```

**Cache duration:** 24 hours

**Manual refresh:**
```typescript
await SystemInitService.refreshAll();
// or
await SystemInitService.refresh('roles');
```

---

## 🎯 Frontend Integration Notes

### Base URL
```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

### Authentication
```typescript
// Login endpoint
POST /api/auth/login
Body: { email, password }
Response: { token, user, ... }

// Include token in subsequent requests
headers: {
  Authorization: `Bearer ${token}`
}
```

### File Uploads
```typescript
// Leave request attachments
POST /api/leave/upload
Headers: { 'Content-Type': 'multipart/form-data' }
Body: FormData with 'files' array

// Then submit request with attachments
POST /api/leave
Body: {
  leave_type_id,
  start_date,
  end_date,
  reason,
  attachments: [uploaded files]
}
```

---

## 📞 Quick Reference

### Important File Locations

```bash
# Main entry point
src/index.ts

# Database configuration
src/config/database.ts

# Authentication middleware
src/middleware/auth.middleware.ts

# File upload middleware
src/middleware/upload.middleware.ts

# All migrations
migrations/

# Seed script
scripts/seed-database.ts
```

### Environment Variables

```bash
# Required
DATABASE_URL          # or DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
JWT_SECRET
JWT_REFRESH_SECRET

# Optional
REDIS_URL
PORT
NODE_ENV
RESEND_API_KEY       # Email service
CPANEL_*             # Email creation
```

---

## ✅ Pre-Commit Checklist

Before pushing code:

- [ ] `pnpm lint` passes
- [ ] `pnpm format` run
- [ ] `pnpm build` succeeds
- [ ] Server starts without errors
- [ ] New migrations included
- [ ] Documentation updated (if needed)
- [ ] No console.log in production code
- [ ] Error handling implemented
- [ ] TypeScript types defined

---

## 🎉 Getting Help

- Check existing documentation in `docs/` folder
- Review similar implementations in codebase
- Check Postman collections for API examples
- Review migration files for database structure
- Consult screen specifications in `screens/` folder

---

**Last Updated:** February 26, 2026
**Version:** 1.0.0
