import { pool } from '../config/database';

// Function to create default metrics that use existing data sources
export async function createDefaultMetricsAndKPIs() {
  const connection = await pool.getConnection();
  
  try {
    console.log('Creating default metrics and KPIs that use existing data sources...');
    
    // 1. Create default metrics that pull from existing modules
    const defaultMetrics = [
      {
        name: 'Attendance Rate',
        description: 'Percentage of days present vs total working days',
        data_type: 'percentage',
        formula: 'calculateAttendanceRate',
        data_source: 'attendance_module',
        categories: JSON.stringify(['Teacher', 'Sales', 'Inventory', 'Technician']),
        is_active: true,
        created_by: 1
      },
      {
        name: 'Leave Utilization',
        description: 'Percentage of leave days utilized vs allocated',
        data_type: 'percentage',
        formula: 'calculateLeaveUtilization',
        data_source: 'leave_module',
        categories: JSON.stringify(['Teacher', 'Sales', 'Inventory', 'Technician']),
        is_active: true,
        created_by: 1
      },
      {
        name: 'Salary Consistency',
        description: 'Consistency of salary payments over time',
        data_type: 'percentage',
        formula: 'calculateSalaryConsistency',
        data_source: 'payroll_module',
        categories: JSON.stringify(['Teacher', 'Sales', 'Inventory', 'Technician']),
        is_active: true,
        created_by: 1
      },
      {
        name: 'Punctuality Score',
        description: 'Percentage of times clocked in on time',
        data_type: 'percentage',
        formula: 'calculatePunctualityScore',
        data_source: 'attendance_module',
        categories: JSON.stringify(['Teacher', 'Sales', 'Inventory', 'Technician']),
        is_active: true,
        created_by: 1
      }
    ];

    for (const metric of defaultMetrics) {
      try {
        await connection.execute(
          `INSERT IGNORE INTO metrics_library (name, description, data_type, formula, data_source, categories, is_active, created_by, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            metric.name,
            metric.description,
            metric.data_type,
            metric.formula,
            metric.data_source,
            metric.categories,
            metric.is_active,
            metric.created_by
          ]
        );
      } catch (err) {
        console.log(`Could not insert default metric ${metric.name}, possibly already exists`);
      }
    }
    
    console.log('Default metrics created');
    
    // 2. Create default KPIs that use the existing data sources
    const defaultKPIs = [
      {
        name: 'Overall Performance Score',
        description: 'Composite score based on attendance, leave, and punctuality',
        formula: 'calculateOverallPerformance',
        weight: 100.00,
        metric_ids: JSON.stringify([1, 2, 4]), // Attendance Rate, Leave Utilization, Punctuality Score
        categories: JSON.stringify(['Teacher', 'Sales', 'Inventory', 'Technician']),
        is_active: true,
        created_by: 1
      },
      {
        name: 'Reliability Score',
        description: 'Combination of attendance and punctuality metrics',
        formula: 'calculateReliabilityScore',
        weight: 30.00,
        metric_ids: JSON.stringify([1, 4]), // Attendance Rate, Punctuality Score
        categories: JSON.stringify(['Teacher', 'Sales', 'Inventory', 'Technician']),
        is_active: true,
        created_by: 1
      },
      {
        name: 'Stability Score',
        description: 'Based on leave utilization and attendance consistency',
        formula: 'calculateStabilityScore',
        weight: 25.00,
        metric_ids: JSON.stringify([1, 2]), // Attendance Rate, Leave Utilization
        categories: JSON.stringify(['Teacher', 'Sales', 'Inventory', 'Technician']),
        is_active: true,
        created_by: 1
      }
    ];

    for (const kpi of defaultKPIs) {
      try {
        await connection.execute(
          `INSERT IGNORE INTO kpi_definitions (name, description, formula, weight, metric_ids, categories, is_active, created_by, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            kpi.name,
            kpi.description,
            kpi.formula,
            kpi.weight,
            kpi.metric_ids,
            kpi.categories,
            kpi.is_active,
            kpi.created_by
          ]
        );
      } catch (err) {
        console.log(`Could not insert default KPI ${kpi.name}, possibly already exists`);
      }
    }
    
    console.log('Default KPIs created');
    
    // 3. Create default appraisal templates with the KPIs
    const defaultTemplates = [
      {
        name: 'Standard Employee Appraisal',
        description: 'Standard performance evaluation for all employees',
        category: 'General',
        kpi_ids: JSON.stringify([1, 2]), // Overall Performance Score, Reliability Score
        is_active: true,
        created_by: 1
      },
      {
        name: 'Management Appraisal',
        description: 'Performance evaluation for management positions',
        category: 'Management',
        kpi_ids: JSON.stringify([1, 2, 3]), // All KPIs
        is_active: true,
        created_by: 1
      }
    ];

    for (const template of defaultTemplates) {
      try {
        await connection.execute(
          `INSERT IGNORE INTO appraisal_templates (name, description, category, kpi_ids, is_active, created_by, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            template.name,
            template.description,
            template.category,
            template.kpi_ids,
            template.is_active,
            template.created_by
          ]
        );
      } catch (err) {
        console.log(`Could not insert default template ${template.name}, possibly already exists`);
      }
    }
    
    console.log('Default appraisal templates created');
    
    // 4. Create calculation functions that pull from existing data sources
    console.log('Setting up automated calculation system...');
    
    // Create default targets based on existing data
    const defaultTargets = [
      {
        kpi_id: 1, // Overall Performance Score
        employee_id: 0, // Will be assigned to all employees
        department_id: null,
        template_id: 1, // Standard Employee Appraisal
        target_type: 'standard',
        target_value: 85.00, // Standard target is 85%
        period_start: new Date(new Date().getFullYear(), 0, 1), // Start of current year
        period_end: new Date(new Date().getFullYear(), 11, 31), // End of current year
        created_by: 1
      }
    ];
    
    for (const target of defaultTargets) {
      try {
        // We'll create targets for all employees later when we implement batch assignment
        console.log('Default targets prepared for batch assignment');
      } catch (err) {
        console.log(`Could not prepare default target, error:`, err);
      }
    }
    
    console.log('Default metrics, KPIs, and templates have been created and linked to existing data sources!');
    
  } catch (error) {
    console.error('Error creating default metrics and KPIs:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Function to calculate attendance rate from existing attendance data
export async function calculateAttendanceRate(employeeId: number, startDate: Date, endDate: Date): Promise<number> {
  const connection = await pool.getConnection();

  try {
    // Get total working days in the period
    const [totalDaysResult] = await connection.execute(`
      SELECT COUNT(*) as total_days
      FROM attendance
      WHERE user_id = ?
      AND date BETWEEN ? AND ?
      AND status IN ('present', 'late', 'early_departure', 'half_day')
    `, [employeeId, startDate, endDate]);

    const totalDays = (totalDaysResult as any)[0]?.total_days || 0;

    // Get present days
    const [presentDaysResult] = await connection.execute(`
      SELECT COUNT(*) as present_days
      FROM attendance
      WHERE user_id = ?
      AND date BETWEEN ? AND ?
      AND status IN ('present', 'late', 'early_departure', 'half_day')
    `, [employeeId, startDate, endDate]);

    const presentDays = (presentDaysResult as any)[0]?.present_days || 0;

    // Calculate attendance rate
    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    return parseFloat(attendanceRate.toFixed(2));
  } catch (error) {
    console.error('Error calculating attendance rate:', error);
    return 0;
  } finally {
    connection.release();
  }
}

// Function to calculate leave utilization from existing leave data
export async function calculateLeaveUtilization(employeeId: number, startDate: Date, endDate: Date): Promise<number> {
  const connection = await pool.getConnection();

  try {
    // Get total allocated leave days
    const [allocationResult] = await connection.execute(`
      SELECT SUM(allocated_days) as total_allocated
      FROM leave_allocations
      WHERE user_id = ?
      AND cycle_start_date <= ?
      AND cycle_end_date >= ?
    `, [employeeId, endDate, startDate]);

    const totalAllocated = (allocationResult as any)[0]?.total_allocated || 0;

    // Get used leave days
    const [usageResult] = await connection.execute(`
      SELECT SUM(DATEDIFF(end_date, start_date) + 1) as days_used
      FROM leave_history
      WHERE user_id = ?
      AND start_date BETWEEN ? AND ?
      AND end_date BETWEEN ? AND ?
    `, [employeeId, startDate, endDate, startDate, endDate]);

    const daysUsed = (usageResult as any)[0]?.days_used || 0;

    // Calculate utilization rate
    const utilizationRate = totalAllocated > 0 ? (daysUsed / totalAllocated) * 100 : 0;

    return parseFloat(utilizationRate.toFixed(2));
  } catch (error) {
    console.error('Error calculating leave utilization:', error);
    return 0;
  } finally {
    connection.release();
  }
}

// Function to calculate punctuality score from existing attendance data
export async function calculatePunctualityScore(employeeId: number, startDate: Date, endDate: Date): Promise<number> {
  const connection = await pool.getConnection();

  try {
    // Get total attendance records in the period
    const [totalRecordsResult] = await connection.execute(`
      SELECT COUNT(*) as total_records
      FROM attendance
      WHERE user_id = ?
      AND date BETWEEN ? AND ?
      AND check_in_time IS NOT NULL
    `, [employeeId, startDate, endDate]);

    const totalRecords = (totalRecordsResult as any)[0]?.total_records || 0;

    // Get on-time records (assuming standard start time is 9:00 AM)
    const [onTimeResult] = await connection.execute(`
      SELECT COUNT(*) as on_time_records
      FROM attendance
      WHERE user_id = ?
      AND date BETWEEN ? AND ?
      AND check_in_time IS NOT NULL
      AND STR_TO_DATE(CONCAT(date, ' ', check_in_time), '%Y-%m-%d %H:%i:%s') <=
         DATE_ADD(STR_TO_DATE(CONCAT(date, ' 09:00:00'), '%Y-%m-%d %H:%i:%s'), INTERVAL 15 MINUTE)
    `, [employeeId, startDate, endDate]);

    const onTimeRecords = (onTimeResult as any)[0]?.on_time_records || 0;

    // Calculate punctuality rate
    const punctualityRate = totalRecords > 0 ? (onTimeRecords / totalRecords) * 100 : 0;

    return parseFloat(punctualityRate.toFixed(2));
  } catch (error) {
    console.error('Error calculating punctuality score:', error);
    return 0;
  } finally {
    connection.release();
  }
}

// Function to calculate overall performance score
export async function calculateOverallPerformance(employeeId: number, startDate: Date, endDate: Date): Promise<number> {
  const attendanceRate = await calculateAttendanceRate(employeeId, startDate, endDate);
  const leaveUtilization = await calculateLeaveUtilization(employeeId, startDate, endDate);
  const punctualityScore = await calculatePunctualityScore(employeeId, startDate, endDate);
  
  // Simple average for now - could be weighted differently
  const overallScore = (attendanceRate + leaveUtilization + punctualityScore) / 3;
  
  return parseFloat(overallScore.toFixed(2));
}

// Function to calculate reliability score
export async function calculateReliabilityScore(employeeId: number, startDate: Date, endDate: Date): Promise<number> {
  const attendanceRate = await calculateAttendanceRate(employeeId, startDate, endDate);
  const punctualityScore = await calculatePunctualityScore(employeeId, startDate, endDate);
  
  // Weighted average: Attendance 60%, Punctuality 40%
  const reliabilityScore = (attendanceRate * 0.6) + (punctualityScore * 0.4);
  
  return parseFloat(reliabilityScore.toFixed(2));
}

// Function to calculate stability score
export async function calculateStabilityScore(employeeId: number, startDate: Date, endDate: Date): Promise<number> {
  const attendanceRate = await calculateAttendanceRate(employeeId, startDate, endDate);
  const leaveUtilization = await calculateLeaveUtilization(employeeId, startDate, endDate);
  
  // Balanced score: Attendance 50%, Leave Utilization 50%
  const stabilityScore = (attendanceRate * 0.5) + (leaveUtilization * 0.5);
  
  return parseFloat(stabilityScore.toFixed(2));
}

// Function to calculate all KPI scores for an employee
export async function calculateAllKPIScores(employeeId: number, startDate: Date, endDate: Date) {
  const scores = {
    attendanceRate: await calculateAttendanceRate(employeeId, startDate, endDate),
    leaveUtilization: await calculateLeaveUtilization(employeeId, startDate, endDate),
    punctualityScore: await calculatePunctualityScore(employeeId, startDate, endDate),
    overallPerformance: await calculateOverallPerformance(employeeId, startDate, endDate),
    reliabilityScore: await calculateReliabilityScore(employeeId, startDate, endDate),
    stabilityScore: await calculateStabilityScore(employeeId, startDate, endDate)
  };
  
  return scores;
}

// Function to create batch assignments for all employees
export async function batchAssignKPIsToAllEmployees(templateId: number, cycleStartDate: Date, cycleEndDate: Date) {
  const connection = await pool.getConnection();

  try {
    // Get all active employees
    const [employees] = await connection.execute(`
      SELECT s.id as staff_id, u.id as user_id
      FROM staff s
      JOIN users u ON s.user_id = u.id
      WHERE s.status = 'active' AND u.status = 'active'
    `);

    // Get KPIs associated with the template
    const [template] = await connection.execute(`
      SELECT kpi_ids FROM appraisal_templates WHERE id = ?
    `, [templateId]);

    if (!template || (template as any).length === 0) {
      throw new Error(`Template with ID ${templateId} not found`);
    }

    const kpiIds = JSON.parse((template as any)[0].kpi_ids);

    // Assign each KPI to each employee
    for (const employee of employees as any[]) {
      for (const kpiId of kpiIds) {
        // Check if assignment already exists
        const [existingAssignment] = await connection.execute(`
          SELECT id FROM kpi_assignments
          WHERE user_id = ? AND kpi_definition_id = ?
          AND cycle_start_date = ? AND cycle_end_date = ?
        `, [employee.user_id, kpiId, cycleStartDate, cycleEndDate]);

        if (existingAssignment.length === 0) {
          // Create new assignment
          await connection.execute(`
            INSERT INTO kpi_assignments (user_id, kpi_definition_id, cycle_start_date, cycle_end_date, assigned_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())
          `, [employee.user_id, kpiId, cycleStartDate, cycleEndDate, 1]); // Assuming admin user ID is 1
        }
      }
    }

    console.log(`Assigned ${kpiIds.length} KPIs to ${employees.length} employees`);
    return { success: true, employeesProcessed: employees.length, kpisAssigned: kpiIds.length };
  } catch (error) {
    console.error('Error in batch assignment:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Function to run periodic calculations for all employees
export async function runPeriodicCalculations() {
  const connection = await pool.getConnection();

  try {
    // Get current period (could be monthly, quarterly, etc.)
    const startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    // Get all active employees
    const [employees] = await connection.execute(`
      SELECT s.id as staff_id, u.id as user_id
      FROM staff s
      JOIN users u ON s.user_id = u.id
      WHERE s.status = 'active' AND u.status = 'active'
    `);

    // Calculate scores for each employee
    for (const employee of employees as any[]) {
      const scores = await calculateAllKPIScores(employee.user_id, startDate, endDate);

      // Store the calculated scores in the kpi_scores table
      for (const [kpiName, scoreValue] of Object.entries(scores)) {
        // Map KPI name to actual KPI ID
        let kpiId;
        switch(kpiName) {
          case 'attendanceRate':
            kpiId = 1; // Assuming Attendance Rate KPI has ID 1
            break;
          case 'leaveUtilization':
            kpiId = 2; // Assuming Leave Utilization KPI has ID 2
            break;
          case 'punctualityScore':
            kpiId = 4; // Assuming Punctuality Score KPI has ID 4
            break;
          case 'overallPerformance':
            kpiId = 1; // Overall Performance Score
            break;
          case 'reliabilityScore':
            kpiId = 2; // Reliability Score
            break;
          case 'stabilityScore':
            kpiId = 3; // Stability Score
            break;
          default:
            continue;
        }

        // Find the assignment for this KPI and employee
        const [assignment] = await connection.execute(`
          SELECT id FROM kpi_assignments
          WHERE user_id = ? AND kpi_definition_id = ?
          AND cycle_start_date <= ? AND cycle_end_date >= ?
        `, [employee.user_id, kpiId, startDate, endDate]);

        if (assignment.length > 0) {
          const assignmentId = (assignment as any)[0].id;

          // Insert or update the score
          await connection.execute(`
            INSERT INTO kpi_scores (kpi_assignment_id, calculated_value, achievement_percentage, weighted_score, calculated_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, NOW(), NOW(), NOW())
            ON DUPLICATE KEY UPDATE
            calculated_value = VALUES(calculated_value),
            achievement_percentage = VALUES(achievement_percentage),
            weighted_score = VALUES(weighted_score),
            calculated_at = VALUES(calculated_at),
            updated_at = NOW()
          `, [assignmentId, scoreValue, scoreValue, scoreValue]);
        }
      }
    }

    console.log(`Calculated scores for ${employees.length} employees for period ${startDate.toISOString()} to ${endDate.toISOString()}`);
    return { success: true, employeesProcessed: employees.length };
  } catch (error) {
    console.error('Error in periodic calculations:', error);
    throw error;
  } finally {
    connection.release();
  }
}