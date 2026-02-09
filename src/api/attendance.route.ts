import { Router, Request, Response } from 'express';
import { authenticateJWT, checkPermission } from '../middleware/auth.middleware';
import AttendanceModel from '../models/attendance.model';
import ShiftTimingModel from '../models/shift-timing.model';
import HolidayModel from '../models/holiday.model';
import AttendanceLocationModel from '../models/attendance-location.model';
import BranchModel from '../models/branch.model';
import StaffModel from '../models/staff.model';
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

export default router;