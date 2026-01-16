import { getConnection } from '../config/database';
import { 
  calculateAllKPIScores, 
  batchAssignKPIsToAllEmployees 
} from './appraisal-calculation.service';

// Service to handle batch assignment of KPIs and targets
export class BatchAssignmentService {
  
  // Assign KPIs to multiple employees at once
  static async assignKPIToMultipleEmployees(employeeIds: number[], kpiId: number, cycleStart: Date, cycleEnd: Date, assignedBy: number) {
    const connection = await getConnection();
    
    try {
      const results = [];
      
      for (const employeeId of employeeIds) {
        // Check if assignment already exists
        const [existingAssignment] = await connection.execute(`
          SELECT id FROM kpi_assignments 
          WHERE user_id = ? AND kpi_definition_id = ? 
          AND cycle_start_date = ? AND cycle_end_date = ?
        `, [employeeId, kpiId, cycleStart, cycleEnd]);
        
        if (existingAssignment.length === 0) {
          // Create new assignment
          const [result] = await connection.execute(`
            INSERT INTO kpi_assignments (user_id, kpi_definition_id, cycle_start_date, cycle_end_date, assigned_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())
          `, [employeeId, kpiId, cycleStart, cycleEnd, assignedBy]);
          
          results.push({
            employeeId,
            kpiId,
            assignmentId: (result as any).insertId,
            status: 'created'
          });
        } else {
          results.push({
            employeeId,
            kpiId,
            assignmentId: (existingAssignment as any)[0].id,
            status: 'already_exists'
          });
        }
      }
      
      return {
        success: true,
        message: `Successfully processed assignments for ${results.length} employees`,
        results
      };
    } catch (error) {
      console.error('Error in batch KPI assignment:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // Assign targets to multiple employees at once
  static async assignTargetToMultipleEmployees(employeeIds: number[], targetData: {
    kpi_id: number;
    department_id?: number;
    template_id?: number;
    target_type: 'minimum' | 'standard' | 'stretch';
    target_value: number;
    period_start: Date;
    period_end: Date;
  }, createdBy: number) {
    const connection = await getConnection();
    
    try {
      const results = [];
      
      for (const employeeId of employeeIds) {
        const newTarget = {
          ...targetData,
          employee_id: employeeId,
          created_by: createdBy
        };
        
        // Check if target already exists for this employee and KPI in the same period
        const [existingTarget] = await connection.execute(`
          SELECT id FROM targets 
          WHERE employee_id = ? AND kpi_id = ? 
          AND period_start = ? AND period_end = ?
        `, [employeeId, newTarget.kpi_id, newTarget.period_start, newTarget.period_end]);
        
        if (existingTarget.length === 0) {
          // Create new target
          const [result] = await connection.execute(`
            INSERT INTO targets (kpi_id, employee_id, department_id, template_id, target_type, target_value, period_start, period_end, created_by, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          `, [
            newTarget.kpi_id,
            newTarget.employee_id,
            newTarget.department_id || null,
            newTarget.template_id || null,
            newTarget.target_type,
            newTarget.target_value,
            newTarget.period_start,
            newTarget.period_end,
            newTarget.created_by
          ]);
          
          results.push({
            employeeId,
            kpiId: newTarget.kpi_id,
            targetId: (result as any).insertId,
            status: 'created'
          });
        } else {
          results.push({
            employeeId,
            kpiId: newTarget.kpi_id,
            targetId: (existingTarget as any)[0].id,
            status: 'already_exists'
          });
        }
      }
      
      return {
        success: true,
        message: `Successfully processed targets for ${results.length} employees`,
        results
      };
    } catch (error) {
      console.error('Error in batch target assignment:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // Calculate scores for multiple employees
  static async calculateScoresForMultipleEmployees(employeeIds: number[], startDate: Date, endDate: Date) {
    const connection = await getConnection();
    
    try {
      const results = [];
      
      for (const employeeId of employeeIds) {
        try {
          // Calculate all KPI scores for the employee
          const scores = await calculateAllKPIScores(employeeId, startDate, endDate);
          
          // Store the calculated scores in the performance_scores table
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
            
            // Find the template ID for this employee (could be based on department, role, etc.)
            const [templateResult] = await connection.execute(`
              SELECT at.id as template_id
              FROM appraisal_templates at
              JOIN staff s ON s.designation LIKE CONCAT('%', at.category, '%') OR at.category = 'General'
              WHERE s.user_id = ?
              LIMIT 1
            `, [employeeId]);
            
            const templateId = templateResult.length > 0 ? (templateResult[0] as any).template_id : 1; // Default to template 1
            
            // Insert the performance score
            await connection.execute(`
              INSERT INTO performance_scores (employee_id, kpi_id, template_id, score, achieved_value, period_start, period_end, calculated_at, calculated_by, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW(), NOW())
            `, [employeeId, kpiId, templateId, scoreValue, scoreValue, startDate, endDate, 1]); // Assuming calculated by admin (ID 1)
          }
          
          results.push({
            employeeId,
            scores,
            status: 'calculated'
          });
        } catch (scoreError) {
          console.error(`Error calculating scores for employee ${employeeId}:`, scoreError);
          results.push({
            employeeId,
            error: scoreError instanceof Error ? scoreError.message : 'Unknown error',
            status: 'error'
          });
        }
      }
      
      return {
        success: true,
        message: `Successfully processed score calculations for ${results.length} employees`,
        results
      };
    } catch (error) {
      console.error('Error in batch score calculation:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // Assign appraisal cycles to multiple employees
  static async assignAppraisalCycleToMultipleEmployees(employeeIds: number[], cycleData: {
    name: string;
    description: string;
    template_id: number;
    start_date: Date;
    end_date: Date;
    status: 'draft' | 'active' | 'completed' | 'cancelled';
  }, createdBy: number) {
    const connection = await getConnection();
    
    try {
      const results = [];
      
      // First, create the appraisal cycle
      const [cycleResult] = await connection.execute(`
        INSERT INTO appraisal_cycles (name, description, template_id, start_date, end_date, status, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        cycleData.name,
        cycleData.description,
        cycleData.template_id,
        cycleData.start_date,
        cycleData.end_date,
        cycleData.status,
        createdBy
      ]);
      
      const cycleId = (cycleResult as any).insertId;
      
      // Then, assign the cycle to each employee
      for (const employeeId of employeeIds) {
        // Check if assignment already exists
        const [existingAssignment] = await connection.execute(`
          SELECT id FROM appraisal_assignments 
          WHERE employee_id = ? AND appraisal_cycle_id = ?
        `, [employeeId, cycleId]);
        
        if (existingAssignment.length === 0) {
          // Create new assignment
          const [assignmentResult] = await connection.execute(`
            INSERT INTO appraisal_assignments (employee_id, appraisal_cycle_id, status, assigned_by, assigned_at, created_at, updated_at)
            VALUES (?, ?, 'pending', ?, NOW(), NOW(), NOW())
          `, [employeeId, cycleId, createdBy]);
          
          results.push({
            employeeId,
            appraisalCycleId: cycleId,
            assignmentId: (assignmentResult as any).insertId,
            status: 'created'
          });
        } else {
          results.push({
            employeeId,
            appraisalCycleId: cycleId,
            assignmentId: (existingAssignment as any)[0].id,
            status: 'already_exists'
          });
        }
      }
      
      return {
        success: true,
        message: `Successfully created appraisal cycle and assigned to ${results.length} employees`,
        appraisalCycleId: cycleId,
        results
      };
    } catch (error) {
      console.error('Error in batch appraisal cycle assignment:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

// Service to handle self-assessment functionality
export class SelfAssessmentService {
  
  // Create self-assessment KPIs that employees can update
  static async createSelfAssessmentKPIs() {
    const connection = await getConnection();
    
    try {
      // Create KPIs specifically designed for self-assessment
      const selfAssessmentKPIs = [
        {
          name: 'Self-Evaluation: Communication Skills',
          description: 'Employee\'s self-rating of communication abilities',
          formula: 'self_rated_score',
          weight: 10.00,
          metric_ids: JSON.stringify([]), // No metrics needed for self-assessment
          categories: JSON.stringify(['Teacher', 'Sales', 'Inventory', 'Technician']),
          is_active: true,
          created_by: 1,
          is_self_assessment: true // New field to identify self-assessment KPIs
        },
        {
          name: 'Self-Evaluation: Teamwork & Collaboration',
          description: 'Employee\'s self-rating of teamwork abilities',
          formula: 'self_rated_score',
          weight: 10.00,
          metric_ids: JSON.stringify([]),
          categories: JSON.stringify(['Teacher', 'Sales', 'Inventory', 'Technician']),
          is_active: true,
          created_by: 1,
          is_self_assessment: true
        },
        {
          name: 'Self-Evaluation: Problem-Solving Skills',
          description: 'Employee\'s self-rating of problem-solving abilities',
          formula: 'self_rated_score',
          weight: 10.00,
          metric_ids: JSON.stringify([]),
          categories: JSON.stringify(['Teacher', 'Sales', 'Inventory', 'Technician']),
          is_active: true,
          created_by: 1,
          is_self_assessment: true
        },
        {
          name: 'Self-Evaluation: Initiative & Innovation',
          description: 'Employee\'s self-rating of initiative and innovation',
          formula: 'self_rated_score',
          weight: 10.00,
          metric_ids: JSON.stringify([]),
          categories: JSON.stringify(['Teacher', 'Sales', 'Inventory', 'Technician']),
          is_active: true,
          created_by: 1,
          is_self_assessment: true
        }
      ];
      
      const results = [];
      
      for (const kpi of selfAssessmentKPIs) {
        // Check if KPI already exists
        const [existingKPI] = await connection.execute(`
          SELECT id FROM kpi_definitions 
          WHERE name = ? AND is_self_assessment = TRUE
        `, [kpi.name]);
        
        if (existingKPI.length === 0) {
          // Create new self-assessment KPI
          const [result] = await connection.execute(`
            INSERT INTO kpi_definitions (name, description, formula, weight, metric_ids, categories, is_active, created_by, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          `, [
            kpi.name,
            kpi.description,
            kpi.formula,
            kpi.weight,
            kpi.metric_ids,
            kpi.categories,
            kpi.is_active,
            kpi.created_by
          ]);
          
          results.push({
            name: kpi.name,
            id: (result as any).insertId,
            status: 'created'
          });
        } else {
          results.push({
            name: kpi.name,
            id: (existingKPI as any)[0].id,
            status: 'already_exists'
          });
        }
      }
      
      return {
        success: true,
        message: `Successfully created ${results.length} self-assessment KPIs`,
        results
      };
    } catch (error) {
      console.error('Error creating self-assessment KPIs:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // Submit self-assessment for an employee
  static async submitSelfAssessment(employeeId: number, assessmentData: {
    kpi_assignment_id: number;
    self_rating: number; // 1-5 scale or percentage
    comments?: string;
  }) {
    const connection = await getConnection();
    
    try {
      // Verify that the assignment belongs to the employee and is a self-assessment KPI
      const [assignment] = await connection.execute(`
        SELECT ka.*, kd.is_self_assessment
        FROM kpi_assignments ka
        JOIN kpi_definitions kd ON ka.kpi_definition_id = kd.id
        WHERE ka.id = ? AND ka.user_id = ?
      `, [assessmentData.kpi_assignment_id, employeeId]);
      
      if (assignment.length === 0) {
        throw new Error('KPI assignment not found or does not belong to employee');
      }
      
      if (!(assignment[0] as any).is_self_assessment) {
        throw new Error('This KPI is not designated for self-assessment');
      }
      
      // Update the KPI score with the self-assessment
      const [result] = await connection.execute(`
        INSERT INTO kpi_scores (kpi_assignment_id, calculated_value, achievement_percentage, weighted_score, calculated_at, manually_overridden, override_value, override_reason, override_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, NOW(), TRUE, ?, 'Self Assessment', ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
        calculated_value = VALUES(override_value),
        achievement_percentage = VALUES(override_value),
        weighted_score = VALUES(override_value),
        manually_overridden = VALUES(manually_overridden),
        override_value = VALUES(override_value),
        override_reason = VALUES(override_reason),
        override_by = VALUES(override_by),
        updated_at = NOW()
      `, [
        assessmentData.kpi_assignment_id,
        assessmentData.self_rating,
        assessmentData.self_rating,
        assessmentData.self_rating,
        assessmentData.self_rating,
        employeeId
      ]);
      
      return {
        success: true,
        message: 'Self-assessment submitted successfully',
        scoreId: (result as any).insertId
      };
    } catch (error) {
      console.error('Error submitting self-assessment:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
  
  // Get self-assessment for an employee
  static async getSelfAssessment(employeeId: number, kpiAssignmentId: number) {
    const connection = await getConnection();
    
    try {
      const [scores] = await connection.execute(`
        SELECT ks.*
        FROM kpi_scores ks
        JOIN kpi_assignments ka ON ks.kpi_assignment_id = ka.id
        WHERE ka.id = ? AND ka.user_id = ? AND ks.manually_overridden = TRUE
      `, [kpiAssignmentId, employeeId]);
      
      return {
        success: true,
        data: scores.length > 0 ? scores[0] : null
      };
    } catch (error) {
      console.error('Error getting self-assessment:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}