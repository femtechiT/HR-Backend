# Quick Reference Card

## 🚀 Daily Development Commands

```bash
# Start development server
pnpm dev

# Run migrations (after pulling changes)
pnpm migrate

# Seed database (fresh start - DELETES ALL DATA)
pnpm seed

# Build for production
pnpm build

# Start production server
pnpm start
```

---

## 🔑 Test Login Credentials

```
Admin:
  Email: admin@company.co.ke
  Password: Password123!

Employee:
  Email: john.doe1@company.co.ke
  Password: Password123!
```

---

## 📡 API Base URLs

```
Development: http://localhost:3000/api
Production:  https://your-domain.com/api
```

---

## 🗄️ Database

### Connection String Format (TiDB Cloud)
```bash
DATABASE_URL=mysql://user:password@host:port/database
```

### Check Migration Status
```sql
SELECT * FROM schema_migrations ORDER BY id;
```

### Rollback Last Migration
```sql
DELETE FROM schema_migrations WHERE migration_name = 'filename.sql';
-- Then drop tables/columns manually
```

---

## 📦 Key Endpoints

### Authentication
```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
```

### Staff
```
GET    /api/staff
GET    /api/staff/:id
POST   /api/staff
PUT    /api/staff/:id
DELETE /api/staff/:id
```

### Leave
```
GET    /api/leave/my-requests
GET    /api/leave/balance
POST   /api/leave
PUT    /api/leave/:id
POST   /api/leave/upload
```

### Invitations
```
GET    /api/staff-invitations
POST   /api/staff-invitations
POST   /api/staff-invitations/:id/resend
DELETE /api/staff-invitations/:id
POST   /api/staff-invitations/accept/:token
```

---

## 📁 Important File Locations

```
src/index.ts                  # Main entry point
src/config/database.ts        # Database configuration
src/middleware/auth.middleware.ts  # Authentication
migrations/                   # All SQL migrations
scripts/seed-database.ts      # Database seeder
.env                          # Environment variables (DO NOT COMMIT)
```

---

## 🛠️ Common Tasks

### Add New Database Column
```bash
# 1. Create migration file
touch migrations/083_add_column.sql

# 2. Write SQL
ALTER TABLE table_name ADD COLUMN column_name TYPE;

# 3. Run migration
pnpm migrate

# 4. Update TypeScript interfaces
```

### Add New API Endpoint
```bash
# 1. Create route file
src/api/your-feature.route.ts

# 2. Mount in src/index.ts
app.use('/api/your-feature', yourFeatureRoutes);

# 3. Test with Postman
```

### Debug Database Issues
```bash
# Check if database is connected
# Look for "Database connected successfully" in console

# Run raw SQL query
const [rows] = await pool.execute('SELECT 1');
```

---

## ⚠️ Warnings

- ❌ Never commit `.env` file
- ❌ Never run `pnpm seed` on production
- ❌ Never skip migrations before frontend testing
- ✅ Always run `pnpm migrate` after pulling
- ✅ Always test with seeded data first
- ✅ Always check console for errors

---

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port is in use
lsof -ti:3000 | xargs kill -9

# Check .env file exists and has DATABASE_URL
```

### Database connection failed
```bash
# Verify credentials in .env
# For TiDB: Check cluster is active in console
# Test: telnet host port
```

### Migration failed
```bash
# Delete from tracking table
DELETE FROM schema_migrations WHERE migration_name = 'filename.sql';

# Fix SQL error and run again
pnpm migrate
```

---

## 📚 Documentation

- `GUIDELINES.md` - Complete development guide
- `docs/TIDB_CLOUD_SETUP.md` - TiDB configuration
- `docs/LEAVE_MODULE_API_DOCUMENTATION.md` - Leave API
- `docs/LEAVE_REQUEST_FILE_UPLOAD_GUIDE.md` - File uploads
- `screens/` - UI specifications

---

**Keep this handy for quick reference!**
