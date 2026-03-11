# Leave Cancellation Feature - Testing Guide

## Overview

This guide covers testing the enhanced leave cancellation feature that:
- Updates attendance records when leave is cancelled
- Sends email notifications to employees
- Maintains audit trail (who cancelled, when, why)
- Refunds leave days automatically

---

## Migration Setup

### 1. Run Migrations

```bash
cd /home/frobenius/Desktop/Femtech/hrApp
npm run migrate
```

This will execute:
- `087_add_cancellation_fields_to_leave_requests.sql` - Adds cancellation tracking fields
- `088_add_leave_request_cancelled_template.sql` - Adds email notification template

### 2. Verify Migration

```sql
-- Check cancellation fields exist
DESCRIBE leave_requests;

-- Should show:
-- cancelled_by INT NULL
-- cancelled_at DATETIME NULL
-- cancellation_reason TEXT NULL

-- Check email template exists
SELECT * FROM notification_templates WHERE name = 'leave_request_cancelled';
```

---

## API Endpoints

### 1. GET /api/leave/:id/cancellation-eligibility

**Purpose:** Check if a leave request can be cancelled and what the impact will be.

**Request:**
```http
GET /api/leave/123/cancellation-eligibility
Authorization: Bearer <JWT_TOKEN>
```

**Response (Eligible):**
```json
{
  "success": true,
  "message": "Cancellation eligibility retrieved successfully",
  "data": {
    "leave_request": {
      "id": 123,
      "leave_type": "Annual Leave",
      "start_date": "2026-03-15",
      "end_date": "2026-03-20",
      "days_requested": 6,
      "current_status": "approved"
    },
    "eligibility": {
      "can_cancel": true,
      "reasons": [
        "Cancelling approved leave will update attendance records and send notifications"
      ],
      "impact": {
        "days_will_be_refunded": 6,
        "attendance_will_be_updated": true,
        "attendance_records_affected": 6,
        "notification_will_be_sent": true
      }
    }
  }
}
```

**Response (Not Eligible):**
```json
{
  "success": true,
  "data": {
    "eligibility": {
      "can_cancel": false,
      "reasons": [
        "Cannot cancel leave request for dates that have already passed"
      ]
    }
  }
}
```

---

### 2. DELETE /api/leave/:id

**Purpose:** Cancel a leave request with full audit trail and attendance updates.

**Request:**
```http
DELETE /api/leave/123
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "cancellation_reason": "Plans changed, need to work during that period"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Leave request cancelled successfully",
  "data": {
    "leave_request_id": 123,
    "status": "cancelled",
    "days_refunded": 6,
    "attendance_updated": true
  }
}
```

---

## Test Scenarios

### Scenario 1: Cancel Approved Future Leave

**Setup:**
1. Create a leave request for future dates
2. Approve the leave request
3. Ensure attendance records exist for those dates

**Test:**
```bash
# 1. Check eligibility
curl -X GET http://localhost:3000/api/leave/123/cancellation-eligibility \
  -H "Authorization: Bearer <TOKEN>"

# 2. Cancel the leave
curl -X DELETE http://localhost:3000/api/leave/123 \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"cancellation_reason":"Emergency project deadline"}'
```

**Expected Results:**
- ✅ Leave status changed to "cancelled"
- ✅ `cancelled_by` set to current user ID
- ✅ `cancelled_at` set to current timestamp
- ✅ `cancellation_reason` saved
- ✅ Leave days refunded to allocation
- ✅ Attendance records updated from "leave" to "absent" (or "holiday" if weekend)
- ✅ Email notification sent to employee

**Verify:**
```sql
-- Check leave request status
SELECT id, status, cancelled_by, cancelled_at, cancellation_reason
FROM leave_requests WHERE id = 123;

-- Check attendance updated
SELECT date, status, notes
FROM attendance
WHERE user_id = (SELECT user_id FROM leave_requests WHERE id = 123)
  AND date BETWEEN (SELECT start_date FROM leave_requests WHERE id = 123)
                 AND (SELECT end_date FROM leave_requests WHERE id = 123);

-- Check allocation refunded
SELECT allocated_days, used_days, carried_over_days
FROM leave_allocations
WHERE user_id = (SELECT user_id FROM leave_requests WHERE id = 123);
```

---

### Scenario 2: Cancel Pending Leave

**Setup:**
1. Create a leave request
2. Leave it in "submitted" status (don't approve)

**Test:**
```bash
curl -X DELETE http://localhost:3000/api/leave/456 \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"cancellation_reason":"No longer needed"}'
```

**Expected Results:**
- ✅ Leave status changed to "cancelled"
- ✅ No attendance records affected (was never approved)
- ✅ No days refunded (was never deducted)
- ✅ No email notification sent

---

### Scenario 3: Attempt Cancel Past Leave

**Setup:**
1. Find a leave request that already started

**Test:**
```bash
curl -X DELETE http://localhost:3000/api/leave/789 \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"cancellation_reason":"Testing"}'
```

**Expected Results:**
- ❌ Request fails with 400 Bad Request
- ✅ Error message: "Cannot cancel leave request for dates that have already passed"
- ✅ Leave status unchanged

---

### Scenario 4: Attempt Cancel Rejected Leave

**Setup:**
1. Find a leave request with status "rejected"

**Test:**
```bash
curl -X DELETE http://localhost:3000/api/leave/999 \
  -H "Authorization: Bearer <TOKEN>"
```

**Expected Results:**
- ❌ Request fails with 400 Bad Request
- ✅ Error message: "Cannot cancel leave request that is already rejected"

---

### Scenario 5: Cancel Leave Over Holiday

**Setup:**
1. Create approved leave that spans a public holiday
2. Attendance for holiday should be "holiday" status

**Test:**
```bash
curl -X DELETE http://localhost:3000/api/leave/123 \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"cancellation_reason":"Changed plans"}'
```

**Expected Results:**
- ✅ Weekday attendance → "absent"
- ✅ Weekend attendance → "holiday" (if not a working day)
- ✅ Public holiday attendance → "holiday"
- ✅ Notes updated with cancellation info

**Verify:**
```sql
SELECT a.date, a.status, a.notes, h.holiday_name
FROM attendance a
LEFT JOIN holidays h ON a.date = h.date
WHERE a.user_id = <USER_ID>
  AND a.date BETWEEN '2026-03-15' AND '2026-03-20'
ORDER BY a.date;
```

---

## Postman Collection

Import this into Postman for easy testing:

```json
{
  "info": {
    "name": "Leave Cancellation Tests"
  },
  "item": [
    {
      "name": "Check Cancellation Eligibility",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/leave/:id/cancellation-eligibility",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ]
      }
    },
    {
      "name": "Cancel Leave Request",
      "request": {
        "method": "DELETE",
        "url": "{{baseUrl}}/api/leave/:id",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"cancellation_reason\": \"Emergency project deadline - need to work\"\n}"
        }
      }
    }
  ]
}
```

---

## Error Handling

### Common Errors

| Status Code | Error | Cause |
|-------------|-------|-------|
| 400 | "Invalid leave request ID" | Non-numeric ID provided |
| 404 | "Leave request not found" | ID doesn't exist |
| 400 | "Cannot cancel leave request that is already rejected" | Status is "rejected" |
| 400 | "Cannot cancel leave request for dates that have already passed" | Start date is in the past |
| 403 | "You do not have permission to view this leave request" | Not owner and not admin |
| 500 | "Internal server error" | Database error, check logs |

---

## Audit Trail

All cancellations are tracked in the database:

```sql
SELECT
  lr.id,
  u.full_name as employee,
  lt.name as leave_type,
  lr.start_date,
  lr.end_date,
  lr.days_requested,
  lr.status,
  cb.full_name as cancelled_by,
  lr.cancelled_at,
  lr.cancellation_reason
FROM leave_requests lr
JOIN users u ON lr.user_id = u.id
JOIN leave_types lt ON lr.leave_type_id = lt.id
LEFT JOIN users cb ON lr.cancelled_by = cb.id
WHERE lr.status = 'cancelled'
ORDER BY lr.cancelled_at DESC;
```

---

## Integration Points

### 1. Leave Allocation
- Days automatically refunded on cancellation
- Uses `updateUsedDays()` with negative value

### 2. Attendance
- Records updated from "leave" to appropriate status
- Considers: holidays, weekends, shift schedules
- Notes field updated with cancellation timestamp

### 3. Notifications
- Email sent to employee via notification service
- Uses `leave_request_cancelled` template
- Includes: dates, leave type, reason

### 4. Audit Logging
- `cancelled_by` - Who cancelled (user ID)
- `cancelled_at` - When cancelled (timestamp)
- `cancellation_reason` - Why cancelled (text)

---

## Troubleshooting

### Issue: Attendance not updating

**Check:**
1. Was the leave actually approved? (only approved leave creates attendance)
2. Do attendance records exist for the date range?
3. Check server logs for errors

**Debug:**
```sql
SELECT * FROM attendance
WHERE user_id = <USER_ID>
  AND date BETWEEN '<START_DATE>' AND '<END_DATE>';
```

### Issue: Days not refunded

**Check:**
1. Does user have an active allocation?
2. Is the allocation cycle still active?

**Debug:**
```sql
SELECT la.*, lt.name as leave_type_name
FROM leave_allocations la
JOIN leave_types lt ON la.leave_type_id = lt.id
WHERE la.user_id = <USER_ID>
  AND la.cycle_end_date >= NOW();
```

### Issue: Notification not sent

**Check:**
1. Is `leave_request_cancelled` template enabled?
2. Does user have a valid email address?
3. Check notification queue:

```sql
SELECT * FROM notification_queue
WHERE recipient_user_id = <USER_ID>
  AND notification_type = 'leave_request_cancelled'
ORDER BY created_at DESC;
```

---

## Next Steps

After testing:
1. ✅ Verify all test scenarios pass
2. ✅ Check audit trail is complete
3. ✅ Confirm email notifications work
4. ✅ Test with frontend integration
5. ✅ Deploy to staging
6. ✅ Run regression tests on leave module

---

**Created:** 2026-03-11
**Last Updated:** 2026-03-11
