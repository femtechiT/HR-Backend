#!/bin/bash

# HR App Attendance API Testing Script
# This script handles authentication and provides cURL commands for all attendance endpoints
# Admin credentials: oluwarotimiadewumi@gmail.com / admin123
# Staff credentials: oluwarotimi.adewumi@tripa.com.ng / 7eM0xWOsZKe

BASE_URL="http://localhost:3000"

echo "=== HR App Attendance API Testing Script ==="
echo ""

# Function to get admin token
get_admin_token() {
    echo "Getting admin token..."
    ADMIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
        -H 'Content-Type: application/json' \
        -d '{"email":"oluwarotimiadewumi@gmail.com","password":"admin123"}')
    
    ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$ADMIN_TOKEN" ]; then
        echo "Failed to get admin token. Response: $ADMIN_RESPONSE"
        return 1
    fi
    
    echo "Admin token retrieved: ${ADMIN_TOKEN:0:20}..."
    export ADMIN_TOKEN
}

# Function to get staff token
get_staff_token() {
    echo "Getting staff token..."
    STAFF_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
        -H 'Content-Type: application/json' \
        -d '{"email":"oluwarotimi.adewumi@tripa.com.ng","password":"7eM0xWOsZKe"}')
    
    STAFF_TOKEN=$(echo $STAFF_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$STAFF_TOKEN" ]; then
        echo "Failed to get staff token. Response: $STAFF_RESPONSE"
        return 1
    fi
    
    echo "Staff token retrieved: ${STAFF_TOKEN:0:20}..."
    export STAFF_TOKEN
}

# Function to test attendance endpoints
test_attendance_endpoints() {
    echo ""
    echo "=== Testing Attendance Endpoints ==="
    echo ""
    
    # Test 1: Get attendance history for user ID 1 (Admin only)
    echo "Test 1: Get attendance history for user ID 1 (Admin only)"
    curl -X GET $BASE_URL/api/attendance/history/user/1 \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H 'Content-Type: application/json'
    echo -e "\n---\n"
    
    # Test 2: Get monthly attendance report (Admin only)
    echo "Test 2: Get monthly attendance report (Admin only)"
    curl -X GET "$BASE_URL/api/attendance/reports/monthly?year=2023&month=10" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H 'Content-Type: application/json'
    echo -e "\n---\n"
    
    # Test 3: Get all attendance records with pagination (Admin only)
    echo "Test 3: Get all attendance records with pagination (Admin only)"
    curl -X GET "$BASE_URL/api/attendance/records?page=1&limit=10" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H 'Content-Type: application/json'
    echo -e "\n---\n"
    
    # Test 4: Get specific attendance record by ID (Admin only)
    echo "Test 4: Get specific attendance record by ID (Admin only)"
    curl -X GET $BASE_URL/api/attendance/records/1 \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H 'Content-Type: application/json'
    echo -e "\n---\n"
    
    # Test 5: Get attendance records with filters (Admin)
    echo "Test 5: Get attendance records with filters (Admin)"
    curl -X GET "$BASE_URL/api/attendance?userId=1&startDate=2023-01-01&endDate=2023-12-31" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H 'Content-Type: application/json'
    echo -e "\n---\n"
    
    # Test 6: Get attendance records with filters (Staff - limited to own)
    echo "Test 6: Get attendance records with filters (Staff - limited to own)"
    curl -X GET "$BASE_URL/api/attendance?startDate=2023-01-01&endDate=2023-12-31" \
        -H "Authorization: Bearer $STAFF_TOKEN" \
        -H 'Content-Type: application/json'
    echo -e "\n---\n"
    
    # Test 7: Get current user's attendance records (Staff)
    echo "Test 7: Get current user's attendance records (Staff)"
    curl -X GET $BASE_URL/api/attendance/my \
        -H "Authorization: Bearer $STAFF_TOKEN" \
        -H 'Content-Type: application/json'
    echo -e "\n---\n"
    
    # Test 8: Get attendance summary for user ID 1 (Admin)
    echo "Test 8: Get attendance summary for user ID 1 (Admin)"
    curl -X GET "$BASE_URL/api/attendance/summary?userId=1&startDate=2023-01-01&endDate=2023-12-31" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H 'Content-Type: application/json'
    echo -e "\n---\n"
    
    # Test 9: Get current user's attendance summary (Staff)
    echo "Test 9: Get current user's attendance summary (Staff)"
    curl -X GET "$BASE_URL/api/attendance/my/summary?startDate=2023-01-01&endDate=2023-12-31" \
        -H "Authorization: Bearer $STAFF_TOKEN" \
        -H 'Content-Type: application/json'
    echo -e "\n---\n"
    
    # Test 10: Get specific attendance record by ID (Admin)
    echo "Test 10: Get specific attendance record by ID (Admin)"
    curl -X GET $BASE_URL/api/attendance/1 \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H 'Content-Type: application/json'
    echo -e "\n---\n"
    
    # Test 11: Get current user's specific attendance record by ID (Staff)
    echo "Test 11: Get current user's specific attendance record by ID (Staff)"
    curl -X GET $BASE_URL/api/attendance/my/1 \
        -H "Authorization: Bearer $STAFF_TOKEN" \
        -H 'Content-Type: application/json'
    echo -e "\n---\n"
    
    # Test 12: Update attendance record (Admin only)
    echo "Test 12: Update attendance record (Admin only)"
    curl -X PUT $BASE_URL/api/attendance/1 \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H 'Content-Type: application/json' \
        -d '{"status":"present","check_in_time":"09:00:00","check_out_time":"17:00:00","location_verified":true}'
    echo -e "\n---\n"
    
    # Test 13: Create manual attendance record (Admin only)
    echo "Test 13: Create manual attendance record (Admin only)"
    curl -X POST $BASE_URL/api/attendance/manual \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H 'Content-Type: application/json' \
        -d '{"date":"2023-10-15","check_in_time":"09:00:00","check_out_time":"17:00:00","status":"present","location_coordinates":{"latitude":-1.286389,"longitude":36.817223},"location_address":"Nairobi Office","user_id":1}'
    echo -e "\n---\n"
}

# Main execution
echo "Starting HR App attendance API testing..."
echo ""

# Get tokens
get_admin_token
if [ $? -ne 0 ]; then
    echo "Failed to get admin token. Exiting."
    exit 1
fi

get_staff_token
if [ $? -ne 0 ]; then
    echo "Failed to get staff token. Exiting."
    exit 1
fi

echo ""
echo "Both tokens retrieved successfully!"
echo ""

# Test all endpoints
test_attendance_endpoints

echo ""
echo "Testing completed!"