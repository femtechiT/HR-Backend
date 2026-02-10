import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import AttendanceModel from '../models/attendance.model';
import ShiftTimingModel from '../models/shift-timing.model';
import HolidayModel from '../models/holiday.model';
import AttendanceLocationModel from '../models/attendance-location.model';
import BranchModel from '../models/branch.model';
import StaffModel from '../models/staff.model';

const router = Router();

// POST /api/attendance/manual - Manually create attendance record (for admin use)
router.post('/manual', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { date, check_in_time, check_out_time, status, location_coordinates, location_address } = req.body;
    const userId = req.currentUser?.id;
    const requestingUserId = req.body.user_id || userId; // Allow admin to create for other users

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No user information'
      });
    }

    // Validate required fields
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    // Check if user has already marked attendance for this date
    const existingAttendance = await AttendanceModel.findByUserIdAndDate(requestingUserId, new Date(date));
    if (existingAttendance) {
      return res.status(409).json({
        success: false,
        message: 'Attendance already marked for this date'
      });
    }

    // Check if it's a holiday
    const isHoliday = await HolidayModel.isHoliday(new Date(date));
    if (isHoliday) {
      // For holidays, mark attendance as holiday regardless
      const attendanceData = {
        user_id: requestingUserId,
        date: new Date(date),
        status: 'holiday' as const,
        check_in_time: null,
        check_out_time: null,
        location_coordinates: null,
        location_verified: false,
        location_address: null,
        notes: 'Holiday - no attendance required'
      };

      const newAttendance = await AttendanceModel.create(attendanceData);

      return res.status(201).json({
        success: true,
        message: 'Holiday attendance recorded successfully',
        data: { attendance: newAttendance }
      });
    }

    // Check if user has approved leave on this date
    const leaveHistory = await pool.execute(
      `SELECT id, start_date, end_date FROM leave_history WHERE user_id = ? AND ? BETWEEN start_date AND end_date`,
      [requestingUserId, new Date(date)]
    );
    
    if (leaveHistory[0].length > 0) {
      // For approved leave, mark attendance as leave regardless
      const attendanceData = {
        user_id: requestingUserId,
        date: new Date(date),
        status: 'leave' as const,
        check_in_time: null,
        check_out_time: null,
        location_coordinates: null,
        location_verified: false,
        location_address: null,
        notes: 'On approved leave'
      };

      const newAttendance = await AttendanceModel.create(attendanceData);

      return res.status(201).json({
        success: true,
        message: 'Leave attendance recorded successfully',
        data: { attendance: newAttendance }
      });
    }

    // Get user's branch to determine attendance mode
    const staffRecord = await StaffModel.findByUserId(requestingUserId);
    if (!staffRecord) {
      return res.status(404).json({
        success: false,
        message: 'Staff record not found for user'
      });
    }

    const branchId = staffRecord.branch_id;
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'Staff record does not have a branch assigned'
      });
    }

    const branch = await BranchModel.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found for staff'
      });
    }

    let locationVerified = false;
    let attendanceStatus: 'present' | 'absent' | 'late' | 'half_day' | 'leave' | 'holiday' = status || 'absent';

    // Handle location verification based on attendance mode
    if (branch.attendance_mode === 'branch_based' && location_coordinates) {
      // Verify user is at their assigned branch
      if (branch.location_coordinates) {
        const branchCoords = branch.location_coordinates.match(/POINT\(([-+]?\d*\.\d+) ([-+]?\d*\.\d+)\)/);
        if (branchCoords) {
          const branchLng = parseFloat(branchCoords[1]);
          const branchLat = parseFloat(branchCoords[2]);

          const userCoords = location_coordinates.match(/POINT\(([-+]?\d*\.\d+) ([-+]?\d*\.\d+)\)/);
          if (userCoords) {
            const userLng = parseFloat(userCoords[1]);
            const userLat = parseFloat(userCoords[2]);

            // Calculate distance between user and branch (simplified)
            const distance = Math.sqrt(Math.pow(userLng - branchLng, 2) + Math.pow(userLat - branchLat, 2)) * 111000; // Approximate km to meters
            const radius = branch.location_radius_meters || 100;

            if (distance <= radius) {
              locationVerified = true;
            }
          }
        }
      }
    } else if (branch.attendance_mode === 'multiple_locations' && location_coordinates) {
      // Verify user is at one of the approved locations
      const nearbyLocations = await AttendanceLocationModel.getLocationsNearby(
        parseFloat(location_coordinates.latitude),
        parseFloat(location_coordinates.longitude),
        branch.location_radius_meters || 100
      );

      if (nearbyLocations.length > 0) {
        locationVerified = true;
      }
    }

    // Determine status based on check-in time vs shift time if not provided
    if (!status) {
      const shift = await ShiftTimingModel.findCurrentShiftForUser(requestingUserId, new Date(date));
      if (shift && check_in_time) {
        const shiftStartTime = new Date(`1970-01-01T${shift.start_time}`);
        const checkInTime = new Date(`1970-01-01T${check_in_time}`);

        if (checkInTime.getTime() > shiftStartTime.getTime()) {
          attendanceStatus = 'late';
        } else {
          attendanceStatus = 'present';
        }
      } else if (check_in_time) {
        attendanceStatus = 'present';
      }
    }

    // Create attendance record
    const attendanceData = {
      user_id: requestingUserId,
      date: new Date(date),
      status: attendanceStatus,
      check_in_time: check_in_time ? new Date(`1970-01-01T${check_in_time}`) : null,
      check_out_time: check_out_time ? new Date(`1970-01-01T${check_out_time}`) : null,
      location_coordinates: location_coordinates ?
        `POINT(${location_coordinates.longitude} ${location_coordinates.latitude})` : null,
      location_verified: locationVerified,
      location_address: location_address || null,
      notes: null
    };

    const newAttendance = await AttendanceModel.create(attendanceData);

    return res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: { attendance: newAttendance }
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;