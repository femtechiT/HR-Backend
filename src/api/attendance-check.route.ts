import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import AttendanceModel, { AttendanceUpdate } from '../models/attendance.model';
import ShiftTimingModel from '../models/shift-timing.model';
import HolidayModel from '../models/holiday.model';
import BranchModel from '../models/branch.model';
import StaffModel from '../models/staff.model';
import AttendanceLocationModel from '../models/attendance-location.model';
import { pool } from '../config/database';

const router = Router();

// POST /api/attendance/check-in - Mark attendance check-in
router.post('/check-in', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { date, check_in_time, location_coordinates, location_address, status: providedStatus } = req.body;
    const userId = req.currentUser?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No user information'
      });
    }

    // Validate required fields
    if (!date || !check_in_time) {
      return res.status(400).json({
        success: false,
        message: 'Date and check_in_time are required'
      });
    }

    // Check if user has already marked attendance for this date
    let attendanceRecord = await AttendanceModel.findByUserIdAndDate(userId, new Date(date));

    if (attendanceRecord) {
      // If attendance exists, update only the check-in time if it's not already set
      if (attendanceRecord.check_in_time) {
        return res.status(409).json({
          success: false,
          message: 'Check-in time already recorded for this date'
        });
      }

      // Verify location if provided
      let locationVerified = false;
      if (location_coordinates) {
        // Get user's branch to determine attendance mode
        const staffRecord = await StaffModel.findByUserId(userId);
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

        // Handle location verification based on attendance mode
        if (branch.attendance_mode === 'branch_based' && location_coordinates) {
          // Verify user is at their assigned branch
          if (branch.location_coordinates) {
            const branchCoords = branch.location_coordinates.match(/POINT\(([-+]?\d*\.\d+) ([-+]?\d*\.\d+)\)/);
            if (branchCoords) {
              const branchLng = parseFloat(branchCoords[1]);
              const branchLat = parseFloat(branchCoords[2]);

              const userLng = parseFloat(location_coordinates.longitude);
              const userLat = parseFloat(location_coordinates.latitude);

              // Calculate distance between user and branch (simplified)
              const distance = Math.sqrt(Math.pow(userLng - branchLng, 2) + Math.pow(userLat - branchLat, 2)) * 111000; // Approximate km to meters
              const radius = branch.location_radius_meters || 100;

              if (distance <= radius) {
                locationVerified = true;
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
      }

      const updateData: Partial<AttendanceUpdate> = {
        check_in_time: new Date(`1970-01-01T${check_in_time}`),
        location_coordinates: location_coordinates ?
          `POINT(${location_coordinates.longitude} ${location_coordinates.latitude})` : null,
        location_verified: locationVerified,
        location_address: location_address || null
      };

      if (providedStatus) {
        updateData.status = providedStatus;
      }

      const updatedAttendance = await AttendanceModel.update(attendanceRecord.id, updateData);

      return res.status(200).json({
        success: true,
        message: 'Check-in time recorded successfully',
        data: { attendance: updatedAttendance }
      });
    } else {
      // Check if it's a holiday
      const isHoliday = await HolidayModel.isHoliday(new Date(date));
      if (isHoliday) {
        // Mark as holiday attendance
        const attendanceData = {
          user_id: userId,
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
        [userId, new Date(date)]
      );
      
      if (leaveHistory[0].length > 0) {
        // Mark as on leave attendance
        const attendanceData = {
          user_id: userId,
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
      const staffRecord = await StaffModel.findByUserId(userId);
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

      // Get attendance settings for this branch
      const [branchSettings] = await pool.execute(
        `SELECT * FROM attendance_settings WHERE branch_id = ?`,
        [branchId]
      ) as [any[], any];
      
      const settings = branchSettings[0] || {
        require_check_in: true,
        require_check_out: true,
        grace_period_minutes: 0
      };

      // Check if check-in is required for this branch
      if (settings.require_check_in === false) {
        return res.status(400).json({
          success: false,
          message: 'Check-in is not required for this branch'
        });
      }

      let locationVerified = false;
      let status: 'present' | 'absent' | 'late' | 'half_day' | 'leave' | 'holiday' = 'absent';

      // Handle location verification based on attendance mode
      if (location_coordinates) {
        if (branch.attendance_mode === 'branch_based' && location_coordinates) {
          // Verify user is at their assigned branch
          if (branch.location_coordinates) {
            const branchCoords = branch.location_coordinates.match(/POINT\(([-+]?\d*\.\d+) ([-+]?\d*\.\d+)\)/);
            if (branchCoords) {
              const branchLng = parseFloat(branchCoords[1]);
              const branchLat = parseFloat(branchCoords[2]);

              const userLng = parseFloat(location_coordinates.longitude);
              const userLat = parseFloat(location_coordinates.latitude);

              // Calculate distance between user and branch (simplified)
              const distance = Math.sqrt(Math.pow(userLng - branchLng, 2) + Math.pow(userLat - branchLat, 2)) * 111000; // Approximate km to meters
              const radius = branch.location_radius_meters || 100;

              if (distance <= radius) {
                locationVerified = true;
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
      }

      // Determine status based on check-in time vs shift time
      const shift = await ShiftTimingModel.findCurrentShiftForUser(userId, new Date(date));
      if (shift) {
        const shiftStartTime = new Date(`1970-01-01T${shift.start_time}`);
        const checkInTime = new Date(`1970-01-01T${check_in_time}`);

        // Apply grace period if configured
        const gracePeriodMs = (settings.grace_period_minutes || 0) * 60 * 1000;
        const adjustedShiftStartTime = new Date(shiftStartTime.getTime() + gracePeriodMs);

        if (checkInTime.getTime() > adjustedShiftStartTime.getTime()) {
          status = 'late';
        } else {
          status = 'present';
        }
      } else {
        // If no specific shift is defined, use branch default or provided status
        status = providedStatus || 'present';
      }

      // Create attendance record with check-in time
      const attendanceData = {
        user_id: userId,
        date: new Date(date),
        status,
        check_in_time: new Date(`1970-01-01T${check_in_time}`),
        check_out_time: null, // Check-out will be added later
        location_coordinates: location_coordinates ?
          `POINT(${location_coordinates.longitude} ${location_coordinates.latitude})` : null,
        location_verified: locationVerified,
        location_address: location_address || null,
        notes: null
      };

      const newAttendance = await AttendanceModel.create(attendanceData);

      return res.status(201).json({
        success: true,
        message: 'Check-in recorded successfully',
        data: { attendance: newAttendance }
      });
    }
  } catch (error) {
    console.error('Check-in error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/attendance/check-out - Mark attendance check-out
router.post('/check-out', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { date, check_out_time, location_coordinates, location_address } = req.body;
    const userId = req.currentUser?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No user information'
      });
    }

    // Validate required fields
    if (!date || !check_out_time) {
      return res.status(400).json({
        success: false,
        message: 'Date and check_out_time are required'
      });
    }

    // Find existing attendance record for the date
    const attendanceRecord = await AttendanceModel.findByUserIdAndDate(userId, new Date(date));

    if (!attendanceRecord) {
      return res.status(404).json({
        success: false,
        message: 'No attendance record found for this date. Please check in first.'
      });
    }

    // Check if check-out time is already recorded
    if (attendanceRecord.check_out_time) {
      return res.status(409).json({
        success: false,
        message: 'Check-out time already recorded for this date'
      });
    }

    // Get user's branch to determine attendance mode
    const staffRecord = await StaffModel.findByUserId(userId);
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

    // Get attendance settings for this branch
    const [branchSettings] = await pool.execute(
      `SELECT * FROM attendance_settings WHERE branch_id = ?`,
      [branchId]
    ) as [any[], any];
    
    const settings = branchSettings[0] || {
      require_check_in: true,
      require_check_out: true,
      grace_period_minutes: 0
    };

    // Check if check-out is required for this branch
    if (settings.require_check_out === false) {
      return res.status(400).json({
        success: false,
        message: 'Check-out is not required for this branch'
      });
    }

    const branch = await BranchModel.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found for staff'
      });
    }

    // Verify location if provided
    let locationVerified = attendanceRecord.location_verified; // Keep the original verification status
    if (location_coordinates) {
      // Handle location verification based on attendance mode
      if (branch.attendance_mode === 'branch_based' && location_coordinates) {
        // Verify user is at their assigned branch
        if (branch.location_coordinates) {
          const branchCoords = branch.location_coordinates.match(/POINT\(([-+]?\d*\.\d+) ([-+]?\d*\.\d+)\)/);
          if (branchCoords) {
            const branchLng = parseFloat(branchCoords[1]);
            const branchLat = parseFloat(branchCoords[2]);

            const userLng = parseFloat(location_coordinates.longitude);
            const userLat = parseFloat(location_coordinates.latitude);

            // Calculate distance between user and branch (simplified)
            const distance = Math.sqrt(Math.pow(userLng - branchLng, 2) + Math.pow(userLat - branchLat, 2)) * 111000; // Approximate km to meters
            const radius = branch.location_radius_meters || 100;

            if (distance <= radius) {
              locationVerified = true;
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
    }

    // Update the attendance record with check-out time
    const updateData = {
      check_out_time: new Date(`1970-01-01T${check_out_time}`),
      location_coordinates: location_coordinates ?
        `POINT(${location_coordinates.longitude} ${location_coordinates.latitude})` : null,
      location_verified: locationVerified,
      location_address: location_address || null
    };

    const updatedAttendance = await AttendanceModel.update(attendanceRecord.id, updateData);

    return res.status(200).json({
      success: true,
      message: 'Check-out time recorded successfully',
      data: { attendance: updatedAttendance }
    });
  } catch (error) {
    console.error('Check-out error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;