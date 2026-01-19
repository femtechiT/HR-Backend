import { pool } from '../config/database';

/**
 * Service for analytics and metrics calculations
 */
export class AnalyticsService {
  /**
   * Calculate attendance metrics for a given period
   */
  static async calculateAttendanceMetrics(
    startDate: string,
    endDate: string,
    branchId?: number,
    departmentId?: number
  ) {
    try {
      let query = `
        SELECT 
          COUNT(DISTINCT a.user_id) as total_employees,
          COUNT(a.id) as total_attendance_records,
          SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as total_present,
          SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as total_absent,
          SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as total_late,
          SUM(CASE WHEN a.status = 'half_day' THEN 1 ELSE 0 END) as total_half_day,
          AVG(TIMESTAMPDIFF(HOUR, 
            STR_TO_DATE(CONCAT(a.date, ' ', a.check_in_time), '%Y-%m-%d %H:%i:%s'), 
            STR_TO_DATE(CONCAT(a.date, ' ', a.check_out_time), '%Y-%m-%d %H:%i:%s')
          )) as avg_working_hours
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        JOIN staff s ON u.id = s.user_id
        WHERE a.date BETWEEN ? AND ?
      `;
      const params: any[] = [startDate, endDate];

      if (branchId) {
        query += ' AND s.branch_id = ?';
        params.push(branchId);
      }

      if (departmentId) {
        query += ' AND s.department = ?'; // department is a string field in staff table
        params.push(departmentId);
      }

      const [rows]: any = await pool.execute(query, params);
      return rows[0];
    } catch (error) {
      console.error('Error calculating attendance metrics:', error);
      throw error;
    }
  }

  /**
   * Calculate leave metrics for a given period
   */
  static async calculateLeaveMetrics(
    startDate: string,
    endDate: string,
    branchId?: number,
    departmentId?: number
  ) {
    try {
      let query = `
        SELECT 
          COUNT(lh.id) as total_leave_requests,
          SUM(CASE WHEN lh.status = 'approved' THEN 1 ELSE 0 END) as approved_leaves,
          SUM(CASE WHEN lh.status = 'rejected' THEN 1 ELSE 0 END) as rejected_leaves,
          SUM(CASE WHEN lh.status = 'pending' THEN 1 ELSE 0 END) as pending_leaves,
          SUM(lh.days_requested) as total_days_requested,
          SUM(CASE WHEN lh.status = 'approved' THEN lh.days_requested ELSE 0 END) as approved_days,
          lt.name as leave_type_name,
          lt.id as leave_type_id
        FROM leave_history lh
        JOIN leave_types lt ON lh.leave_type_id = lt.id
        JOIN users u ON lh.user_id = u.id
        JOIN staff s ON u.id = s.user_id
        WHERE lh.start_date BETWEEN ? AND ?
      `;
      const params: any[] = [startDate, endDate];

      if (branchId) {
        query += ' AND s.branch_id = ?';
        params.push(branchId);
      }

      if (departmentId) {
        query += ' AND s.department = ?';
        params.push(departmentId);
      }

      query += ' GROUP BY lt.id, lt.name';

      const [rows]: any = await pool.execute(query, params);
      return rows;
    } catch (error) {
      console.error('Error calculating leave metrics:', error);
      throw error;
    }
  }

  /**
   * Calculate payroll metrics for a given period
   */
  static async calculatePayrollMetrics(
    startDate: string,
    endDate: string,
    branchId?: number,
    departmentId?: number
  ) {
    try {
      let query = `
        SELECT 
          COUNT(pr.id) as total_payroll_records,
          SUM(pr.net_pay) as total_net_pay,
          AVG(pr.net_pay) as average_net_pay,
          SUM(pr.gross_pay) as total_gross_pay,
          AVG(pr.gross_pay) as average_gross_pay,
          pr.payroll_run_id,
          prun.month,
          prun.year
        FROM payroll_records pr
        JOIN payroll_runs prun ON pr.payroll_run_id = prun.id
        JOIN users u ON pr.user_id = u.id
        JOIN staff s ON u.id = s.user_id
        WHERE prun.run_date BETWEEN ? AND ?
      `;
      const params: any[] = [startDate, endDate];

      if (branchId) {
        query += ' AND s.branch_id = ?';
        params.push(branchId);
      }

      if (departmentId) {
        query += ' AND s.department = ?';
        params.push(departmentId);
      }

      query += ' GROUP BY pr.payroll_run_id, prun.month, prun.year';

      const [rows]: any = await pool.execute(query, params);
      return rows;
    } catch (error) {
      console.error('Error calculating payroll metrics:', error);
      throw error;
    }
  }

  /**
   * Calculate performance metrics for a given period
   */
  static async calculatePerformanceMetrics(
    startDate: string,
    endDate: string,
    branchId?: number,
    departmentId?: number
  ) {
    try {
      let query = `
        SELECT 
          COUNT(ps.id) as total_appraisals,
          AVG(ps.overall_score) as average_overall_score,
          MIN(ps.overall_score) as min_overall_score,
          MAX(ps.overall_score) as max_overall_score,
          SUM(CASE WHEN ps.overall_score >= 4.0 THEN 1 ELSE 0 END) as high_performers,
          SUM(CASE WHEN ps.overall_score >= 3.0 AND ps.overall_score < 4.0 THEN 1 ELSE 0 END) as medium_performers,
          SUM(CASE WHEN ps.overall_score < 3.0 THEN 1 ELSE 0 END) as low_performers,
          u.full_name as employee_name,
          u.id as user_id
        FROM performance_scores ps
        JOIN users u ON ps.user_id = u.id
        JOIN staff s ON u.id = s.user_id
        WHERE ps.evaluation_date BETWEEN ? AND ?
      `;
      const params: any[] = [startDate, endDate];

      if (branchId) {
        query += ' AND s.branch_id = ?';
        params.push(branchId);
      }

      if (departmentId) {
        query += ' AND s.department = ?';
        params.push(departmentId);
      }

      query += ' GROUP BY u.id, u.full_name ORDER BY average_overall_score DESC';

      const [rows]: any = await pool.execute(query, params);
      return rows;
    } catch (error) {
      console.error('Error calculating performance metrics:', error);
      throw error;
    }
  }

  /**
   * Calculate staff metrics (hiring, termination, etc.)
   */
  static async calculateStaffMetrics(
    startDate: string,
    endDate: string,
    branchId?: number,
    departmentId?: number
  ) {
    try {
      // Calculate new hires in the period
      let newHiresQuery = `
        SELECT 
          COUNT(s.id) as new_hires,
          s.department as department_name
        FROM staff s
        WHERE s.joining_date BETWEEN ? AND ?
      `;
      const newHiresParams: any[] = [startDate, endDate];

      if (branchId) {
        newHiresQuery += ' AND s.branch_id = ?';
        newHiresParams.push(branchId);
      }

      if (departmentId) {
        newHiresQuery += ' AND s.department = ?';
        newHiresParams.push(departmentId);
      }

      newHiresQuery += ' GROUP BY s.department';

      const [newHiresRows]: any = await pool.execute(newHiresQuery, newHiresParams);

      // Calculate terminations in the period
      let terminationsQuery = `
        SELECT 
          COUNT(s.id) as terminations,
          s.department as department_name
        FROM staff s
        WHERE s.status = 'terminated' AND s.updated_at BETWEEN ? AND ?
      `;
      const terminationsParams: any[] = [startDate, endDate];

      if (branchId) {
        terminationsQuery += ' AND s.branch_id = ?';
        terminationsParams.push(branchId);
      }

      if (departmentId) {
        terminationsQuery += ' AND s.department = ?';
        terminationsParams.push(departmentId);
      }

      terminationsQuery += ' GROUP BY s.department';

      const [terminationsRows]: any = await pool.execute(terminationsQuery, terminationsParams);

      // Calculate active employees
      let activeQuery = `
        SELECT 
          COUNT(s.id) as active_employees,
          s.department as department_name
        FROM staff s
        WHERE s.status = 'active'
      `;
      const activeParams: any[] = [];

      if (branchId) {
        activeQuery += ' AND s.branch_id = ?';
        activeParams.push(branchId);
      }

      if (departmentId) {
        activeQuery += ' AND s.department = ?';
        activeParams.push(departmentId);
      }

      activeQuery += ' GROUP BY s.department';

      const [activeRows]: any = await pool.execute(activeQuery, activeParams);

      return {
        newHires: newHiresRows,
        terminations: terminationsRows,
        activeEmployees: activeRows
      };
    } catch (error) {
      console.error('Error calculating staff metrics:', error);
      throw error;
    }
  }

  /**
   * Save calculated metrics to the analytics_metrics table
   */
  static async saveCalculatedMetric(
    metricName: string,
    metricCategory: string,
    metricValue: number,
    metricUnit: string,
    calculatedForPeriod: string,
    calculatedFrom: Date,
    calculatedTo: Date,
    branchId?: number,
    departmentId?: number
  ) {
    try {
      const [result]: any = await pool.execute(
        `INSERT INTO analytics_metrics 
         (metric_name, metric_category, metric_value, metric_unit, calculated_at, calculated_for_period, 
          calculated_from, calculated_to, branch_id, department_id, calculated_by) 
         VALUES (?, ?, ?, ?, CURDATE(), ?, ?, ?, ?, ?, ?)`,
        [
          metricName,
          metricCategory,
          metricValue,
          metricUnit,
          calculatedForPeriod,
          calculatedFrom,
          calculatedTo,
          branchId || null,
          departmentId || null,
          1 // Assuming system/calculator user ID
        ]
      );

      return result.insertId;
    } catch (error) {
      console.error('Error saving calculated metric:', error);
      throw error;
    }
  }

  /**
   * Get calculated metrics for a specific period
   */
  static async getCalculatedMetrics(
    metricCategory?: string,
    startDate?: string,
    endDate?: string,
    branchId?: number,
    departmentId?: number
  ) {
    try {
      let query = `
        SELECT *
        FROM analytics_metrics
        WHERE 1=1
      `;
      const params: any[] = [];

      if (metricCategory) {
        query += ' AND metric_category = ?';
        params.push(metricCategory);
      }

      if (startDate && endDate) {
        query += ' AND calculated_at BETWEEN ? AND ?';
        params.push(startDate, endDate);
      } else if (startDate) {
        query += ' AND calculated_at >= ?';
        params.push(startDate);
      } else if (endDate) {
        query += ' AND calculated_at <= ?';
        params.push(endDate);
      }

      if (branchId) {
        query += ' AND branch_id = ?';
        params.push(branchId);
      }

      if (departmentId) {
        query += ' AND department_id = ?';
        params.push(departmentId);
      }

      query += ' ORDER BY calculated_at DESC, created_at DESC';

      const [rows]: any = await pool.execute(query, params);
      return rows;
    } catch (error) {
      console.error('Error fetching calculated metrics:', error);
      throw error;
    }
  }

  /**
   * Calculate and store all metrics for a given period
   */
  static async calculateAndStoreAllMetrics(
    startDate: string,
    endDate: string,
    branchId?: number,
    departmentId?: number
  ) {
    try {
      // Calculate attendance metrics
      const attendanceMetrics = await this.calculateAttendanceMetrics(startDate, endDate, branchId, departmentId);

      // Store attendance metrics
      await this.saveCalculatedMetric(
        'average_attendance_rate',
        'attendance',
        attendanceMetrics.total_present / attendanceMetrics.total_attendance_records * 100,
        'percentage',
        'period',
        new Date(startDate),
        new Date(endDate),
        branchId,
        departmentId
      );

      await this.saveCalculatedMetric(
        'average_working_hours',
        'attendance',
        attendanceMetrics.avg_working_hours,
        'hours',
        'period',
        new Date(startDate),
        new Date(endDate),
        branchId,
        departmentId
      );

      // Calculate leave metrics
      const leaveMetrics = await this.calculateLeaveMetrics(startDate, endDate, branchId, departmentId);
      for (const leaveMetric of leaveMetrics) {
        await this.saveCalculatedMetric(
          `leave_approval_rate_${leaveMetric.leave_type_name.toLowerCase().replace(/\s+/g, '_')}`,
          'leave',
          leaveMetric.approved_leaves / leaveMetric.total_leave_requests * 100,
          'percentage',
          'period',
          new Date(startDate),
          new Date(endDate),
          branchId,
          departmentId
        );
      }

      // Calculate payroll metrics
      const payrollMetrics = await this.calculatePayrollMetrics(startDate, endDate, branchId, departmentId);
      for (const payrollMetric of payrollMetrics) {
        await this.saveCalculatedMetric(
          'average_net_pay',
          'payroll',
          payrollMetric.average_net_pay,
          'currency',
          'period',
          new Date(startDate),
          new Date(endDate),
          branchId,
          departmentId
        );
      }

      // Calculate performance metrics
      const performanceMetrics = await this.calculatePerformanceMetrics(startDate, endDate, branchId, departmentId);
      for (const perfMetric of performanceMetrics) {
        await this.saveCalculatedMetric(
          'average_performance_score',
          'performance',
          perfMetric.average_overall_score,
          'score',
          'period',
          new Date(startDate),
          new Date(endDate),
          branchId,
          departmentId
        );
      }

      // Calculate staff metrics
      const staffMetrics = await this.calculateStaffMetrics(startDate, endDate, branchId, departmentId);

      // Store staff metrics
      for (const newHire of staffMetrics.newHires) {
        await this.saveCalculatedMetric(
          'new_hires',
          'staff',
          newHire.new_hires,
          'count',
          'period',
          new Date(startDate),
          new Date(endDate),
          branchId,
          departmentId
        );
      }

      for (const termination of staffMetrics.terminations) {
        await this.saveCalculatedMetric(
          'terminations',
          'staff',
          termination.terminations,
          'count',
          'period',
          new Date(startDate),
          new Date(endDate),
          branchId,
          departmentId
        );
      }

      return {
        success: true,
        message: 'All metrics calculated and stored successfully',
        calculatedMetrics: {
          attendance: attendanceMetrics,
          leave: leaveMetrics,
          payroll: payrollMetrics,
          performance: performanceMetrics,
          staff: staffMetrics
        }
      };
    } catch (error) {
      console.error('Error calculating and storing all metrics:', error);
      throw error;
    }
  }
}