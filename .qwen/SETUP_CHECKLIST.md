# Environment Setup Checklist

Use this checklist when setting up the development environment or starting a new session.

---

## ✅ Initial Setup (First Time Only)

### Prerequisites
- [ ] Node.js 18+ installed
- [ ] pnpm installed (`npm install -g pnpm`)
- [ ] Git configured
- [ ] Code editor installed (VS Code recommended)

### Project Setup
- [ ] Clone repository
- [ ] Run `pnpm install`
- [ ] Copy `.env.example` to `.env`
- [ ] Configure database connection in `.env`
- [ ] Run `pnpm migrate`
- [ ] Run `pnpm seed` (for test data)

### Verify Setup
- [ ] Run `pnpm dev`
- [ ] Server starts on port 3000
- [ ] Database connects successfully (check console)
- [ ] Can login with test credentials

---

## ✅ Starting Each Development Session

### Pre-Session Checklist

```bash
# 1. Pull latest changes (if using Git)
git pull

# 2. Install any new dependencies
pnpm install

# 3. Run new migrations (if any)
pnpm migrate

# 4. Start development server
pnpm dev
```

### Verify Environment
- [ ] Server starts without errors
- [ ] Console shows "Database connected successfully"
- [ ] Console shows "System initialization completed"
- [ ] No error messages in console
- [ ] Can access `http://localhost:3000`

---

## ✅ Testing Credentials

After running `pnpm seed`:

### Admin Account
- [ ] Email: `admin@company.co.ke`
- [ ] Password: `Password123!`
- [ ] Can login and access admin features

### Employee Accounts
- [ ] Email: `john.doe1@company.co.ke`
- [ ] Password: `Password123!`
- [ ] Can login and access employee features

---

## ✅ Environment Variables Check

### Required (Must Configure)

```bash
# Database - TiDB Cloud
DATABASE_URL=mysql://user:password@host:port/database

# OR individual variables (if not using connection string)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=hr_management_system

# JWT Secrets
JWT_SECRET=generate_random_secret_1
JWT_REFRESH_SECRET=generate_random_secret_2
```

### Optional (Configure as Needed)

```bash
# Email Service (Resend)
RESEND_API_KEY=
EMAIL_FROM=noreply@yourdomain.com

# cPanel (for creating work emails)
CPANEL_HOST=
CPANEL_USERNAME=
CPANEL_API_TOKEN=

# Redis (for caching)
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379

# Server
PORT=3000
NODE_ENV=development

# Application
APP_NAME=HR Management System
APP_URL=http://localhost:3000
```

---

## ✅ Database Health Check

### Verify Migrations
```sql
-- Check all migrations ran
SELECT COUNT(*) FROM schema_migrations;
-- Should return 82+ migrations
```

### Verify Tables Exist
```sql
-- List all tables
SHOW TABLES;
-- Should show 40+ tables including:
-- users, roles, staff, leave_types, leave_requests, etc.
```

### Verify Seed Data
```sql
-- Check branches
SELECT * FROM branches;
-- Should show 5 branches

-- Check users
SELECT COUNT(*) FROM users;
-- Should show 51 users (1 admin + 50 employees)

-- Check leave types
SELECT * FROM leave_types;
-- Should show 7 leave types
```

---

## ✅ API Health Check

### Test Endpoints

```bash
# Health check (no auth required)
curl http://localhost:3000/api/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.co.ke","password":"Password123!"}'

# Get current user (requires token)
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Expected Responses
- [ ] Health check returns `{ success: true }`
- [ ] Login returns token and user data
- [ ] Authenticated request returns user data

---

## ✅ File Upload Setup

### Verify Upload Directory
```bash
# Check uploads folder exists
ls -la uploads/leave-requests/
# Should exist (created automatically on first upload)
```

### Test File Upload
```bash
# Test upload endpoint
curl -X POST http://localhost:3000/api/leave/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@test-file.pdf"
```

---

## ✅ Redis Check (Optional)

### If Using Redis
```bash
# Start Redis (local)
redis-server

# Test connection
redis-cli ping
# Should return: PONG
```

### Verify in Application
- [ ] Check console for "Connected to Redis"
- [ ] Cache features work (leave allocations load fast)

---

## ✅ Background Workers Check

### Start Workers
```bash
pnpm start-workers
```

### Verify Workers Running
- [ ] Console shows worker initialization
- [ ] No errors in worker startup
- [ ] Scheduled tasks configured

---

## ✅ Frontend Development Setup

### If Building Frontend

#### Choose Stack
- [ ] React + Vite OR
- [ ] Next.js 14 OR
- [ ] Vue 3 + Vite

#### Install Frontend Dependencies
```bash
# Example for React
npm create vite@latest frontend -- --template-react
cd frontend
npm install
```

#### Configure API Connection
```javascript
// .env or config file
VITE_API_BASE_URL=http://localhost:3000/api
```

#### Test Connection
- [ ] Can call backend API from frontend
- [ ] CORS enabled (check console for errors)
- [ ] Authentication flow works

---

## 🔧 Troubleshooting Common Issues

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change port in .env
PORT=3001
```

### Database Connection Failed
```bash
# Check DATABASE_URL format
# Verify TiDB cluster is active
# Test: telnet host port
```

### Migrations Failed
```bash
# Check error message
# Fix SQL issue
# Remove from schema_migrations table
# Run again: pnpm migrate
```

### Dependencies Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

## 📞 Quick Command Reference

```bash
# Start development
pnpm dev

# Run migrations
pnpm migrate

# Seed database
pnpm seed

# Build for production
pnpm build

# Start production server
pnpm start

# Start workers
pnpm start-workers

# Lint code
pnpm lint

# Format code
pnpm format
```

---

## ✅ Pre-Deployment Checklist

### Before Deploying to Production

- [ ] Set `NODE_ENV=production`
- [ ] Use production database (not test data)
- [ ] Generate strong JWT secrets
- [ ] Enable HTTPS
- [ ] Configure production email service
- [ ] Set up Redis for caching
- [ ] Configure error logging
- [ ] Set up monitoring
- [ ] Test all critical flows
- [ ] Backup database

---

## 📚 Documentation References

- **Main Guide:** `.qwen/GUIDELINES.md`
- **Quick Reference:** `.qwen/QUICK_REFERENCE.md`
- **Project Context:** `.qwen/PROJECT_CONTEXT.md`
- **Session Summary:** `.qwen/SESSION_SUMMARY.md`
- **TiDB Setup:** `docs/TIDB_CLOUD_SETUP.md`
- **File Upload:** `docs/LEAVE_REQUEST_FILE_UPLOAD_GUIDE.md`

---

**Last Updated:** February 26, 2026
**Status:** ✅ All Systems Operational
