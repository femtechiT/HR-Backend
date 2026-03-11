# 📡 Attendance API Testing Guide

## 🚀 Quick Start: Setting Up Your Token

### Option 1: Get Token via Login Command

```bash
# Step 1: Login and save token to a variable
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.co.ke",
    "password": "Admin@123!"
  }' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Step 2: Verify token was saved
echo "Token: ${TOKEN:0:50}..."
```

### Option 2: Use Your Already-Copied Token

```bash
# If you already have the token as text, just paste it here:
TOKEN="paste_your_full_token_here"

# Verify it's set
echo "Token is set: ${#TOKEN} characters"
```

### Option 3: Export Token for Current Terminal Session

```bash
# Copy your token, then run:
export TOKEN="your_token_here"

# Now all commands below will work in this terminal session
```

---

## ✅ Verify Token is Set

Before running any commands, verify your token is set:

```bash
echo $TOKEN
```

If you see a long string of characters, you're ready! If you see nothing, set the token first.

---

## 📍 1. CHECK-IN / CHECK-OUT

> ⚠️ **Important:** The `location_coordinates` field must use MySQL POINT format: `"POINT(longitude latitude)"` - NOT a JSON object.

### Check-In (On Time) - With Location
**What it does:** Marks your arrival at work with GPS location verification
```bash
curl -X POST http://localhost:3000/api/attendance/check-in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "date": "2026-03-03",
    "check_in_time": "09:00:00",
    "location_coordinates": "POINT(-0.1278 51.5074)",
    "location_address": "London Office, UK"
  }'
```

### Check-In (On Time) - Without Location (Simplest for Testing)
**What it does:** Marks your arrival without location verification
```bash
curl -X POST http://localhost:3000/api/attendance/check-in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "date": "2026-03-03",
    "check_in_time": "09:00:00"
  }'
```

### Check-In (Late - After Shift Start)
**What it does:** Marks late arrival (after scheduled shift start time)
```bash
curl -X POST http://localhost:3000/api/attendance/check-in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "date": "2026-03-03",
    "check_in_time": "09:30:00",
    "location_coordinates": "POINT(-0.1278 51.5074)",
    "location_address": "London Office, UK"
  }'
```

### Check-Out - With Location
**What it does:** Marks your end-of-day departure with location verification
```bash
curl -X POST http://localhost:3000/api/attendance/check-out \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "date": "2026-03-03",
    "check_out_time": "17:30:00",
    "location_coordinates": "POINT(-0.1278 51.5074)",
    "location_address": "London Office, UK"
  }'
```

### Check-Out - Without Location (Simplest for Testing)
**What it does:** Marks your end-of-day departure without location
```bash
curl -X POST http://localhost:3000/api/attendance/check-out \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "date": "2026-03-03",
    "check_out_time": "17:30:00" 
  }'
```

---

## 📋 2. VIEW ATTENDANCE RECORDS

### Get My Attendance (All Records)
**What it does:** Retrieves all your attendance records
```bash
curl -X GET "http://localhost:3000/api/attendance/my" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Get My Attendance for Specific Date
**What it does:** Retrieves your attendance for a single date
```bash
curl -X GET "http://localhost:3000/api/attendance/my?date=2026-03-03" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Get My Attendance for Date Range
**What it does:** Retrieves your attendance records within a date range
```bash
curl -X GET "http://localhost:3000/api/attendance/my?startDate=2026-03-01&endDate=2026-03-31" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Get My Attendance Filtered by Status
**What it does:** Retrieves your attendance records filtered by status (present, late, absent, leave, holiday)
```bash
curl -X GET "http://localhost:3000/api/attendance/my?status=present" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Get All Attendance Records (Admin/HR Only)
**What it does:** Retrieves all attendance records across the organization
```bash
curl -X GET "http://localhost:3000/api/attendance" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Get Attendance for Specific User (Admin/HR Only)
**What it does:** Retrieves attendance records for a specific employee
```bash
curl -X GET "http://localhost:3000/api/attendance?userId=5" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Get Attendance Records with Pagination (Admin/HR Only)
**What it does:** Retrieves paginated attendance records for easier browsing
```bash
curl -X GET "http://localhost:3000/api/attendance/records?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Get Single Attendance Record by ID
**What it does:** Retrieves a specific attendance record by its ID
```bash
curl -X GET "http://localhost:3000/api/attendance/my/123" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

## 📊 3. ATTENDANCE SUMMARY & REPORTS

### Get My Attendance Summary
**What it does:** Gets your attendance statistics (present days, late days, etc.) for a period
```bash
curl -X GET "http://localhost:3000/api/attendance/my/summary?startDate=2026-03-01&endDate=2026-03-31" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Get User Attendance Summary (Admin/HR Only)
**What it does:** Gets attendance statistics for a specific employee
```bash
curl -X GET "http://localhost:3000/api/attendance/summary?userId=5&startDate=2026-03-01&endDate=2026-03-31" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Get Monthly Attendance Report
**What it does:** Generates a complete attendance report for a specific month
```bash
curl -X GET "http://localhost:3000/api/attendance/reports/monthly?year=2026&month=3" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Get Monthly Report for Specific User (Admin/HR Only)
**What it does:** Generates a monthly attendance report for a specific employee
```bash
curl -X GET "http://localhost:3000/api/attendance/reports/monthly?year=2026&month=3&userId=5" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Get Staff Attendance Data for Dashboard
**What it does:** Gets attendance summary for all staff (for dashboard display)
```bash
curl -X GET "http://localhost:3000/api/attendance/staff-data?startDate=2026-03-01&endDate=2026-03-31" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Get Staff Data Filtered by Branch
**What it does:** Gets staff attendance data for a specific branch only
```bash
curl -X GET "http://localhost:3000/api/attendance/staff-data?branchId=1" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Get Staff Data Filtered by Department
**What it does:** Gets staff attendance data for a specific department only
```bash
curl -X GET "http://localhost:3000/api/attendance/staff-data?departmentId=2" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

## ✏️ 4. MANUAL ATTENDANCE (Admin Only)

### Manually Create Attendance Record
**What it does:** Admin manually creates an attendance record for an employee
```bash
curl -X POST http://localhost:3000/api/attendance/manual \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "user_id": 5,
    "date": "2026-03-03",
    "check_in_time": "09:00:00",
    "check_out_time": "17:30:00",
    "status": "present",
    "location_coordinates": "POINT(-0.1278 51.5074)",
    "location_address": "London Office, UK"
  }' | jq .
```

### Update Attendance Record (Admin)
**What it does:** Admin edits an existing attendance record
```bash
curl -X PUT http://localhost:3000/api/attendance/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "present",
    "check_in_time": "09:15:00",
    "check_out_time": "17:30:00",
    "location_verified": true
  }' | jq .
```

---

## ⚙️ 5. PROCESS ATTENDANCE (Admin/HR Only)

### Process Attendance for a Specific Date
**What it does:** Processes and marks attendance status for a user on a specific date
```bash
curl -X POST http://localhost:3000/api/attendance/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "date": "2026-03-02",
    "userId": 5
  }' | jq .
```

### Process Attendance for Current User
**What it does:** Processes and marks your own attendance for a specific date
```bash
curl -X POST http://localhost:3000/api/attendance/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "date": "2026-03-02"
  }' | jq .
```

### Batch Process Attendance for Multiple Users
**What it does:** Processes attendance for multiple employees at once
```bash
curl -X POST http://localhost:3000/api/attendance/process-batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "date": "2026-03-02",
    "userIds": [5, 6, 7, 8]
  }' | jq .
```

---

## 🏢 6. ATTENDANCE SETTINGS

### Get Attendance Settings for Branch
**What it does:** Retrieves attendance configuration for a specific branch
```bash
curl -X GET "http://localhost:3000/api/attendance/settings?branchId=1" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Update Attendance Settings
**What it does:** Updates attendance configuration for a branch (grace period, check-in requirements, etc.)
```bash
curl -X PATCH http://localhost:3000/api/attendance/settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "branchId": 1,
    "settings": {
      "attendance_mode": "branch_based",
      "grace_period_minutes": 15,
      "require_check_in": true,
      "require_check_out": true,
      "auto_checkout_enabled": true,
      "auto_checkout_minutes_after_close": 30,
      "enable_location_verification": true
    }
  }' | jq .
```

### Get Global Attendance Settings
**What it does:** Retrieves system-wide attendance configuration
```bash
curl -X GET http://localhost:3000/api/attendance/settings/global \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Update Global Attendance Settings
**What it does:** Updates system-wide attendance configuration
```bash
curl -X PATCH http://localhost:3000/api/attendance/settings/global \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "settings": {
      "grace_period_minutes": 10,
      "auto_checkout_enabled": true,
      "notify_absent_employees": true,
      "notify_supervisors_daily_summary": true
    }
  }' | jq .
```

---

## 🌍 7. ATTENDANCE LOCATIONS

### Get All Attendance Locations
**What it does:** Retrieves all approved GPS locations for attendance check-in
```bash
curl -X GET http://localhost:3000/api/attendance-locations \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Get Locations by Branch
**What it does:** Retrieves approved locations for a specific branch
```bash
curl -X GET "http://localhost:3000/api/attendance-locations?branchId=1" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Get Active Locations Only
**What it does:** Retrieves only currently active/approved locations
```bash
curl -X GET "http://localhost:3000/api/attendance-locations?isActive=true" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Get Single Location by ID
**What it does:** Retrieves details of a specific attendance location
```bash
curl -X GET http://localhost:3000/api/attendance-locations/1 \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Create New Attendance Location
**What it does:** Adds a new GPS location where employees can check in
```bash
curl -X POST http://localhost:3000/api/attendance-locations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "London Office - Main Entrance",
    "location_coordinates": "POINT(-0.1278 51.5074)",
    "location_radius_meters": 100,
    "branch_id": 1,
    "is_active": true
  }' | jq .
```

### Update Attendance Location
**What it does:** Modifies an existing attendance location's settings
```bash
curl -X PUT http://localhost:3000/api/attendance-locations/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "London Office - Updated",
    "location_radius_meters": 150,
    "is_active": true
  }' | jq .
```

### Delete (Deactivate) Attendance Location
**What it does:** Deactivates a location so employees can no longer check in there
```bash
curl -X DELETE http://localhost:3000/api/attendance-locations/1 \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

## 🎉 8. HOLIDAYS

### Get All Holidays
**What it does:** Retrieves all public/company holidays
```bash
curl -X GET http://localhost:3000/api/attendance/holidays \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Get Holidays for Specific Branch
**What it does:** Retrieves holidays for a specific branch location
```bash
curl -X GET "http://localhost:3000/api/attendance/holidays?branchId=1" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Get Holidays in Date Range
**What it does:** Retrieves holidays within a specific date range
```bash
curl -X GET "http://localhost:3000/api/attendance/holidays?startDate=2026-01-01&endDate=2026-12-31" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Check if Specific Date is a Holiday
**What it does:** Checks if a specific date is a holiday
```bash
curl -X GET "http://localhost:3000/api/attendance/holidays?date=2026-12-25" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

## 📁 9. ATTENDANCE HISTORY (Specific User - Admin Only)

### Get User Attendance History
**What it does:** Retrieves complete attendance history for a specific employee
```bash
curl -X GET http://localhost:3000/api/attendance/history/user/5 \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

## 🧪 TESTING SCENARIOS

### Scenario 1: Full Day Attendance (Normal Day)
```bash
# Morning check-in (on time) - NO location
curl -X POST http://localhost:3000/api/attendance/check-in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "date": "2026-03-03",
    "check_in_time": "08:55:00"
  }' | jq .

# Evening check-out - NO location
curl -X POST http://localhost:3000/api/attendance/check-out \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "date": "2026-03-03",
    "check_out_time": "17:45:00"
  }' | jq .

# Verify the record
curl -X GET "http://localhost:3000/api/attendance/my?date=2026-03-03" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Scenario 1b: Full Day Attendance - WITH Location
```bash
# Morning check-in (on time) - WITH location
curl -X POST http://localhost:3000/api/attendance/check-in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "date": "2026-03-03",
    "check_in_time": "08:55:00",
    "location_coordinates": "POINT(-0.1278 51.5074)",
    "location_address": "London Office"
  }' | jq .

# Evening check-out - WITH location
curl -X POST http://localhost:3000/api/attendance/check-out \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "date": "2026-03-03",
    "check_out_time": "17:45:00",
    "location_coordinates": "POINT(-0.1278 51.5074)"
  }' | jq .
```

### Scenario 2: Late Arrival
```bash
# Check-in late (shift starts at 09:00) - NO location
curl -X POST http://localhost:3000/api/attendance/check-in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "date": "2026-03-04",
    "check_in_time": "09:30:00"
  }' | jq .
```

### Scenario 3: Try Double Check-In (Should Fail)
```bash
# First check-in
curl -X POST http://localhost:3000/api/attendance/check-in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "date": "2026-03-05",
    "check_in_time": "09:00:00"
  }' | jq .

# Second check-in (should return error)
curl -X POST http://localhost:3000/api/attendance/check-in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "date": "2026-03-05",
    "check_in_time": "10:00:00"
  }' | jq .
```

### Scenario 4: Check-Out Without Check-In (Should Fail)
```bash
curl -X POST http://localhost:3000/api/attendance/check-out \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "date": "2026-03-06",
    "check_out_time": "17:00:00"
  }' | jq .
```

---

## 💡 HELPER SCRIPTS

### Create a Test Script File

Save this as `test-attendance.sh`:

```bash
#!/bin/bash

# Attendance API Test Script
# Usage: ./test-attendance.sh

# Set your token here or export it before running
export TOKEN="your_token_here"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Attendance API Tests ===${NC}"
echo ""

# Test 1: Check-In (NO location - simplest)
echo -e "${GREEN}Test 1: Check-In${NC}"
curl -s -X POST http://localhost:3000/api/attendance/check-in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "date": "'$(date +%Y-%m-%d)'",
    "check_in_time": "09:00:00"
  }' | jq .

echo ""

# Test 2: Get Today's Attendance
echo -e "${GREEN}Test 2: Get Today's Attendance${NC}"
curl -s -X GET "http://localhost:3000/api/attendance/my?date=$(date +%Y-%m-%d)" \
  -H "Authorization: Bearer $TOKEN" | jq .

echo ""
echo -e "${GREEN}=== Tests Complete ===${NC}"
```

Make it executable and run:
```bash
chmod +x test-attendance.sh
./test-attendance.sh
```

---

### Create Aliases for Quick Testing

Add these to your `~/.bashrc` or `~/.zshrc`:

```bash
# Attendance API Aliases
alias att-checkin='curl -X POST http://localhost:3000/api/attendance/check-in -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d'
alias att-checkout='curl -X POST http://localhost:3000/api/attendance/check-out -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d'
alias att-me='curl -s -X GET "http://localhost:3000/api/attendance/my" -H "Authorization: Bearer $TOKEN" | jq .'
alias att-summary='curl -s -X GET "http://localhost:3000/api/attendance/my/summary?startDate=2026-03-01&endDate=2026-03-31" -H "Authorization: Bearer $TOKEN" | jq .'
```

Then reload your shell:
```bash
source ~/.bashrc  # or source ~/.zshrc
```

---

## 📋 QUICK REFERENCE TABLE

| Endpoint | Method | Permission | Description |
|----------|--------|------------|-------------|
| `/api/attendance/check-in` | POST | User | Mark your arrival at work |
| `/api/attendance/check-out` | POST | User | Mark your end-of-day departure |
| `/api/attendance/my` | GET | User | Get your own attendance records |
| `/api/attendance/my/summary` | GET | User | Get your attendance statistics |
| `/api/attendance` | GET | attendance:read | Get all attendance (admin view) |
| `/api/attendance/records` | GET | attendance:read | Get paginated attendance records |
| `/api/attendance/summary` | GET | attendance:read | Get user attendance summary |
| `/api/attendance/reports/monthly` | GET | attendance:read | Generate monthly attendance report |
| `/api/attendance/staff-data` | GET | attendance:read | Get staff dashboard data |
| `/api/attendance/manual` | POST | attendance:manage | Manually create attendance (admin) |
| `/api/attendance/:id` | PUT | attendance:update | Update attendance record (admin) |
| `/api/attendance/process` | POST | attendance:manage | Process attendance for a date |
| `/api/attendance/process-batch` | POST | attendance:manage | Batch process multiple users |
| `/api/attendance/settings` | GET/PATCH | attendance:manage | Branch attendance settings |
| `/api/attendance/settings/global` | GET/PATCH | attendance:manage | Global attendance settings |
| `/api/attendance-locations` | GET/POST | attendance_location:* | Manage check-in locations |
| `/api/attendance/holidays` | GET | attendance:view | Get holiday calendar |
| `/api/attendance/history/user/:id` | GET | attendance:read | Get user's full attendance history |

---

## 🔧 TROUBLESHOOTING

### Token Not Working?
```bash
# Check if token is set
echo $TOKEN

# If empty, set it again
export TOKEN="your_token_here"
```

### Getting 401 Unauthorized?
- Your token may have expired. Login again and get a new token.
- Make sure there are no extra spaces in the token.

### Getting 403 Forbidden?
- Your user account doesn't have the required permission for that endpoint.
- Contact your admin to grant the necessary permissions.

### JSON Not Formatted Nicely?
- Install `jq` for pretty JSON output:
  ```bash
  # Ubuntu/Debian
  sudo apt install jq
  
  # macOS
  brew install jq
  ```

---

## 📝 NOTES

1. **`$TOKEN`** - This variable holds your JWT authentication token
2. **`jq`** - Command-line JSON processor for pretty output (optional but recommended)
3. All dates should be in **YYYY-MM-DD** format
4. All times should be in **HH:MM:SS** format (24-hour)
5. **Location coordinates format** (IMPORTANT!):
   - ✅ Correct: `"POINT(-0.1278 51.5074)"` (MySQL POINT format: longitude first, then latitude)
   - ❌ Wrong: `{"latitude": "51.5074", "longitude": "-0.1278"}` (JSON object won't work)
   - For testing, you can omit location entirely and just send date + time

---

**Happy Testing! 🎉**
