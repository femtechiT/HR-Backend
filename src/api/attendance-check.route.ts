import { Router, Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import AttendanceModel, { AttendanceUpdate, locationToWKT } from '../models/attendance.model';
import ShiftTimingModel from '../models/shift-timing.model';
import { ShiftSchedulingService } from '../services/shift-scheduling.service';
import HolidayModel from '../models/holiday.model';
import BranchModel from '../models/branch.model';
import StaffModel from '../models/staff.model';
import AttendanceLocationModel from '../models/attendance-location.model';
import { pool } from '../config/database';

const router = Router();

/**
 * Simplified Location Verification Logic
 * 
 * All locations are now in attendance_locations table.
 * Staff are assigned to a primary location (assigned_location_id) 
 * with optional secondary locations (staff_secondary_locations).
 * 
 * Check-in process:
 * 1. Get staff's assigned location(s)
 * 2. Check if user's GPS is within ANY of their assigned locations
 * 3. Verify with configured radius
 * 4. Allow/deny check-in
 */

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
      // CHECK 1: If attendance is locked, reject check-in
      if (attendanceRecord.is_locked) {
        return res.status(403).json({
          success: false,
          message: 'Attendance for this date has been locked by your branch. You cannot check in after the auto-mark time has passed.',
          data: { locked: true, locked_at: attendanceRecord.locked_at }
        });
      }

      // If attendance exists, check if check-in time is already recorded
      if (attendanceRecord.check_in_time) {
        return res.status(409).json({
          success: false,
          message: 'You have already checked in today. Multiple check-ins are not allowed.'
        });
      }

      // Verify location if provided
      let locationVerified = false;

      // Get user's staff record
      const staffRecord = await StaffModel.findByUserId(userId);
      if (!staffRecord) {
        return res.status(404).json({ success: false, message: 'Staff record not found' });
      }

      // Default to staff's primary branch
      let branchId = staffRecord.branch_id;
      if (!branchId) {
        return res.status(400).json({ success: false, message: 'No branch assigned' });
      }

      // NEW: If staff has location assignments and provided GPS, determine branch from location
      if (location_coordinates && typeof location_coordinates === 'object') {
        const userLng = parseFloat(location_coordinates.longitude);
        const userLat = parseFloat(location_coordinates.latitude);

        if (!isNaN(userLng) && !isNaN(userLat)) {
          // Find which attendance location the user is at
          const nearbyLocations = await AttendanceLocationModel.getLocationsNearby(
            userLat, userLng, 1000 // Search within 1km
          );

          // Get staff's assigned location IDs
          const assignedLocationIds: number[] = [];

          if (staffRecord.assigned_location_id) {
            assignedLocationIds.push(staffRecord.assigned_location_id);
          }

          if (staffRecord.location_assignments && staffRecord.location_assignments.secondary_locations) {
            try {
              const secondary = JSON.parse(staffRecord.location_assignments.secondary_locations);
              if (Array.isArray(secondary)) {
                assignedLocationIds = [...assignedLocationIds, ...secondary];
              }
            } catch (e) {
              console.error('Failed to parse secondary_locations:', e);
            }
          }

          // If user is at one of their assigned locations, use that location's branch
          if (assignedLocationIds.length > 0 && nearbyLocations.length > 0) {
            const atAssignedLocation = nearbyLocations.some(loc =>
              assignedLocationIds.includes(loc.id) && loc.branch_id
            );

            if (atAssignedLocation) {
              const locationBranch = nearbyLocations.find(loc => loc.branch_id)?.branch_id;
              if (locationBranch) {
                branchId = locationBranch;
                console.log(`✅ Using location's branch ${branchId} for attendance verification`);
              }
            }
          }
        }
      }

      const branch = await BranchModel.findById(branchId);
      if (!branch) {
        return res.status(404).json({ success: false, message: 'Branch not found' });
      }

      let settings: any = {
        require_check_in: true,
        require_check_out: true,
        grace_period_minutes: 0,
        enable_location_verification: false,
        strict_location_mode: false // NEW: strict vs legacy mode
      };

      try {
        const [branchSettings] = await pool.execute(
          `SELECT * FROM attendance_settings WHERE branch_id = ?`,
          [branchId]
        ) as [any[], any];
        if (branchSettings && branchSettings.length > 0) {
          settings = { ...settings, ...branchSettings[0] };
        }
      } catch (error) {
        console.log('Using default attendance settings');
      }

      if (location_coordinates && typeof location_coordinates === 'object') {
        const userLng = parseFloat(location_coordinates.longitude);
        const userLat = parseFloat(location_coordinates.latitude);

        if (!isNaN(userLng) && !isNaN(userLat)) {
          // NEW: Check if strict mode is enabled AND staff has assigned location(s)
          const hasAssignedLocation = staffRecord.assigned_location_id || staffRecord.location_assignments;
          
          // Only enforce assigned locations if:
          // 1. Strict mode is enabled in settings
          // 2. Staff has assigned location(s)
          if (settings.strict_location_mode && hasAssignedLocation) {
            // Staff has assigned location(s) - STRICT MODE
            let assignedLocationIds: number[] = [];
            
            // Get primary location
            if (staffRecord.assigned_location_id) {
              assignedLocationIds.push(staffRecord.assigned_location_id);
            }
            
            // Get secondary locations from JSON
            if (staffRecord.location_assignments && staffRecord.location_assignments.secondary_locations) {
              const secondary = JSON.parse(staffRecord.location_assignments.secondary_locations);
              if (Array.isArray(secondary)) {
                assignedLocationIds = [...assignedLocationIds, ...secondary];
              }
            }
            
            console.log('📍 Staff assigned locations:', assignedLocationIds);
            
            // Check if user is within ANY of their assigned locations
            const nearbyLocations = await AttendanceLocationModel.getLocationsNearby(
              userLat, userLng, 1000 // Search within 1km
            );
            
            const isWithinAssignedLocation = nearbyLocations.some(loc => 
              assignedLocationIds.includes(loc.id)
            );
            
            if (isWithinAssignedLocation) {
              locationVerified = true;
              console.log('✅ Staff checked in at assigned location');
            } else {
              locationVerified = false;
              console.log('❌ Staff NOT at assigned location');
            }
          } else {
            // NO assigned location - use branch-based logic (legacy mode)
            // Handle location verification based on attendance mode
            if (branch.attendance_mode === 'branch_based') {
              if (branch.location_coordinates) {
                const branchCoords = branch.location_coordinates.match(/POINT\(([-+]?\d*\.?\d*) ([-+]?\d*\.?\d*)\)/i);
                if (branchCoords) {
                  const branchLng = parseFloat(branchCoords[1]);
                  const branchLat = parseFloat(branchCoords[2]);
                  const latDiff = (userLat - branchLat) * 111320;
                  const lngDiff = (userLng - branchLng) * 111320 * Math.cos(branchLat * (Math.PI / 180));
                  const distance = Math.sqrt(Math.pow(latDiff, 2) + Math.pow(lngDiff, 2));
                  const radius = branch.location_radius_meters || 100;
                  if (distance <= radius) locationVerified = true;
                }
              }
            } else if (branch.attendance_mode === 'multiple_locations') {
              const nearbyLocations = await AttendanceLocationModel.getLocationsNearby(
                userLat, userLng, branch.location_radius_meters || 100
              );
              if (nearbyLocations.length > 0) locationVerified = true;
            }
          }
        }
      }

      // Strict enforcement
      if (settings.enable_location_verification && !locationVerified) {
        return res.status(403).json({
          success: false,
          message: 'Location verification failed. You must be within the allowed radius of the branch to check in.',
          data: { distance_check_failed: true }
        });
      }

      const updateData: Partial<AttendanceUpdate> = {
        check_in_time: new Date(`1970-01-01T${check_in_time}`),
        location_coordinates: locationToWKT(location_coordinates),
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
        // Check if user is on holiday duty roster
        const [dutyRoster] = await pool.execute(
          `SELECT * FROM holiday_duty_roster WHERE holiday_id = (SELECT id FROM holidays WHERE date = ? LIMIT 1) AND user_id = ?`,
          [new Date(date), userId]
        ) as [any[], any];

        if (dutyRoster.length > 0) {
          // User is on holiday duty - mark as holiday-working
          const roster = dutyRoster[0];
          const attendanceData = {
            user_id: userId,
            date: new Date(date),
            status: 'holiday-working' as any,
            check_in_time: null,
            check_out_time: null,
            location_coordinates: null,
            location_verified: false,
            location_address: null,
            notes: `Holiday duty: ${roster.shift_start_time} - ${roster.shift_end_time}`
          };

          const newAttendance = await AttendanceModel.create(attendanceData);

          return res.status(201).json({
            success: true,
            message: 'Holiday duty attendance recorded successfully',
            data: { attendance: newAttendance }
          });
        } else {
          // User is not on duty - mark as holiday
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
      }

      // Check if user has approved leave on this date
      const [leaveHistory] = await pool.execute(
        `SELECT id, start_date, end_date, status FROM leave_history WHERE user_id = ? AND ? BETWEEN start_date AND end_date`,
        [userId, new Date(date)]
      ) as [any[], any];

      // Filter for approved leaves only (exclude pending/rejected/cancelled)
      const approvedLeaves = leaveHistory.filter((l: any) => l.status === 'approved');

      if (approvedLeaves.length > 0) {
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

      // Also check leave_requests table for approved but not cancelled leave
      const [leaveRequests] = await pool.execute(
        `SELECT id, start_date, end_date, status, cancelled_by, cancelled_at FROM leave_requests
         WHERE user_id = ?
           AND ? BETWEEN start_date AND end_date
           AND status = 'approved'
           AND (cancelled_by IS NULL OR cancelled_at IS NULL)`,
        [userId, new Date(date)]
      ) as [any[], any];

      if (leaveRequests.length > 0) {
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

      // CHECK 2: Check if branch attendance is locked for today
      const branch = await BranchModel.findById(branchId);
      if (!branch) {
        return res.status(404).json({
          success: false,
          message: 'Branch not found for staff'
        });
      }

      // Check if today's attendance is locked for this branch
      if (branch.attendance_lock_date) {
        const today = new Date().toISOString().split('T')[0];
        const lockDate = new Date(branch.attendance_lock_date).toISOString().split('T')[0];
        
        if (lockDate >= today) {
          return res.status(403).json({
            success: false,
            message: 'Attendance for today has been locked by your branch. You cannot check in after the auto-mark time has passed.',
            data: { locked: true, lock_date: branch.attendance_lock_date }
          });
        }
      }

      // Get attendance settings for this branch
      let settings = {
        require_check_in: true,
        require_check_out: true,
        grace_period_minutes: 0,
        enable_location_verification: false
      };

      try {
        const [branchSettings] = await pool.execute(
          `SELECT * FROM attendance_settings WHERE branch_id = ?`,
          [branchId]
        ) as [any[], any];

        if (branchSettings && branchSettings.length > 0) {
          settings = { ...settings, ...branchSettings[0] };
        }
      } catch (error) {
        // Table may not exist yet, use defaults
        console.log('Using default attendance settings (table may not exist)');
      }

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

      // Create attendance record with check-in time
      // Status will be updated by ShiftSchedulingService based on actual schedule
      const attendanceData = {
        user_id: userId,
        date: new Date(date),
        status: 'present' as const, // Default to present, will be updated by ShiftSchedulingService
        check_in_time: new Date(`1970-01-01T${check_in_time}`),
        check_out_time: null, // Check-out will be added later
        location_coordinates: locationToWKT(location_coordinates),
        location_verified: locationVerified,
        location_address: location_address || null,
        notes: null
      };

      const newAttendance = await AttendanceModel.create(attendanceData);

      // Update attendance with shift schedule information (determines if late, working hours, etc.)
      // Pass grace period from branch settings
      try {
        await ShiftSchedulingService.updateAttendanceWithScheduleInfo(
          newAttendance.id,
          userId,
          new Date(date),
          settings.grace_period_minutes || 0
        );
      } catch (shiftError) {
        console.error('Failed to update attendance with shift info:', shiftError);
        // Don't fail the check-in if shift update fails
      }

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

    // CHECK: If attendance is locked, reject check-out
    if (attendanceRecord.is_locked) {
      return res.status(403).json({
        success: false,
        message: 'Attendance for this date has been locked by your branch. You cannot check out after the auto-mark time has passed.',
        data: { locked: true, locked_at: attendanceRecord.locked_at }
      });
    }

    // Check if check-out time is already recorded
    if (attendanceRecord.check_out_time) {
      return res.status(409).json({
        success: false,
        message: 'You have already checked out today. Multiple check-outs are not allowed.'
      });
    }

    // Get user's staff record
    const staffRecord = await StaffModel.findByUserId(userId);
    if (!staffRecord) {
      return res.status(404).json({
        success: false,
        message: 'Staff record not found for user'
      });
    }

    // Default to staff's primary branch
    let branchId = staffRecord.branch_id;
    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'Staff record does not have a branch assigned'
      });
    }

    // NEW: If staff has location assignments and provided GPS, determine branch from location
    if (location_coordinates && typeof location_coordinates === 'object') {
      const userLng = parseFloat(location_coordinates.longitude);
      const userLat = parseFloat(location_coordinates.latitude);

      if (!isNaN(userLng) && !isNaN(userLat)) {
        // Find which attendance location the user is at
        const nearbyLocations = await AttendanceLocationModel.getLocationsNearby(
          userLat, userLng, 1000 // Search within 1km
        );

        // Get staff's assigned location IDs
        const assignedLocationIds: number[] = [];

        if (staffRecord.assigned_location_id) {
          assignedLocationIds.push(staffRecord.assigned_location_id);
        }

        if (staffRecord.location_assignments && staffRecord.location_assignments.secondary_locations) {
          try {
            const secondary = JSON.parse(staffRecord.location_assignments.secondary_locations);
            if (Array.isArray(secondary)) {
              assignedLocationIds = [...assignedLocationIds, ...secondary];
            }
          } catch (e) {
            console.error('Failed to parse secondary_locations:', e);
          }
        }

        // If user is at one of their assigned locations, use that location's branch
        if (assignedLocationIds.length > 0 && nearbyLocations.length > 0) {
          const atAssignedLocation = nearbyLocations.some(loc =>
            assignedLocationIds.includes(loc.id) && loc.branch_id
          );

          if (atAssignedLocation) {
            const locationBranch = nearbyLocations.find(loc => loc.branch_id)?.branch_id;
            if (locationBranch) {
              branchId = locationBranch;
              console.log(`✅ Using location's branch ${branchId} for check-out verification`);
            }
          }
        }
      }
    }

    // Get attendance settings for this branch
    let settings: any = {
      require_check_in: true,
      require_check_out: true,
      grace_period_minutes: 0,
      enable_location_verification: false,
      strict_location_mode: false
    };

    try {
      const [branchSettings] = await pool.execute(
        `SELECT * FROM attendance_settings WHERE branch_id = ?`,
        [branchId]
      ) as [any[], any];

      if (branchSettings && branchSettings.length > 0) {
        settings = { ...settings, ...branchSettings[0] };
      }
    } catch (error) {
      // Table may not exist yet, use defaults
      console.log('Using default attendance settings (table may not exist)');
    }

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
    if (location_coordinates && typeof location_coordinates === 'object') {
      const userLng = parseFloat(location_coordinates.longitude);
      const userLat = parseFloat(location_coordinates.latitude);

      if (!isNaN(userLng) && !isNaN(userLat)) {
        // NEW: Check if strict mode is enabled AND staff has assigned location(s)
        const hasAssignedLocation = staffRecord.assigned_location_id || staffRecord.location_assignments;
        
        // Only enforce assigned locations if:
        // 1. Strict mode is enabled in settings
        // 2. Staff has assigned location(s)
        if (settings.strict_location_mode && hasAssignedLocation) {
          // Staff has assigned location(s) - STRICT MODE
          let assignedLocationIds: number[] = [];
          
          // Get primary location
          if (staffRecord.assigned_location_id) {
            assignedLocationIds.push(staffRecord.assigned_location_id);
          }
          
          // Get secondary locations from JSON
          if (staffRecord.location_assignments && staffRecord.location_assignments.secondary_locations) {
            const secondary = JSON.parse(staffRecord.location_assignments.secondary_locations);
            if (Array.isArray(secondary)) {
              assignedLocationIds = [...assignedLocationIds, ...secondary];
            }
          }
          
          // Check if user is within ANY of their assigned locations
          const nearbyLocations = await AttendanceLocationModel.getLocationsNearby(
            userLat, userLng, 1000 // Search within 1km
          );
          
          const isWithinAssignedLocation = nearbyLocations.some(loc => 
            assignedLocationIds.includes(loc.id)
          );
          
          if (isWithinAssignedLocation) {
            locationVerified = true;
            console.log('✅ Staff checked out at assigned location');
          } else {
            locationVerified = false;
            console.log('❌ Staff NOT at assigned location for check-out');
          }
        } else {
          // NO assigned location - use branch-based logic (legacy mode)
          // Handle location verification based on attendance mode
          if (branch.attendance_mode === 'branch_based') {
            // Verify user is at their assigned branch
            if (branch.location_coordinates) {
              const branchCoords = branch.location_coordinates.match(/POINT\(([-+]?\d*\.?\d*) ([-+]?\d*\.?\d*)\)/i);
              if (branchCoords) {
                const branchLng = parseFloat(branchCoords[1]);
                const branchLat = parseFloat(branchCoords[2]);

                // Calculate distance between user and branch (simplified but consistent)
                const latDiff = (userLat - branchLat) * 111320;
                const lngDiff = (userLng - branchLng) * 111320 * Math.cos(branchLat * (Math.PI / 180));
                const distance = Math.sqrt(Math.pow(latDiff, 2) + Math.pow(lngDiff, 2));

                const radius = branch.location_radius_meters || 100;

                if (distance <= radius) {
                  locationVerified = true;
                }
              }
            }
          } else if (branch.attendance_mode === 'multiple_locations') {
            // Verify user is at one of the approved locations
            const nearbyLocations = await AttendanceLocationModel.getLocationsNearby(
              userLat,
              userLng,
              branch.location_radius_meters || 100
            );

            if (nearbyLocations.length > 0) {
              locationVerified = true;
            }
          }
        }
      }

      // Strict enforcement: if location verification is required and failed, reject the check-out
      if (settings.enable_location_verification && !locationVerified) {
        return res.status(403).json({
          success: false,
          message: 'Location verification failed. You must be within the allowed radius of the branch to check out.',
          data: { distance_check_failed: true }
        });
      }
    }

    // Update the attendance record with check-out time
    const updateData = {
      check_out_time: new Date(`1970-01-01T${check_out_time}`),
      location_coordinates: locationToWKT(location_coordinates),
      location_verified: locationVerified,
      location_address: location_address || null
    };

    const updatedAttendance = await AttendanceModel.update(attendanceRecord.id, updateData);

    // Update attendance with shift schedule information (recalculates working hours)
    // Pass grace period from branch settings
    try {
      await ShiftSchedulingService.updateAttendanceWithScheduleInfo(
        attendanceRecord.id,
        userId,
        new Date(date),
        settings.grace_period_minutes || 0
      );
    } catch (shiftError) {
      console.error('Failed to update attendance with shift info:', shiftError);
      // Don't fail the check-out if shift update fails
    }

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