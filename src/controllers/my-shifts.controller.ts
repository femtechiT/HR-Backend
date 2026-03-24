import { Request, Response } from 'express';
import { pool } from '../config/database';

/**
 * Get my shifts - for employees to view their own shift assignments
 * GET /api/my-shifts
 */
export const getMyShifts = async (req: Request, res: Response) => {
  try {
    const userId = req.currentUser?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - User ID not found'
      });
    }

    const { startDate, endDate, status } = req.query;

    // Build query to get user's shift assignments with template details
    let query = `
      SELECT 
        esa.id,
        esa.user_id,
        esa.shift_template_id,
        esa.effective_from,
        esa.effective_to,
        esa.assignment_type,
        esa.status,
        esa.recurrence_pattern,
        esa.recurrence_days,
        esa.recurrence_day_of_week,
        st.name as template_name,
        st.start_time,
        st.end_time,
        st.break_duration_minutes,
        st.type as shift_type,
        u.full_name as user_name,
        u.email as user_email,
        s.department,
        s.branch_id
      FROM employee_shift_assignments esa
      LEFT JOIN shift_templates st ON esa.shift_template_id = st.id
      LEFT JOIN users u ON esa.user_id = u.id
      LEFT JOIN staff s ON esa.user_id = s.user_id
      WHERE esa.user_id = ?
    `;

    const params: any[] = [userId];

    // Filter by status if provided
    if (status && status !== 'all') {
      query += ' AND esa.status = ?';
      params.push(status);
    }

    // Filter by date range if provided
    if (startDate) {
      query += ' AND esa.effective_from >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND (esa.effective_to IS NULL OR esa.effective_to <= ?)';
      params.push(endDate);
    }

    query += ' ORDER BY esa.effective_from DESC, esa.created_at DESC';

    const [rows]: any = await pool.execute(query, params);

    // Get shift exceptions for the user
    const exceptionsQuery = `
      SELECT 
        se.id,
        se.exception_date,
        se.exception_type,
        se.new_start_time,
        se.new_end_time,
        se.reason,
        se.status as exception_status
      FROM shift_exceptions se
      WHERE se.user_id = ?
      AND se.status IN ('active', 'approved')
      ORDER BY se.exception_date DESC
    `;

    const [exceptions]: any = await pool.execute(exceptionsQuery, [userId]);

    // Format assignments for display
    const formattedAssignments = rows.map((assignment: any) => {
      // Parse recurrence days if exists
      let recurrenceDaysArray = [];
      if (assignment.recurrence_days) {
        try {
          recurrenceDaysArray = JSON.parse(assignment.recurrence_days);
        } catch (e) {
          recurrenceDaysArray = assignment.recurrence_day_of_week ? [assignment.recurrence_day_of_week] : [];
        }
      }

      // Determine shift display type
      const shiftType = assignment.shift_type || getShiftTypeFromTimes(assignment.start_time, assignment.end_time);

      return {
        id: assignment.id,
        templateName: assignment.template_name || 'Custom Shift',
        startTime: assignment.start_time,
        endTime: assignment.end_time,
        breakDuration: assignment.break_duration_minutes,
        effectiveFrom: assignment.effective_from,
        effectiveTo: assignment.effective_to,
        assignmentType: assignment.assignment_type,
        status: assignment.status,
        recurrencePattern: assignment.recurrence_pattern,
        recurrenceDays: recurrenceDaysArray,
        shiftType: shiftType,
        department: assignment.department,
        branchId: assignment.branch_id
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Shift assignments retrieved successfully',
      data: {
        assignments: formattedAssignments,
        exceptions: exceptions,
        total: formattedAssignments.length,
        activeCount: formattedAssignments.filter((a: any) => a.status === 'active').length
      }
    });
  } catch (error) {
    console.error('Error fetching my shifts:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching shift assignments'
    });
  }
};

/**
 * Get my upcoming shifts - shows next 30 days of scheduled shifts
 * GET /api/my-shifts/upcoming
 */
export const getMyUpcomingShifts = async (req: Request, res: Response) => {
  try {
    const userId = req.currentUser?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - User ID not found'
      });
    }

    const { days = 30 } = req.query;
    const numDays = parseInt(days as string);

    // Get user's active assignments
    const assignmentsQuery = `
      SELECT 
        esa.id,
        esa.shift_template_id,
        esa.effective_from,
        esa.effective_to,
        esa.recurrence_pattern,
        esa.recurrence_days,
        esa.recurrence_day_of_week,
        st.name as template_name,
        st.start_time,
        st.end_time,
        st.break_duration_minutes
      FROM employee_shift_assignments esa
      LEFT JOIN shift_templates st ON esa.shift_template_id = st.id
      WHERE esa.user_id = ? AND esa.status = 'active'
      AND esa.effective_from <= CURDATE()
      AND (esa.effective_to IS NULL OR esa.effective_to >= CURDATE())
    `;

    const [assignments]: any = await pool.execute(assignmentsQuery, [userId]);

    // Get user's exceptions for the period
    const exceptionsQuery = `
      SELECT 
        exception_date,
        exception_type,
        new_start_time,
        new_end_time
      FROM shift_exceptions
      WHERE user_id = ?
      AND exception_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
      AND status IN ('active', 'approved')
    `;

    const [exceptions]: any = await pool.execute(exceptionsQuery, [userId, numDays]);

    // Create a map of exception dates for quick lookup
    const exceptionMap = new Map();
    exceptions.forEach((ex: any) => {
      const dateKey = ex.exception_date.toISOString().split('T')[0];
      exceptionMap.set(dateKey, ex);
    });

    // Generate upcoming shifts for the next N days
    const upcomingShifts = [];
    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    for (let i = 0; i < numDays; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(currentDate.getDate() + i);
      
      const dateKey = currentDate.toISOString().split('T')[0];
      const dayName = dayNames[currentDate.getDay()];

      // Check if there's an exception for this date
      const exception = exceptionMap.get(dateKey);

      if (exception) {
        // Use exception times
        upcomingShifts.push({
          date: dateKey,
          dayOfWeek: dayName,
          startTime: exception.new_start_time,
          endTime: exception.new_end_time,
          templateName: `Exception: ${exception.exception_type}`,
          isException: true,
          exceptionType: exception.exception_type
        });
      } else {
        // Check assignments for this day
        assignments.forEach((assignment: any) => {
          const shouldWork = checkIfWorkingDay(assignment, dayName, currentDate);
          
          if (shouldWork) {
            upcomingShifts.push({
              date: dateKey,
              dayOfWeek: dayName,
              startTime: assignment.start_time,
              endTime: assignment.end_time,
              breakDuration: assignment.break_duration_minutes,
              templateName: assignment.template_name,
              isException: false
            });
          }
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Upcoming shifts retrieved successfully',
      data: {
        shifts: upcomingShifts,
        days: numDays
      }
    });
  } catch (error) {
    console.error('Error fetching upcoming shifts:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching upcoming shifts'
    });
  }
};

/**
 * Get team shifts - for managers to view their team's shifts
 * GET /api/team-shifts
 */
export const getTeamShifts = async (req: Request, res: Response) => {
  try {
    const userId = req.currentUser?.id;
    const { department, branchId, startDate, endDate } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - User ID not found'
      });
    }

    // Get user's department/branch to determine team
    const userQuery = `
      SELECT department, branch_id, role_id 
      FROM staff s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = ?
    `;
    
    const [userRows]: any = await pool.execute(userQuery, [userId]);
    
    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User staff record not found'
      });
    }

    const user = userRows[0];
    
    // Build team filter
    let teamFilter = 'WHERE 1=1';
    const params: any[] = [];

    // If user is manager, show their department
    if (user.role_id >= 3) { // Manager or above
      if (department) {
        teamFilter += ' AND s.department = ?';
        params.push(department);
      } else if (user.department) {
        teamFilter += ' AND s.department = ?';
        params.push(user.department);
      }
    }

    if (branchId) {
      teamFilter += ' AND s.branch_id = ?';
      params.push(branchId);
    }

    // Get team members' shifts
    const query = `
      SELECT 
        esa.id,
        esa.user_id,
        esa.shift_template_id,
        esa.effective_from,
        esa.effective_to,
        esa.assignment_type,
        esa.status,
        st.name as template_name,
        st.start_time,
        st.end_time,
        u.full_name as user_name,
        u.email as user_email,
        s.department,
        s.branch_id
      FROM employee_shift_assignments esa
      LEFT JOIN shift_templates st ON esa.shift_template_id = st.id
      LEFT JOIN users u ON esa.user_id = u.id
      LEFT JOIN staff s ON esa.user_id = u.id
      ${teamFilter}
      AND esa.status = 'active'
      ORDER BY s.department, u.full_name, esa.effective_from DESC
    `;

    const [rows]: any = await pool.execute(query, params);

    // Format by department
    const shiftsByDepartment: any = {};
    rows.forEach((row: any) => {
      if (!shiftsByDepartment[row.department]) {
        shiftsByDepartment[row.department] = [];
      }
      
      shiftsByDepartment[row.department].push({
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        userEmail: row.user_email,
        templateName: row.template_name,
        startTime: row.start_time,
        endTime: row.end_time,
        effectiveFrom: row.effective_from,
        effectiveTo: row.effective_to,
        assignmentType: row.assignment_type,
        status: row.status,
        department: row.department,
        branchId: row.branch_id
      });
    });

    return res.status(200).json({
      success: true,
      message: 'Team shifts retrieved successfully',
      data: {
        shiftsByDepartment,
        totalMembers: rows.length
      }
    });
  } catch (error) {
    console.error('Error fetching team shifts:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching team shifts'
    });
  }
};

// Helper function to determine shift type from times
function getShiftTypeFromTimes(startTime: string, endTime: string): string {
  if (!startTime || !endTime) return 'Custom';
  
  const startHour = parseInt(startTime.split(':')[0]);
  const endHour = parseInt(endTime.split(':')[0]);
  
  if (startHour >= 5 && startHour < 12) return 'Morning';
  if (startHour >= 12 && startHour < 17) return 'Afternoon';
  if (startHour >= 17 || startHour < 5) return 'Night';
  return 'Custom';
}

// Helper function to check if someone works on a specific day
function checkIfWorkingDay(assignment: any, dayName: string, currentDate: Date): boolean {
  if (!assignment.recurrence_pattern || assignment.recurrence_pattern === 'none') {
    // Non-recurring assignment - check if date is within effective period
    const effectiveFrom = new Date(assignment.effective_from);
    const effectiveTo = assignment.effective_to ? new Date(assignment.effective_to) : null;
    
    return currentDate >= effectiveFrom && (!effectiveTo || currentDate <= effectiveTo);
  }
  
  if (assignment.recurrence_pattern === 'weekly') {
    // Check recurrence_days or recurrence_day_of_week
    let recurrenceDays = [];
    
    if (assignment.recurrence_days) {
      try {
        recurrenceDays = JSON.parse(assignment.recurrence_days);
      } catch (e) {
        recurrenceDays = assignment.recurrence_day_of_week ? [assignment.recurrence_day_of_week] : [];
      }
    } else if (assignment.recurrence_day_of_week) {
      recurrenceDays = [assignment.recurrence_day_of_week];
    }
    
    return recurrenceDays.includes(dayName.toLowerCase());
  }
  
  // For other patterns, assume working day if within date range
  const effectiveFrom = new Date(assignment.effective_from);
  const effectiveTo = assignment.effective_to ? new Date(assignment.effective_to) : null;
  
  return currentDate >= effectiveFrom && (!effectiveTo || currentDate <= effectiveTo);
}
