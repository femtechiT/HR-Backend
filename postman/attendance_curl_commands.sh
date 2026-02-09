#!/bin/bash

# HR App Attendance API cURL Commands
# Admin credentials: oluwarotimiadewumi@gmail.com / admin123
# Staff credentials: oluwarotimi.adewumi@tripa.com.ng / 7eM0xWOsZKe

BASE_URL="http://localhost:3000"

echo "=== HR App Attendance API cURL Commands ==="
echo ""

# Step 1: Get admin token
echo "# Step 1: Get admin authentication token"
echo "curl -X POST $BASE_URL/api/auth/login \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"email\":\"oluwarotimiadewumi@gmail.com\",\"password\":\"admin123\"}'"
echo ""

# Step 2: Get staff token
echo "# Step 2: Get staff authentication token"
echo "curl -X POST $BASE_URL/api/auth/login \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"email\":\"oluwarotimi.adewumi@tripa.com.ng\",\"password\":\"7eM0xWOsZKe\"}'"
echo ""

# Instructions for using tokens
echo "# After getting tokens, replace {{TOKEN}} in the following commands with the actual token"
echo ""

# Attendance History for User (Admin only)
echo "# Get attendance history for user ID 1 (Admin only)"
echo "curl -X GET $BASE_URL/api/attendance/history/user/1 \\"
echo "  -H 'Authorization: Bearer {{ADMIN_TOKEN}}' \\"
echo "  -H 'Content-Type: application/json'"
echo ""

# Monthly Attendance Report (Admin only)
echo "# Get monthly attendance report for October 2023 (Admin only)"
echo "curl -X GET '$BASE_URL/api/attendance/reports/monthly?year=2023&month=10' \\"
echo "  -H 'Authorization: Bearer {{ADMIN_TOKEN}}' \\"
echo "  -H 'Content-Type: application/json'"
echo ""

# Get All Attendance Records (Admin only)
echo "# Get all attendance records with pagination (Admin only)"
echo "curl -X GET '$BASE_URL/api/attendance/records?page=1&limit=10' \\"
echo "  -H 'Authorization: Bearer {{ADMIN_TOKEN}}' \\"
echo "  -H 'Content-Type: application/json'"
echo ""

# Get Specific Attendance Record by ID (Admin only)
echo "# Get specific attendance record by ID (Admin only)"
echo "curl -X GET $BASE_URL/api/attendance/records/1 \\"
echo "  -H 'Authorization: Bearer {{ADMIN_TOKEN}}' \\"
echo "  -H 'Content-Type: application/json'"
echo ""

# Get Attendance Records (General) - Admin
echo "# Get attendance records with filters (Admin)"
echo "curl -X GET '$BASE_URL/api/attendance?userId=1&startDate=2023-01-01&endDate=2023-12-31' \\"
echo "  -H 'Authorization: Bearer {{ADMIN_TOKEN}}' \\"
echo "  -H 'Content-Type: application/json'"
echo ""

# Get Attendance Records (General) - Staff
echo "# Get attendance records with filters (Staff - limited to own records)"
echo "curl -X GET '$BASE_URL/api/attendance?startDate=2023-01-01&endDate=2023-12-31' \\"
echo "  -H 'Authorization: Bearer {{STAFF_TOKEN}}' \\"
echo "  -H 'Content-Type: application/json'"
echo ""

# Get My Attendance Records (Staff)
echo "# Get current user's attendance records (Staff)"
echo "curl -X GET $BASE_URL/api/attendance/my \\"
echo "  -H 'Authorization: Bearer {{STAFF_TOKEN}}' \\"
echo "  -H 'Content-Type: application/json'"
echo ""

# Get Attendance Summary (Admin)
echo "# Get attendance summary for user ID 1 (Admin)"
echo "curl -X GET '$BASE_URL/api/attendance/summary?userId=1&startDate=2023-01-01&endDate=2023-12-31' \\"
echo "  -H 'Authorization: Bearer {{ADMIN_TOKEN}}' \\"
echo "  -H 'Content-Type: application/json'"
echo ""

# Get Attendance Summary (Staff)
echo "# Get current user's attendance summary (Staff)"
echo "curl -X GET '$BASE_URL/api/attendance/my/summary?startDate=2023-01-01&endDate=2023-12-31' \\"
echo "  -H 'Authorization: Bearer {{STAFF_TOKEN}}' \\"
echo "  -H 'Content-Type: application/json'"
echo ""

# Get Attendance Record by ID (Admin)
echo "# Get specific attendance record by ID (Admin)"
echo "curl -X GET $BASE_URL/api/attendance/1 \\"
echo "  -H 'Authorization: Bearer {{ADMIN_TOKEN}}' \\"
echo "  -H 'Content-Type: application/json'"
echo ""

# Get My Attendance Record by ID (Staff)
echo "# Get current user's specific attendance record by ID (Staff)"
echo "curl -X GET $BASE_URL/api/attendance/my/1 \\"
echo "  -H 'Authorization: Bearer {{STAFF_TOKEN}}' \\"
echo "  -H 'Content-Type: application/json'"
echo ""

# Update Attendance Record (Admin only)
echo "# Update attendance record (Admin only)"
echo "curl -X PUT $BASE_URL/api/attendance/1 \\"
echo "  -H 'Authorization: Bearer {{ADMIN_TOKEN}}' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"status\":\"present\",\"check_in_time\":\"09:00:00\",\"check_out_time\":\"17:00:00\",\"location_verified\":true}'"
echo ""

# Manual Attendance Creation (Admin only)
echo "# Create manual attendance record (Admin only)"
echo "curl -X POST $BASE_URL/api/attendance/manual \\"
echo "  -H 'Authorization: Bearer {{ADMIN_TOKEN}}' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"date\":\"2023-10-15\",\"check_in_time\":\"09:00:00\",\"check_out_time\":\"17:00:00\",\"status\":\"present\",\"location_coordinates\":{\"latitude\":-1.286389,\"longitude\":36.817223},\"location_address\":\"Nairobi Office\",\"user_id\":1}'"
echo ""

echo "# Notes:"
echo "# - Replace {{ADMIN_TOKEN}} with the actual admin JWT token"
echo "# - Replace {{STAFF_TOKEN}} with the actual staff JWT token"
echo "# - Adjust user IDs and dates as needed for your testing"
echo "# - Some endpoints require admin privileges and will return 403 for regular staff users"