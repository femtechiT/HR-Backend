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

type LocationCoordinatesInput =
  | {
      latitude?: number | string;
      longitude?: number | string;
      lat?: number | string;
      lng?: number | string;
      x?: number | string;
      y?: number | string;
    }
  | string
  | null
  | undefined;

const parseLocationCoordinates = (location: LocationCoordinatesInput): { latitude: number; longitude: number } | null => {
  if (!location) {
    return null;
  }

  if (typeof location === 'string') {
    const pointMatch = location.match(/POINT\(([-+]?\d*\.?\d+)\s+([-+]?\d*\.?\d+)\)/i);
    if (!pointMatch) {
      return null;
    }

    const longitude = Number(pointMatch[1]);
    const latitude = Number(pointMatch[2]);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return { latitude, longitude };
    }

    return null;
  }

  const rawLatitude = location.latitude ?? location.lat ?? location.y;
  const rawLongitude = location.longitude ?? location.lng ?? location.x;
  const latitude = Number(rawLatitude);
  const longitude = Number(rawLongitude);

  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return { latitude, longitude };
  }

  return null;
};

const parseSecondaryLocations = (value: unknown): number[] => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item));
  }

  if (typeof value === 'string') {
    try {
      return parseSecondaryLocations(JSON.parse(value));
    } catch (error) {
      console.error('Failed to parse secondary_locations:', error);
      return [];
    }
  }

  if (typeof value === 'object' && value !== null && 'secondary_locations' in value) {
    return parseSecondaryLocations((value as any).secondary_locations);
  }

  return [];
};

const getAssignedLocationIds = (staffRecord: any): number[] => {
  const assignedLocationIds = new Set<number>();

  if (staffRecord?.assigned_location_id) {
    assignedLocationIds.add(Number(staffRecord.assigned_location_id));
  }

  for (const locationId of parseSecondaryLocations(staffRecord?.location_assignments)) {
    assignedLocationIds.add(locationId);
  }

  return [...assignedLocationIds].filter((locationId) => Number.isFinite(locationId));
};

const isOnApprovedLeave = async (userId: number, date: Date): Promise<boolean> => {
  const dateStr = date.toISOString().split('T')[0];

  const [leaveHistory]: any = await pool.execute(
    `SELECT id
     FROM leave_history
     WHERE user_id = ?
       AND ? BETWEEN start_date AND end_date
       AND status = 'approved'
     LIMIT 1`,
    [userId, dateStr]
  );
  if (leaveHistory.length > 0) return true;

  const [leaveRequests]: any = await pool.execute(
    `SELECT id
     FROM leave_requests
     WHERE user_id = ?
       AND ? BETWEEN start_date AND end_date
       AND status = 'approved'
       AND (cancelled_by IS NULL OR cancelled_at IS NULL)
     LIMIT 1`,
    [userId, dateStr]
  );
  return leaveRequests.length > 0;
};

type LocationVerifyResult =
  | { verified: true; method: 'assigned_locations' | 'branch_based' | 'multiple_locations_any'; matched_location_id?: number }
  | { verified: false; reason: 'no_coords' | 'no_assignment' | 'outside_allowed_area' };

const verifyUserLocation = async (args: {
  branch: any;
  staffRecord: any;
  userCoords: { latitude: number; longitude: number } | null;
  strictLocationMode: boolean;
}): Promise<LocationVerifyResult> => {
  const { branch, staffRecord, userCoords, strictLocationMode } = args;

  if (!userCoords) {
    return { verified: false, reason: 'no_coords' };
  }

  const { latitude: userLat, longitude: userLng } = userCoords;

  // For multiple_locations mode OR strict mode, enforce staff assignments.
  // This matches product expectation: staff must be assigned to a location before they can check in.
  if (branch?.attendance_mode === 'multiple_locations' || strictLocationMode) {
    const assignedLocationIds = getAssignedLocationIds(staffRecord);
    if (assignedLocationIds.length === 0) {
      return { verified: false, reason: 'no_assignment' };
    }

    const matches = await AttendanceLocationModel.getAssignedLocationsWithinRadius(
      assignedLocationIds,
      userLat,
      userLng,
      // Don't filter by branch here: assignment is authoritative (supports cross-branch assignments).
      null
    );

    if (matches.length > 0) {
      return {
        verified: true,
        method: 'assigned_locations',
        matched_location_id: matches[0].id
      };
    }

    return { verified: false, reason: 'outside_allowed_area' };
  }

  if (branch?.attendance_mode === 'branch_based') {
    if (!branch.location_coordinates) {
      return { verified: false, reason: 'outside_allowed_area' };
    }

    const branchCoords = String(branch.location_coordinates).match(/POINT\(([-+]?\d*\.?\d*) ([-+]?\d*\.?\d*)\)/i);
    if (!branchCoords) {
      return { verified: false, reason: 'outside_allowed_area' };
    }

    const branchLng = parseFloat(branchCoords[1]);
    const branchLat = parseFloat(branchCoords[2]);
    const latDiff = (userLat - branchLat) * 111320;
    const lngDiff = (userLng - branchLng) * 111320 * Math.cos(branchLat * (Math.PI / 180));
    const distance = Math.sqrt(Math.pow(latDiff, 2) + Math.pow(lngDiff, 2));
    const radius = branch.location_radius_meters || 100;

    if (distance <= radius) {
      return { verified: true, method: 'branch_based' };
    }

    return { verified: false, reason: 'outside_allowed_area' };
  }

  // Flexible (or unknown) mode: no reliable location constraint.
  return { verified: true, method: 'multiple_locations_any' };
};

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

// GET /api/attendance/my-locations - Get current user's assigned attendance locations (staff-facing)
router.get('/my-locations', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.currentUser?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const staffRecord = await StaffModel.findByUserId(userId);
    if (!staffRecord) {
      return res.status(404).json({ success: false, message: 'Staff record not found' });
    }

    const assignedIds = getAssignedLocationIds(staffRecord);
    if (assignedIds.length === 0) {
      return res.json({
        success: true,
        message: 'No attendance locations assigned',
        data: { locations: [], assigned_location_ids: [] }
      });
    }

    const placeholders = assignedIds.map(() => '?').join(', ');
    const [rows] = await pool.execute(
      `
        SELECT
          id,
          name,
          ST_AsText(location_coordinates) AS location_coordinates,
          location_radius_meters,
          branch_id,
          is_active
        FROM attendance_locations
        WHERE is_active = TRUE
          AND id IN (${placeholders})
        ORDER BY name
      `,
      assignedIds
    ) as [any[], any];

    return res.json({
      success: true,
      message: 'Assigned attendance locations retrieved successfully',
      data: { locations: rows, assigned_location_ids: assignedIds }
    });
  } catch (error) {
    console.error('Get my attendance locations error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/attendance/check-in - Mark attendance check-in
router.post('/check-in', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { date, check_in_time, location_coordinates, location_address, status: providedStatus } = req.body;
    const userId = req.currentUser?.id;
    const userCoords = parseLocationCoordinates(location_coordinates);
    const debug = process.env.ATTENDANCE_DEBUG === 'true';

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

    // NEW: Check if it's a working day and handle check-in cutoff
    const requestedDate = new Date(date);
    const effectiveSchedule = await ShiftSchedulingService.getEffectiveScheduleForDate(userId, requestedDate);

    // Block check-in if user is on approved leave for this date
    if (effectiveSchedule?.schedule_type === 'leave' || (await isOnApprovedLeave(userId, requestedDate))) {
      return res.status(403).json({
        success: false,
        message: 'You are on approved leave for this date. Clock-in is not allowed.',
        data: { on_leave: true }
      });
    }
    
    if (!effectiveSchedule || !effectiveSchedule.start_time) {
      // If it's a holiday, let the holiday-specific logic below handle it
      // Otherwise, block check-in on non-working days
      if (effectiveSchedule?.schedule_type !== 'holiday') {
        const leaveCheck = await pool.execute(
          `SELECT id FROM leave_history WHERE user_id = ? AND ? BETWEEN start_date AND end_date AND status = 'approved'`,
          [userId, new Date(date)]
        ) as [any[], any];

        if (leaveCheck[0].length === 0) {
          const scheduleNote = effectiveSchedule?.schedule_note || 'Scheduled Day Off';
          return res.status(403).json({
            success: false,
            message: `Today is a non-working day (${scheduleNote}). You do not have an active shift assigned for this date.`,
            data: { non_working_day: true }
          });
        }
      }
    } else {
      // Check for cutoff (4 hours = 240 minutes)
      const [startHours, startMinutes] = effectiveSchedule.start_time.split(':').map(Number);
      const scheduledStart = new Date(date);
      scheduledStart.setHours(startHours, startMinutes, 0, 0);
      
      const cutoffTime = new Date(scheduledStart.getTime() + (4 * 60 * 60 * 1000));
      const serverTime = new Date();
      
      // If checking in for today, enforce the 4-hour window from scheduled start
      const isToday = new Date(date).toISOString().split('T')[0] === serverTime.toISOString().split('T')[0];
      if (isToday && serverTime > cutoffTime) {
        return res.status(403).json({
          success: false,
          message: `Your scheduled shift started at ${effectiveSchedule.start_time}, and the 4-hour check-in window has now closed. Please contact your supervisor.`,
          data: { cutoff_exceeded: true, scheduled_start: effectiveSchedule.start_time }
        });
      }
    }

    // Check if user has already marked attendance for this date
    let attendanceRecord = await AttendanceModel.findByUserIdAndDate(userId, requestedDate);

    if (attendanceRecord) {
      // If the day is already marked as leave/holiday, do not allow clock-in.
      if (attendanceRecord.status === 'leave' || attendanceRecord.status === 'holiday') {
        return res.status(403).json({
          success: false,
          message:
            attendanceRecord.status === 'leave'
              ? 'Attendance is marked as leave for this date. Clock-in is not allowed.'
              : 'Attendance is marked as holiday for this date. Clock-in is not allowed.',
          data: { status: attendanceRecord.status }
        });
      }

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
      if (userCoords) {
        const nearbyLocations = await AttendanceLocationModel.getLocationsNearby(
          userCoords.latitude, userCoords.longitude, 1000 // Search within 1km
        );

        const assignedLocationIds = getAssignedLocationIds(staffRecord);

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

      const branch = await BranchModel.findById(branchId);
      if (!branch) {
        return res.status(404).json({ success: false, message: 'Branch not found' });
      }

      let settings: any = {
        require_check_in: true,
        require_check_out: true,
        grace_period_minutes: 0,
        // Default enforcement based on branch mode and available coordinates:
        // - multiple_locations: enforce via attendance_locations table
        // - branch_based: enforce only if branch coordinates exist
        // - flexible: default to false
        enable_location_verification:
          branch.attendance_mode === 'multiple_locations'
            ? true
            : branch.attendance_mode === 'branch_based'
              ? !!branch.location_coordinates
              : false,
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

      const strictMode = !!settings.strict_location_mode;
      if (debug) {
        console.log('[Attendance][CheckIn] Verify start', {
          userId,
          date,
          branchId,
          attendance_mode: branch.attendance_mode,
          enable_location_verification: settings.enable_location_verification,
          strict_location_mode: strictMode,
          assigned_location_id: staffRecord.assigned_location_id,
          location_assignments: staffRecord.location_assignments,
          userCoords
        });
      }
      const verifyResult = await verifyUserLocation({ branch, staffRecord, userCoords, strictLocationMode: strictMode });
      locationVerified = verifyResult.verified;
      if (debug) {
        console.log('[Attendance][CheckIn] Verify result', verifyResult);
      }

      // Strict enforcement
      if (settings.enable_location_verification && !locationVerified) {
        let locationRequiredMessage = 'Location verification failed.';
        if (verifyResult.verified === false) {
          if (verifyResult.reason === 'no_coords') {
            locationRequiredMessage =
              'Location permission is required to check in. Please allow location access in your browser or app settings and try again.';
          } else if (verifyResult.reason === 'no_assignment') {
            locationRequiredMessage =
              'No attendance location has been assigned to you yet. Please contact HR to assign your check-in location(s).';
          } else {
            locationRequiredMessage =
              'Location verification failed. You must be within the allowed radius of your assigned location to check in.';
          }
        }

        return res.status(403).json({
          success: false,
          message: locationRequiredMessage,
          data: {
            distance_check_failed: !!userCoords,
            location_permission_required: !userCoords
          }
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
      // User is not on duty or it's a holiday - mark as holiday
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
      const [leaveHistory] = await pool.execute(
        `SELECT id, start_date, end_date, status FROM leave_history WHERE user_id = ? AND ? BETWEEN start_date AND end_date`,
        [userId, requestedDate]
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
        [userId, requestedDate]
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
        enable_location_verification:
          branch.attendance_mode === 'multiple_locations'
            ? true
            : branch.attendance_mode === 'branch_based'
              ? !!branch.location_coordinates
              : false,
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

      // Check if check-in is required for this branch
      if (settings.require_check_in === false) {
        return res.status(400).json({
          success: false,
          message: 'Check-in is not required for this branch'
        });
      }

      const strictMode = !!(settings as any).strict_location_mode;
      if (debug) {
        console.log('[Attendance][CheckIn] (create) Verify start', {
          userId,
          date,
          branchId,
          attendance_mode: branch.attendance_mode,
          enable_location_verification: (settings as any).enable_location_verification,
          strict_location_mode: strictMode,
          assigned_location_id: staffRecord.assigned_location_id,
          location_assignments: staffRecord.location_assignments,
          userCoords
        });
      }
      const verifyResult = await verifyUserLocation({ branch, staffRecord, userCoords, strictLocationMode: strictMode });
      const locationVerified = verifyResult.verified;
      if (debug) {
        console.log('[Attendance][CheckIn] (create) Verify result', verifyResult);
      }

      if ((settings as any).enable_location_verification && !locationVerified) {
        let locationRequiredMessage = 'Location verification failed.';
        if (verifyResult.verified === false) {
          if (verifyResult.reason === 'no_coords') {
            locationRequiredMessage =
              'Location permission is required to check in. Please allow location access in your browser or app settings and try again.';
          } else if (verifyResult.reason === 'no_assignment') {
            locationRequiredMessage =
              'No attendance location has been assigned to you yet. Please contact HR to assign your check-in location(s).';
          } else {
            locationRequiredMessage =
              'Location verification failed. You must be within the allowed radius of your assigned location to check in.';
          }
        }

        return res.status(403).json({
          success: false,
          message: locationRequiredMessage,
          data: {
            distance_check_failed: !!userCoords,
            location_permission_required: !userCoords
          }
        });
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
    const userCoords = parseLocationCoordinates(location_coordinates);
    const debug = process.env.ATTENDANCE_DEBUG === 'true';

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

    const requestedDate = new Date(date);
    // Block check-out if user is on approved leave for this date
    // (prevents a user from "working" on a leave day even if a record exists).
    if (await isOnApprovedLeave(userId, requestedDate)) {
      return res.status(403).json({
        success: false,
        message: 'You are on approved leave for this date. Clock-out is not allowed.',
        data: { on_leave: true }
      });
    }

    // Find existing attendance record for the date
    const attendanceRecord = await AttendanceModel.findByUserIdAndDate(userId, requestedDate);

    if (!attendanceRecord) {
      return res.status(404).json({
        success: false,
        message: 'No attendance record found for this date. Please check in first.'
      });
    }

    // If the day is already marked as leave/holiday, do not allow clock-out.
    if (attendanceRecord.status === 'leave' || attendanceRecord.status === 'holiday') {
      return res.status(403).json({
        success: false,
        message:
          attendanceRecord.status === 'leave'
            ? 'Attendance is marked as leave for this date. Clock-out is not allowed.'
            : 'Attendance is marked as holiday for this date. Clock-out is not allowed.',
        data: { status: attendanceRecord.status }
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
    if (userCoords) {
      const nearbyLocations = await AttendanceLocationModel.getLocationsNearby(
        userCoords.latitude, userCoords.longitude, 1000 // Search within 1km
      );

      const assignedLocationIds = getAssignedLocationIds(staffRecord);

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

    // Get attendance settings for this branch
    let settings: any = {
      require_check_in: true,
      require_check_out: true,
      grace_period_minutes: 0,
      enable_location_verification: null,
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

    // Default enforcement similar to check-in:
    // - multiple_locations: enforce via attendance_locations table
    // - branch_based: enforce only if branch coordinates exist
    // - flexible: default to false
    if (settings.enable_location_verification === undefined || settings.enable_location_verification === null) {
      settings.enable_location_verification =
        branch.attendance_mode === 'multiple_locations'
          ? true
          : branch.attendance_mode === 'branch_based'
            ? !!branch.location_coordinates
            : false;
    }

    // Verify location (and enforce if enabled)
    const strictMode = !!settings.strict_location_mode;
    if (debug) {
      console.log('[Attendance][CheckOut] Verify start', {
        userId,
        date,
        branchId,
        attendance_mode: branch.attendance_mode,
        enable_location_verification: settings.enable_location_verification,
        strict_location_mode: strictMode,
        assigned_location_id: staffRecord.assigned_location_id,
        location_assignments: staffRecord.location_assignments,
        userCoords
      });
    }
    const verifyResult = await verifyUserLocation({ branch, staffRecord, userCoords, strictLocationMode: strictMode });
    const locationVerified = verifyResult.verified;
    if (debug) {
      console.log('[Attendance][CheckOut] Verify result', verifyResult);
    }

    if (settings.enable_location_verification && !locationVerified) {
      let locationRequiredMessage = 'Location verification failed.';
      if (verifyResult.verified === false) {
        if (verifyResult.reason === 'no_coords') {
          locationRequiredMessage =
            'Location permission is required to check out. Please allow location access in your browser or app settings and try again.';
        } else if (verifyResult.reason === 'no_assignment') {
          locationRequiredMessage =
            'No attendance location has been assigned to you yet. Please contact HR to assign your check-in location(s).';
        } else {
          locationRequiredMessage =
            'Location verification failed. You must be within the allowed radius of your assigned location to check out.';
        }
      }

      return res.status(403).json({
        success: false,
        message: locationRequiredMessage,
        data: {
          distance_check_failed: !!userCoords,
          location_permission_required: !userCoords
        }
      });
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
