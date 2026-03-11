Prerequisites
    First, you need to get an authentication token by logging in:

     1 # Login to get JWT token
     2 curl -X POST http://localhost:3000/api/auth/login \
     3   -H "Content-Type: application/json" \
     4   -d '{
     5     "email": "admin@example.com",
     6     "password": "your_password"
     7   }'

    Save the token from the response and use it in all subsequent requests.

    ---

    📍 1. CHECK-IN / CHECK-OUT

    Check-In

      1 curl -X POST http://localhost:3000/api/attendance/check-in \
      2   -H "Content-Type: application/json" \
      3   -H "Authorization: Bearer YOUR_TOKEN_HERE" \
      4   -d '{
      5     "date": "2026-03-03",
      6     "check_in_time": "09:00:00",
      7     "location_coordinates": {
      8       "latitude": "51.5074",
      9       "longitude": "-0.1278"
     10     },
     11     "location_address": "London Office, UK"
     12   }'

    Check-Out

      1 curl -X POST http://localhost:3000/api/attendance/check-out \
      2   -H "Content-Type: application/json" \
      3   -H "Authorization: Bearer YOUR_TOKEN_HERE" \
      4   -d '{
      5     "date": "2026-03-03",
      6     "check_out_time": "17:30:00",
      7     "location_coordinates": {
      8       "latitude": "51.5074",
      9       "longitude": "-0.1278"
     10     },
     11     "location_address": "London Office, UK"
     12   }'

    ---

    📋 2. VIEW ATTENDANCE RECORDS

    Get My Attendance

     1 curl -X GET "http://localhost:3000/api/attendance/my" \
     2   -H "Authorization: Bearer YOUR_TOKEN_HERE"

    Get My Attendance with Date Filter

     1 curl -X GET "http://localhost:3000/api/attendance/my?date=2026-03-03" \
     2   -H "Authorization: Bearer YOUR_TOKEN_HERE"

    Get My Attendance with Date Range

     1 curl -X GET "http://localhost:3000/api/attendance/my?startDate=2026-03-01&endDate=2026-03-31" \
     2   -H "Authorization: Bearer YOUR_TOKEN_HERE"

    Get My Attendance by Status

     1 curl -X GET "http://localhost:3000/api/attendance/my?status=present" \
     2   -H "Authorization: Bearer YOUR_TOKEN_HERE"

    Get All Attendance Records (Admin/HR)

     1 curl -X GET "http://localhost:3000/api/attendance" \
     2   -H "Authorization: Bearer YOUR_TOKEN_HERE"

    Get Attendance for Specific User (Admin/HR)

     1 curl -X GET "http://localhost:3000/api/attendance?userId=5" \
     2   -H "Authorization: Bearer YOUR_TOKEN_HERE"

    Get Attendance Records with Pagination (Admin/HR)

     1 curl -X GET "http://localhost:3000/api/attendance/records?page=1&limit=20" \
     2   -H "Authorization: Bearer YOUR_TOKEN_HERE"

    Get Single Attendance Record by ID

     1 curl -X GET "http://localhost:3000/api/attendance/my/123" \
     2   -H "Authorization: Bearer YOUR_TOKEN_HERE"

    ---

    📊 3. ATTENDANCE SUMMARY & REPORTS

    Get My Attendance Summary

     1 curl -X GET "http://localhost:3000/api/attendance/my/summary?startDate=2026-03-01&endDate=2026-03-31" \
     2   -H "Authorization: Bearer YOUR_TOKEN_HERE"

    Get User Attendance Summary (Admin/HR)

     1 curl -X GET "http://localhost:3000/api/attendance/summary?userId=5&startDate=2026-03-01&endDate=2026-03-31" \
     2   -H "Authorization: Bearer YOUR_TOKEN_HERE"

    Get Monthly Attendance Report

     1 curl -X GET "http://localhost:3000/api/attendance/reports/monthly?year=2026&month=3" \
     2   -H "Authorization: Bearer YOUR_TOKEN_HERE"

    Get Monthly Report for Specific User

     1 curl -X GET "http://localhost:3000/api/attendance/reports/monthly?year=2026&month=3&userId=5" \
     2   -H "Authorization: Bearer YOUR_TOKEN_HERE"

    Get Staff Attendance Data for Dashboard

     1 curl -X GET "http://localhost:3000/api/attendance/staff-data?startDate=2026-03-01&endDate=2026-03-31" \
     2   -H "Authorization: Bearer YOUR_TOKEN_HERE"

    Get Staff Data Filtered by Branch

     1 curl -X GET "http://localhost:3000/api/attendance/staff-data?branchId=1" \
     2   -H "Authorization: Bearer YOUR_TOKEN_HERE"

    Get Staff Data Filtered by Department

     1 curl -X GET "http://localhost:3000/api/attendance/staff-data?departmentId=2" \
     2   -H "Authorization: Bearer YOUR_TOKEN_HERE"

    ---

    ✏️ 4. MANUAL ATTENDANCE (Admin Only)

    Manually Create Attendance Record

      1 curl -X POST http://localhost:3000/api/attendance/manual \
      2   -H "Content-Type: application/json" \
      3   -H "Authorization: Bearer YOUR_TOKEN_HERE" \
      4   -d '{
      5     "user_id": 5,
      6     "date": "2026-03-03",
      7     "check_in_time": "09:00:00",
      8     "check_out_time": "17:30:00",
      9     "status": "present",
     10     "location_coordinates": "POINT(-0.1278 51.5074)",
     11     "location_address": "London Office, UK"
     12   }'

    Update Attendance Record (Admin)

     1 curl -X PUT http://localhost:3000/api/attendance/123 \
     2   -H "Content-Type: application/json" \
     3   -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     4   -d '{
     5     "status": "present",
     6     "check_in_time": "09:15:00",
     7     "check_out_time": "17:30:00",
     8     "location_verified": true
     9   }'

    ---

    ⚙️ 5. PROCESS ATTENDANCE (Admin/HR Only)

    Process Attendance for a Specific Date

     1 curl -X POST http://localhost:3000/api/attendance/process \
     2   -H "Content-Type: application/json" \
     3   -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     4   -d '{
     5     "date": "2026-03-02",
     6     "userId": 5
     7   }'

    Process Attendance for Current User

     1 curl -X POST http://localhost:3000/api/attendance/process \
     2   -H "Content-Type: application/json" \
     3   -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     4   -d '{
     5     "date": "2026-03-02"
     6   }'

    Batch Process Attendance for Multiple Users

     1 curl -X POST http://localhost:3000/api/attendance/process-batch \
     2   -H "Content-Type: application/json" \
     3   -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     4   -d '{
     5     "date": "2026-03-02",
     6     "userIds": [5, 6, 7, 8]
     7   }'

    ---

    🏢 6. ATTENDANCE SETTINGS

    Get Attendance Settings for Branch

     1 curl -X GET "http://localhost:3000/api/attendance/settings?branchId=1" \
     2   -H "Authorization: Bearer YOUR_TOKEN_HERE"

    Update Attendance Settings

      1 curl -X PATCH http://localhost:3000/api/attendance/settings \
      2   -H "Content-Type: application/json" \
      3   -H "Authorization: Bearer YOUR_TOKEN_HERE" \
      4   -d '{
      5     "branchId": 1,
      6     "settings": {
      7       "attendance_mode": "branch_based",
      8       "grace_period_minutes": 15,
      9       "require_check_in": true,
     10       "require_check_out": true,
     11       "auto_checkout_enabled": true,
     12       "auto_checkout_minutes_after_close": 30,
     13       "enable_location_verification": true
     14     }
     15   }'

    Get Global Attendance Settings

     1 curl -X GET http://localhost:3000/api/attendance/settings/global \
     2   -H "Authorization: Bearer YOUR_TOKEN_HERE"

    Update Global Attendance Settings

      1 curl -X PATCH http://localhost:3000/api/attendance/settings/global \
      2   -H "Content-Type: application/json" \
      3   -H "Authorization: Bearer YOUR_TOKEN_HERE" \
      4   -d '{
      5     "settings": {
      6       "grace_period_minutes": 10,
      7       "auto_checkout_enabled": true,
      8       "notify_absent_employees": true,
      9       "notify_supervisors_daily_summary": true
     10     }
     11   }'

    ---

    🌍 7. ATTENDANCE LOCATIONS

    Get All Attendance Locations

     1 curl -X GET http://localhost:3000/api/attendance-locations \
     2   -H "Authorization: Bearer YOUR_TOKEN_HERE"

    Get Locations by Branch

     1 curl -X GET "http://localhost:3000/api/attendance-locations?branchId=1" \
     2   -H "Authorization: Bearer YOUR_TOKEN_HERE"

    Get Active Locations Only

     1 curl -X GET "http://localhost:3000/api/attendance-locations?isActive=true" \
     2   -H "Authorization: Bearer YOUR_TOKEN_HERE"

    Get Single Location by ID

     1 curl -X GET http://localhost:3000/api/attendance-locations/1 \
     2   -H "Authorization: Bearer YOUR_TOKEN_HERE"

    Create New Attendance Location

      1 curl -X POST http://localhost:3000/api/attendance-locations \
      2   -H "Content-Type: application/json" \
      3   -H "Authorization: Bearer YOUR_TOKEN_HERE" \
      4   -d '{
      5     "name": "London Office - Main Entrance",
      6     "location_coordinates": "POINT(-0.1278 51.5074)",
      7     "location_radius_meters": 100,
      8     "branch_id": 1,
      9     "is_active": true
     10   }'

    Update Attendance Location

     1 curl -X PUT http://localhost:3000/api/attendance-locations/1 \
     2   -H "Content-Type: application/json" \
     3   -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     4   -d '{
     5     "name": "London Office - Updated",
     6     "location_radius_meters": 150,
     7     "is_active": true
     8   }'

    Delete (Deactivate) Attendance Location

     1 curl -X DELETE http://localhost:3000/api/attendance-locations/1 \
     2   -H "Authorization: Bearer YOUR_TOKEN_HERE"

    ---

    🎉 8. HOLIDAYS

    Get All Holidays

     1 curl -X GET http://localhost:3000/api/attendance/holidays \
     2   -H "Authorization: Bearer YOUR_TOKEN_HERE"

    Get Holidays for Specific Branch

     1 curl -X GET "http://localhost:3000/api/attendance/holidays?branchId=1" \
     2   -H "Authorization: Bearer YOUR_TOKEN_HERE"

    Get Holidays in Date Range

     1 curl -X GET "http://localhost:3000/api/attendance/holidays?startDate=2026-01-01&endDate=2026-12-31" \
     2   -H "Authorization: Bearer YOUR_TOKEN_HERE"

    Check if Specific Date is a Holiday

     1 curl -X GET "http://localhost:3000/api/attendance/holidays?date=2026-12-25" \
     2   -H "Authorization: Bearer YOUR_TOKEN_HERE"

    ---

    📁 9. ATTENDANCE HISTORY (Specific User)

    Get User Attendance History

     1 curl -X GET http://localhost:3000/api/attendance/history/user/5 \
     2   -H "Authorization: Bearer YOUR_TOKEN_HERE"

    ---

    🧪 TESTING SCENARIOS

    Test 1: Normal Check-In (On Time)

     1 curl -X POST http://localhost:3000/api/attendance/check-in \
     2   -H "Content-Type: application/json" \
     3   -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     4   -d '{
     5     "date": "2026-03-03",
     6     "check_in_time": "08:55:00",
     7     "location_coordinates": {"latitude": "51.5074", "longitude": "-0.1278"},
     8     "location_address": "London Office"
     9   }'

    Test 2: Late Check-In

     1 curl -X POST http://localhost:3000/api/attendance/check-in \
     2   -H "Content-Type: application/json" \
     3   -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     4   -d '{
     5     "date": "2026-03-03",
     6     "check_in_time": "09:30:00",
     7     "location_coordinates": {"latitude": "51.5074", "longitude": "-0.1278"},
     8     "location_address": "London Office"
     9   }'

    Test 3: Check-Out

     1 curl -X POST http://localhost:3000/api/attendance/check-out \
     2   -H "Content-Type: application/json" \
     3   -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     4   -d '{
     5     "date": "2026-03-03",
     6     "check_out_time": "17:45:00",
     7     "location_coordinates": {"latitude": "51.5074", "longitude": "-0.1278"}
     8   }'

    Test 4: Try Double Check-In (Should Fail)

     1 curl -X POST http://localhost:3000/api/attendance/check-in \
     2   -H "Content-Type: application/json" \
     3   -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     4   -d '{
     5     "date": "2026-03-03",
     6     "check_in_time": "10:00:00"
     7   }'

    ---

    📋 Quick Reference Table


    ┌─────────────────────────────────┬───────────┬───────────────────────┬───────────────────────┐
    │ Endpoint                        │ Method    │ Permission            │ Description           │
    ├─────────────────────────────────┼───────────┼───────────────────────┼───────────────────────┤
    │ /api/attendance/check-in        │ POST      │ User                  │ Mark check-in         │
    │ /api/attendance/check-out       │ POST      │ User                  │ Mark check-out        │
    │ /api/attendance/my              │ GET       │ User                  │ Get my attendance     │
    │ /api/attendance/my/summary      │ GET       │ User                  │ Get my summary        │
    │ /api/attendance                 │ GET       │ attendance:read       │ Get all attendance    │
    │ /api/attendance/records         │ GET       │ attendance:read       │ Get paginated records │
    │ /api/attendance/summary         │ GET       │ attendance:read       │ Get user summary      │
    │ /api/attendance/reports/monthly │ GET       │ attendance:read       │ Monthly report        │
    │ /api/attendance/staff-data      │ GET       │ attendance:read       │ Dashboard data        │
    │ /api/attendance/manual          │ POST      │ attendance:manage     │ Manual entry          │
    │ /api/attendance/:id             │ PUT       │ attendance:update     │ Update record         │
    │ /api/attendance/process         │ POST      │ attendance:manage     │ Process attendance    │
    │ /api/attendance/process-batch   │ POST      │ attendance:manage     │ Batch process         │
    │ /api/attendance/settings        │ GET/PATCH │ attendance:manage     │ Branch settings       │
    │ /api/attendance/settings/global │ GET/PATCH │ attendance:manage     │ Global settings       │
    │ /api/attendance-locations       │ GET/POST  │ attendance_location:* │ Manage locations      │
    │ /api/attendance/holidays        │ GET       │ attendance:view       │ Get holidays          │
    └─────────────────────────────────┴───────────┴───────────────────────┴───────────────────────┘


    ---

    Let me know if you need any specific test scenarios explained!
