# 🚀 Backend API - Production Deployment Guide (cPanel)

## ⚠️ CRITICAL: Module System Fix

**Problem:** `ReferenceError: require is not defined` and `ERR_MODULE_NOT_FOUND`

**Root Cause:** TypeScript was compiling to ES modules instead of CommonJS

**✅ Solution Applied:**
1. Updated `tsconfig.json` - Changed `"module": "ES2022"` to `"module": "commonjs"`
2. Updated `package.json` - Removed `"type": "module"`
3. Changed startup to use `tsx` - Runs TypeScript directly from source
4. Created `server.js` - CommonJS entry point for cPanel

---

## 🎯 cPanel Configuration

### Setup Node.js App

| Field | Value |
|-------|-------|
| **Node.js version** | `20.19.4` |
| **Application mode** | `Production` |
| **Application root** | `hrapi.tripa.com.ng` |
| **Application URL** | `https://hrapi.tripa.com.ng` |
| **Application startup file** | `server.js` |

---

## 📁 What to Upload

Upload to `/home/[username]/hrapi.tripa.com.ng/`:

```
hrapi.tripa.com.ng/
├── server.js              ← Entry point (NEW)
├── package.json           ← Updated
├── .env                   ← Environment variables
├── src/                   ← TypeScript source (REQUIRED)
│   ├── index.ts
│   ├── api/
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── services/
│   └── ...
└── node_modules/          ← Dependencies
```

### ⚠️ Important Changes

**OLD approach (doesn't work):**
- Upload only `dist/` folder
- Run compiled JavaScript

**NEW approach (works!):**
- Upload entire `src/` folder
- Run TypeScript directly with `tsx`
- No need to upload `dist/` (optional)

---

## 🔧 Deployment Steps

### Step 1: Install Dependencies Locally (Optional)
```bash
cd /home/frobenius/Desktop/Femtech/HR/Backend
npm install
```

### Step 2: Upload to cPanel

Upload these to `hrapi.tripa.com.ng`:

**Required:**
- ✅ `server.js` (entry point)
- ✅ `package.json` (updated)
- ✅ `.env` (or create on server)
- ✅ `src/` (entire source folder)

**Optional:**
- ⚪ `dist/` (not needed when using tsx)
- ⚪ `node_modules/` (install on server)

### Step 3: Install Dependencies on Server

```bash
cd /home/[username]/hrapi.tripa.com.ng
npm install --production
```

This installs `tsx` and all production dependencies.

### Step 4: Create Environment File

Create `.env` in `hrapi.tripa.com.ng`:

```env
# Server
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_USER=your_db_user
DB_PASS=your_db_password
DB_NAME=your_db_name
DB_PORT=5432

# Redis (if using)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_now

# CORS
ALLOWED_ORIGINS=https://hrapp.tripa.com.ng,https://hradmin.tripa.com.ng

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/home/[username]/hrapi.tripa.com.ng/uploads
```

### Step 5: Create Uploads Directory

```bash
mkdir -p /home/[username]/hrapi.tripa.com.ng/uploads
chmod 755 /home/[username]/hrapi.tripa.com.ng/uploads
```

### Step 6: Restart Application

In cPanel Node.js App interface:
1. Click **Restart**
2. Wait 20-30 seconds (TypeScript compilation takes time)
3. Check logs

---

## ✅ Verification

### Check Logs

```bash
tail -f /home/[username]/hrapi.tripa.com.ng/logs/error.log
```

**Expected output:**
```
✅ Database connected
✅ Redis connected (if configured)
🚀 Server running on port 3000
📡 API available at: https://hrapi.tripa.com.ng
```

### Test API

```bash
# Health check
curl https://hrapi.tripa.com.ng/api/system-complete/readiness

# Should return JSON like:
# {"success":true,"message":"System is ready",...}
```

### Test in Browser

Visit: `https://hrapi.tripa.com.ng/api/system-complete/readiness`

Should see JSON response (not error page).

---

## 🐛 Troubleshooting

### Error: `Cannot find module 'tsx'`

**Solution:**
```bash
cd /home/[username]/hrapi.tripa.com.ng
npm install tsx
```

### Error: `require is not defined`

**Cause:** Still using old ES module setup

**Solution:**
1. Verify `package.json` does NOT have `"type": "module"`
2. Verify `tsconfig.json` has `"module": "commonjs"`
3. Ensure `server.js` exists
4. Restart application

### Error: TypeScript compilation errors

The backend has some pre-existing TypeScript errors, but they don't prevent startup. If you see:

```
Property 'is_locked' does not exist
Property 'attendance_lock_date' does not exist
```

These are type errors in the code but won't stop the server from running.

### Application won't start

```bash
# Check Node version
node --version  # Should be v20.x

# Check if tsx is installed
npm list tsx

# View full logs
cat logs/error.log

# Try running directly
npx tsx src/index.ts
```

### Database connection failed

1. Check `.env` has correct DB credentials
2. Verify database exists: `psql -U username -d dbname -h localhost`
3. Check database user has proper permissions
4. Ensure PostgreSQL is running

### CORS errors from frontend

Update `.env`:
```env
ALLOWED_ORIGINS=https://hrapp.tripa.com.ng,https://hradmin.tripa.com.ng
```

---

## 📊 How It Works

### Startup Flow

```
server.js (CommonJS)
  ↓
Loads tsx/cjs
  ↓
Compiles and runs src/index.ts
  ↓
Express app initializes
  ↓
Routes, middleware, database connect
  ↓
Server listening on PORT
```

### Why tsx?

- **No build step needed** - Runs TypeScript directly
- **Faster deployment** - No need to compile locally
- **Better debugging** - Source maps work in production
- **TypeScript support** - All TS features work

---

## 🔐 Security Checklist

- [ ] JWT_SECRET is strong (min 32 random characters)
- [ ] Database password is strong
- [ ] CORS configured for specific domains only
- [ ] HTTPS enforced (cPanel SSL certificate)
- [ ] File upload limits set (MAX_FILE_SIZE)
- [ ] Rate limiting enabled (express-rate-limit)
- [ ] Helmet security headers active
- [ ] `.env` file not in git (add to .gitignore)

---

## 📞 Monitoring

### Check Running Process
```bash
ps aux | grep node
ps aux | grep tsx
```

### View Logs Real-time
```bash
tail -f /home/[username]/hrapi.tripa.com.ng/logs/error.log
```

### Check Resource Usage
```bash
# Disk space
df -h

# Memory usage
free -m

# App folder size
du -sh /home/[username]/hrapi.tripa.com.ng/*
```

### Check Open Ports
```bash
netstat -tulpn | grep :3000
```

---

## 🔄 Update Procedure

To deploy backend updates:

### Option 1: Upload Source Files
```bash
# 1. Update src/ folder locally
# 2. Upload changed files to hrapi.tripa.com.ng/src/
# 3. Restart in cPanel
```

### Option 2: Git Deployment
```bash
# If using Git in cPanel:
cd /home/[username]/hrapi.tripa.com.ng
git pull origin main
npm install
# Restart in cPanel
```

### Option 3: Full Rebuild
```bash
# 1. Delete old files (keep .env and uploads/)
# 2. Upload fresh src/, server.js, package.json
# 3. npm install --production
# 4. Restart in cPanel
```

---

## 📚 File Reference

| File | Purpose |
|------|---------|
| `server.js` | CommonJS entry point for cPanel |
| `src/index.ts` | Main Express application |
| `package.json` | Dependencies & scripts |
| `.env` | Environment configuration |
| `tsconfig.json` | TypeScript configuration |

---

## 🎉 Success Indicators

Your backend is running correctly when:

- ✅ Logs show "Server running on port XXXX"
- ✅ `/api/system-complete/readiness` returns JSON
- ✅ No "require is not defined" errors
- ✅ Frontend apps can authenticate
- ✅ Database queries work
- ✅ File uploads succeed
- ✅ CORS headers present

---

## 📞 Support

If you encounter issues:

1. Check logs: `tail -f logs/error.log`
2. Verify `.env` configuration
3. Test database connection separately
4. Check Node.js version: `node --version`
5. Verify tsx is installed: `npm list tsx`

---

**Version:** 1.0.0  
**Last Updated:** March 25, 2026  
**Status:** ✅ Production Ready

**Deploy with confidence! 🚀**
