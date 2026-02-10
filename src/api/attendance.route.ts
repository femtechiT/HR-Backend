import { Router, Request, Response } from 'express';
import { authenticateJWT, checkPermission } from '../middleware/auth.middleware';
import AttendanceModel from '../models/attendance.model';
import ShiftTimingModel from '../models/shift-timing.model';
import HolidayModel from '../models/holiday.model';
import AttendanceLocationModel from '../models/attendance-location.model';
import BranchModel from '../models/branch.model';
import StaffModel from '../models/staff.model';
import LeaveHistoryModel from '../models/leave-history.model';
import attendanceProcessRoutes from './attendance-process.route';
import attendanceSettingsRoutes from './attendance-settings.route';
import { pool } from '../config/database';

const router = Router();

// GET /api/attendance/history/user/:userId - Get attendance history for a specific user
router.get('/history/user/:userId', authenticateJWT, checkPermission('attendance:read'), async (req: Request, res: Response) => {
  try {
    const userIdParam = req.params.userId;
    const userIdStr = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;
    const userId = parseInt(userIdStr as string);
    const currentUserId = req.currentUser?.id;
    const currentUserRole = req.currentUser?.role_id;

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    // Check if user can access this user's attendance
    if (currentUserId !== userId && currentUserRole !== 1 && currentUserRole !== 3) { // Not the same user and not admin/HR
      return res.status(403).json({
        success: false,
        message: 'Cannot access other users\' attendance records'
      });
    }

    const attendanceRecords = await AttendanceModel.findByUserId(userId);

    return res.json({
      success: true,
      message: 'Attendance history retrieved successfully',
      data: { attendance: attendanceRecords }
    });
  } catch (error) {
    console.error('Get attendance history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/attendance - Get attendance records
router.get('/', authenticateJWT, checkPermission('attendance:read'), async (req: Request, res: Response) => {
  try {
    const { userId, date, startDate, endDate, status } = req.query;
    const currentUserId = req.currentUser?.id;
    const currentUserRole = req.currentUser?.role_id;

    // Regular users can only view their own attendance
    // Admins and managers can view others' attendance
    let targetUserId = currentUserId;
    if (currentUserRole === 1 || currentUserRole === 3) { // Assuming admin/HR roles
      const userIdStr = Array.isArray(userId) ? userId[0] : typeof userId === 'string' ? userId : '';
      targetUserId = userId ? parseInt(userIdStr as string) : currentUserId;
    } else if (userId) {
      const userIdStr = Array.isArray(userId) ? userId[0] : typeof userId === 'string' ? userId : '';
      if (parseInt(userIdStr as string) !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: 'Cannot view other users\' attendance records'
        });
      }
    }

    let attendanceRecords: any[];

    if (date) {
      // Get attendance for specific date
      const singleAttendance = await AttendanceModel.findByUserIdAndDate(targetUserId!, new Date(date as string));
      attendanceRecords = singleAttendance ? [singleAttendance] : [];
    } else if (startDate && endDate) {
      // Get attendance for date range
      attendanceRecords = await AttendanceModel.findByDateRange(targetUserId!, new Date(startDate as string), new Date(endDate as string));
    } else {
      // Get all attendance for user
      attendanceRecords = await AttendanceModel.findByUserId(targetUserId!);
    }

    // Filter by status if provided
    if (status) {
      attendanceRecords = attendanceRecords.filter(record => record.status === status);
    }

    return res.json({
      success: true,
      message: 'Attendance records retrieved successfully',
      data: { attendance: attendanceRecords }
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/attendance/my - Get current user's attendance records (self-access without specific permission)
router.get('/my', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { date, startDate, endDate, status } = req.query;
    const currentUserId = req.currentUser?.id;

    let attendanceRecords: any[];

    if (date) {
      // Get attendance for specific date
      const singleAttendance = await AttendanceModel.findByUserIdAndDate(currentUserId!, new Date(date as string));
      attendanceRecords = singleAttendance ? [singleAttendance] : [];
    } else if (startDate && endDate) {
      // Get attendance for date range
      attendanceRecords = await AttendanceModel.findByDateRange(currentUserId!, new Date(startDate as string), new Date(endDate as string));
    } else {
      // Get all attendance for user
      attendanceRecords = await AttendanceModel.findByUserId(currentUserId!);
    }

    // Filter by status if provided
    if (status) {
      attendanceRecords = attendanceRecords.filter(record => record.status === status);
    }

    return res.json({
      success: true,
      message: 'Your attendance records retrieved successfully',
      data: { attendance: attendanceRecords }
    });
  } catch (error) {
    console.error('Get my attendance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/attendance/summary - Get attendance summary
router.get('/summary', authenticateJWT, checkPermission('attendance:read'), async (req: Request, res: Response) => {
  try {
    const { userId, startDate, endDate } = req.query;
    const currentUserId = req.currentUser?.id;
    const currentUserRole = req.currentUser?.role_id;

    // Determine whose attendance to summarize
    let targetUserId = currentUserId;
    if (currentUserRole === 1 || currentUserRole === 3) { // Admin/HR
      const userIdStr = Array.isArray(userId) ? userId[0] : typeof userId === 'string' ? userId : '';
      targetUserId = userId ? parseInt(userIdStr as string) : currentUserId;
    } else if (userId) {
      const userIdStr = Array.isArray(userId) ? userId[0] : typeof userId === 'string' ? userId : '';
      if (parseInt(userIdStr as string) !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: 'Cannot view other users\' attendance summary'
        });
      }
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
      success: false,
      message: 'startDate and endDate are required for summary'
    });
  }

    const summary = await AttendanceModel.getAttendanceSummary(
      targetUserId!,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    const percentage = await AttendanceModel.getAttendancePercentage(
      targetUserId!,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    return res.json({
      success: true,
      message: 'Attendance summary retrieved successfully',
      data: {
        summary: {
          ...summary,
          attendance_percentage: percentage
        }
      }
    });
  } catch (error) {
    console.error('Get attendance summary error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/attendance/my/summary - Get current user's attendance summary (self-access without specific permission)
router.get('/my/summary', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const currentUserId = req.currentUser?.id;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required for summary'
      });
    }

    const summary = await AttendanceModel.getAttendanceSummary(
      currentUserId!,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    const percentage = await AttendanceModel.getAttendancePercentage(
      currentUserId!,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    return res.json({
      success: true,
      message: 'Your attendance summary retrieved successfully',
      data: {
        summary: {
          ...summary,
          attendance_percentage: percentage
        }
      }
    });
  } catch (error) {
    console.error('Get my attendance summary error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/attendance/reports/monthly - Generate monthly attendance reports
router.get('/reports/monthly', authenticateJWT, checkPermission('attendance:read'), async (req: Request, res: Response) => {
  try {
    const { year, month, userId } = req.query;
    const currentUserId = req.currentUser?.id;
    const currentUserRole = req.currentUser?.role_id;

    // Validate required parameters
    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'Year and month are required for monthly report'
      });
    }

    const yearNum = parseInt(year as string);
    const monthNum = parseInt(month as string);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        success: false,
        message: 'Valid year and month (1-12) are required'
      });
    }

    // Determine whose attendance to report on
    let targetUserId = currentUserId;
    if (currentUserRole === 1 || currentUserRole === 3) { // Admin/HR
      const userIdStr = Array.isArray(userId) ? userId[0] : typeof userId === 'string' ? userId : '';
      targetUserId = userId ? parseInt(userIdStr as string) : currentUserId;
    } else if (userId) {
      const userIdStr = Array.isArray(userId) ? userId[0] : typeof userId === 'string' ? userId : '';
      if (parseInt(userIdStr as string) !== currentUserId) {
        return res.status(403).json({
          success: false,
          message: 'Cannot view other users\' attendance reports'
        });
      }
    }

    // Calculate start and end dates for the month
    const startDate = new Date(yearNum, monthNum - 1, 1); // Month is 0-indexed in JS
    const endDate = new Date(yearNum, monthNum, 0); // Last day of the month

    // Get attendance records for the month
    const attendanceRecords = await AttendanceModel.findByDateRange(targetUserId!, startDate, endDate);

    // Calculate monthly summary
    const monthlySummary = await AttendanceModel.getAttendanceSummary(targetUserId!, startDate, endDate);
    const monthlyPercentage = await AttendanceModel.getAttendancePercentage(targetUserId!, startDate, endDate);

    return res.json({
      success: true,
      message: 'Monthly attendance report generated successfully',
      data: {
        report: {
          year: yearNum,
          month: monthNum,
          user_id: targetUserId,
          attendance_records: attendanceRecords,
          summary: {
            ...monthlySummary,
            attendance_percentage: monthlyPercentage
          }
        }
      }
    });
  } catch (error) {
    console.error('Get monthly attendance report error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/attendance/records - Get all attendance records (with optional filters and pagination)
router.get('/records', authenticateJWT, checkPermission('attendance:read'), async (req: Request, res: Response) => {
  try {
    const { page, limit, userId, date, startDate, endDate, status } = req.query;
    const currentPage = parseInt(page as string) || 1;
    const perPage = parseInt(limit as string) || 20;
    const offset = (currentPage - 1) * perPage;

    // Build query conditions
    let query = `SELECT a.*, s.first_name, s.last_name, s.employee_id
                 FROM attendance a
                 LEFT JOIN staff s ON a.user_id = s.user_id
                 WHERE 1=1`;
    const params: any[] = [];

    if (userId) {
      const userIdNum = parseInt(userId as string);
      if (!isNaN(userIdNum)) {
        query += ' AND a.user_id = ?';
        params.push(userIdNum);
      }
    }

    if (date) {
      query += ' AND DATE(a.date) = ?';
      params.push(new Date(date as string));
    } else if (startDate && endDate) {
      query += ' AND a.date BETWEEN ? AND ?';
      params.push(new Date(startDate as string), new Date(endDate as string));
    }

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    // Add ordering and pagination
    query += ' ORDER BY a.date DESC, a.created_at DESC LIMIT ? OFFSET ?';
    params.push(perPage, offset);

    // Also get total count for pagination metadata
    let countQuery = `SELECT COUNT(*) as total FROM attendance a WHERE 1=1`;
    const countParams: any[] = [];

    if (userId) {
      const userIdNum = parseInt(userId as string);
      if (!isNaN(userIdNum)) {
        countQuery += ' AND a.user_id = ?';
        countParams.push(userIdNum);
      }
    }

    if (date) {
      countQuery += ' AND DATE(a.date) = ?';
      countParams.push(new Date(date as string));
    } else if (startDate && endDate) {
      countQuery += ' AND a.date BETWEEN ? AND ?';
      countParams.push(new Date(startDate as string), new Date(endDate as string));
    }

    if (status) {
      countQuery += ' AND a.status = ?';
      countParams.push(status);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const totalRecords = (countResult as any[])[0]?.total || 0;
    const totalPages = Math.ceil(totalRecords / perPage);

    const [rows] = await pool.execute(query, params);

    return res.json({
      success: true,
      message: 'Attendance records retrieved successfully',
      data: {
        attendance: rows,
        pagination: {
          current_page: currentPage,
          per_page: perPage,
          total_records: totalRecords,
          total_pages: totalPages
        }
      }
    });
  } catch (error) {
    console.error('Get attendance records error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/attendance/:id - Update attendance record (admin only)
router.put('/:id', authenticateJWT, checkPermission('attendance:update'), async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const attendanceId = parseInt(idStr as string);
    const { status, check_in_time, check_out_time, location_verified } = req.body;

    if (isNaN(attendanceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance ID'
      });
    }

    const existingAttendance = await AttendanceModel.findById(attendanceId);
    if (!existingAttendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (check_in_time !== undefined) updateData.check_in_time = check_in_time;
    if (check_out_time !== undefined) updateData.check_out_time = check_out_time;
    if (location_verified !== undefined) updateData.location_verified = location_verified;

    const updatedAttendance = await AttendanceModel.update(attendanceId, updateData);

    return res.json({
      success: true,
      message: 'Attendance record updated successfully',
      data: { attendance: updatedAttendance }
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/attendance/:id - Get specific attendance record
router.get('/:id', authenticateJWT, checkPermission('attendance:read'), async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const attendanceId = parseInt(idStr as string);

    if (isNaN(attendanceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance ID'
      });
    }

    const attendanceRecord = await AttendanceModel.findById(attendanceId);
    if (!attendanceRecord) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    // Check if user can access this record
    const currentUserId = req.currentUser?.id;
    const currentUserRole = req.currentUser?.role_id;
    if (attendanceRecord.user_id !== currentUserId && currentUserRole !== 1 && currentUserRole !== 3) {
      return res.status(403).json({
        success: false,
        message: 'Cannot access other users\' attendance records'
      });
    }

    return res.json({
      success: true,
      message: 'Attendance record retrieved successfully',
      data: { attendance: attendanceRecord }
    });
  } catch (error) {
    console.error('Get attendance by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/attendance/records/:id - Get specific attendance record by ID (alternative route)
router.get('/records/:id', authenticateJWT, checkPermission('attendance:read'), async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const attendanceId = parseInt(idStr as string);

    if (isNaN(attendanceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance ID'
      });
    }

    const attendanceRecord = await AttendanceModel.findById(attendanceId);
    if (!attendanceRecord) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    // Check if user can access this record
    const currentUserId = req.currentUser?.id;
    const currentUserRole = req.currentUser?.role_id;
    if (attendanceRecord.user_id !== currentUserId && currentUserRole !== 1 && currentUserRole !== 3) {
      return res.status(403).json({
        success: false,
        message: 'Cannot access other users\' attendance records'
      });
    }

    return res.json({
      success: true,
      message: 'Attendance record retrieved successfully',
      data: { attendance: attendanceRecord }
    });
  } catch (error) {
    console.error('Get attendance record by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/attendance/my/:id - Get current user's specific attendance record (self-access without specific permission)
router.get('/my/:id', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const attendanceId = parseInt(idStr as string);

    if (isNaN(attendanceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance ID'
      });
    }

    const attendanceRecord = await AttendanceModel.findById(attendanceId);
    if (!attendanceRecord) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    // Check if this record belongs to the current user
    const currentUserId = req.currentUser?.id;
    if (attendanceRecord.user_id !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Cannot access other users\' attendance records'
      });
    }

    return res.json({
      success: true,
      message: 'Your attendance record retrieved successfully',
      data: { attendance: attendanceRecord }
    });
  } catch (error) {
    console.error('Get my attendance by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/attendance/holidays - Get holidays that affect attendance
router.get('/holidays', authenticateJWT, checkPermission('attendance:view'), async (req: Request, res: Response) => {
  try {
    const { branchId, date, startDate, endDate } = req.query;

    let holidays;
    if (startDate && endDate) {
      // Get holidays in date range
      const startDateStr = Array.isArray(startDate) ? startDate[0] : startDate;
      const endDateStr = Array.isArray(endDate) ? endDate[0] : endDate;
      
      if (typeof startDateStr !== 'string' || typeof endDateStr !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'startDate and endDate must be valid date strings'
        });
      }

      const branchIdStr = Array.isArray(branchId) ? branchId[0] : branchId;
      const branchIdNum = branchIdStr ? parseInt(branchIdStr as string) : undefined;

      holidays = await HolidayModel.getHolidaysInRange(
        new Date(startDateStr),
        new Date(endDateStr),
        branchIdNum
      );
    } else if (branchId) {
      // Get holidays for specific branch
      const branchIdStr = Array.isArray(branchId) ? branchId[0] : branchId;
      const branchIdNum = parseInt(branchIdStr as string);
      
      if (isNaN(branchIdNum)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid branch ID'
        });
      }
      
      holidays = await HolidayModel.findByBranch(branchIdNum);
    } else if (date) {
      // Get holidays for specific date
      const dateStr = Array.isArray(date) ? date[0] : date;
      
      if (typeof dateStr !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'date must be a valid date string'
        });
      }
      
      holidays = await HolidayModel.findByDate(new Date(dateStr));
    } else {
      // Get all holidays
      holidays = await HolidayModel.findAll();
    }

    return res.json({
      success: true,
      message: 'Holidays retrieved successfully',
      data: { holidays }
    });
  } catch (error) {
    console.error('Get holidays error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/attendance/holidays/:id - Get specific holiday that affects attendance
router.get('/holidays/:id', authenticateJWT, checkPermission('attendance:view'), async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const holidayId = parseInt(idStr as string);

    if (isNaN(holidayId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid holiday ID'
      });
    }

    const holiday = await HolidayModel.findById(holidayId);
    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: 'Holiday not found'
      });
    }

    return res.json({
      success: true,
      message: 'Holiday retrieved successfully',
      data: { holiday }
    });
  } catch (error) {
    console.error('Get holiday error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/attendance/process-daily - Process attendance for all users for a specific date (typically called by scheduler)
router.post('/process-daily', authenticateJWT, checkPermission('attendance:manage'), async (req: Request, res: Response) => {
  try {
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    // Get all active staff members
    const [staffResults] = await pool.execute(
      `SELECT s.user_id FROM staff s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.status = 'active' AND u.status = 'active'`
    ) as [any[], any];

    const userIds = staffResults.map((staff: any) => staff.user_id);

    // Check if it's a holiday
    const isHoliday = await HolidayModel.isHoliday(new Date(date));
    if (isHoliday) {
      // Process attendance for all users as holiday
      const results = [];
      for (const userId of userIds) {
        // Check if attendance already exists
        const existingAttendance = await AttendanceModel.findByUserIdAndDate(userId, new Date(date));
        if (existingAttendance) {
          results.push({
            user_id: userId,
            status: 'skipped',
            message: 'Attendance already exists for this date'
          });
          continue;
        }

        const attendanceData = {
          user_id: userId,
          date: new Date(date),
          status: 'holiday' as const,
          check_in_time: null,
          check_out_time: null,
          location_coordinates: null,
          location_verified: false,
          location_address: null,
          notes: 'Public holiday - no attendance required'
        };

        const newAttendance = await AttendanceModel.create(attendanceData);
        results.push({
          user_id: userId,
          status: 'success',
          attendance: newAttendance
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Holiday attendance processed for all active staff',
        data: { results }
      });
    }

    // Process attendance for each user individually
    const results = [];
    for (const userId of userIds) {
      // Check if attendance already exists
      const existingAttendance = await AttendanceModel.findByUserIdAndDate(userId, new Date(date));
      if (existingAttendance) {
        results.push({
          user_id: userId,
          status: 'skipped',
          message: 'Attendance already exists for this date'
        });
        continue;
      }

      // Check if user has approved leave on this date
      const leaveHistory = await LeaveHistoryModel.findByUserIdAndDateRange(userId, new Date(date), new Date(date));
      if (leaveHistory.length > 0) {
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
        results.push({
          user_id: userId,
          status: 'success',
          attendance: newAttendance
        });
        continue;
      }

      // Get user's shift for this date
      const shift = await ShiftTimingModel.findCurrentShiftForUser(userId, new Date(date));
      
      // If no shift is defined for this user on this date, don't mark attendance (they're not scheduled)
      if (!shift) {
        results.push({
          user_id: userId,
          status: 'skipped',
          message: 'No shift assigned for this date'
        });
        continue;
      }

      // If shift exists but no check-in time was recorded, mark as absent
      const attendanceData = {
        user_id: userId,
        date: new Date(date),
        status: 'absent' as const,
        check_in_time: null,
        check_out_time: null,
        location_coordinates: null,
        location_verified: false,
        location_address: null,
        notes: 'Scheduled shift but no check-in recorded'
      };

      const newAttendance = await AttendanceModel.create(attendanceData);
      results.push({
        user_id: userId,
        status: 'success',
        attendance: newAttendance
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Daily attendance processing completed for all active staff',
      data: { results }
    });

  } catch (error) {
    console.error('Process daily attendance error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Mount attendance process routes
router.use('/process', attendanceProcessRoutes);

// Mount attendance settings routes
router.use('/settings', attendanceSettingsRoutes);

export default router;