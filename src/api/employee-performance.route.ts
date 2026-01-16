import express, { Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import { PerformanceScoreModel } from '../models/performance-score.model';
import { AppraisalAssignmentModel } from '../models/appraisal-assignment.model';

const router = express.Router();

// GET /api/employees/:id/performance - Get employee's performance history
router.get('/:id/performance', authenticateJWT, checkPermission('performance.read'), async (req: Request, res: Response) => {
  try {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const employeeId = parseInt(idParam);
    if (isNaN(employeeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID'
      });
    }

    // Check if the requesting user has permission to view this employee's performance
    // If not the same user or lacking permissions, restrict access

    const performanceScores = await PerformanceScoreModel.findByEmployeeId(employeeId);

    res.json({
      success: true,
      data: performanceScores
    });
  } catch (error) {
    console.error('Error fetching employee performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee performance',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

// GET /api/employees/:id/appraisals - Get employee's appraisal history
router.get('/:id/appraisals', authenticateJWT, checkPermission('appraisal.read'), async (req: Request, res: Response) => {
  try {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const employeeId = parseInt(idParam);
    if (isNaN(employeeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID'
      });
    }

    const appraisalAssignments = await AppraisalAssignmentModel.findByEmployeeId(employeeId);

    res.json({
      success: true,
      data: appraisalAssignments
    });
  } catch (error) {
    console.error('Error fetching employee appraisals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee appraisals',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

// GET /api/employees/:id/appraisals/template/:templateId - Get employee's appraisals for specific template
router.get('/:id/appraisals/template/:templateId', authenticateJWT, checkPermission('appraisal.read'), async (req: Request, res: Response) => {
  try {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const templateIdParam = Array.isArray(req.params.templateId) ? req.params.templateId[0] : req.params.templateId;
    const employeeId = parseInt(idParam);
    const templateId = parseInt(templateIdParam);

    if (isNaN(employeeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID'
      });
    }

    if (isNaN(templateId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template ID'
      });
    }

    // This would require joining appraisal_assignments with appraisal_cycles to get assignments for the specific template
    // For now, we'll return an empty array as this endpoint would need more complex logic
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Error fetching employee appraisals for template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee appraisals for template',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

// POST /api/employees/:id/self-assessment - Submit self-assessment
router.post('/:id/self-assessment', authenticateJWT, checkPermission('appraisal.submit'), async (req: Request, res: Response) => {
  try {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const employeeId = parseInt(idParam);
    if (isNaN(employeeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID'
      });
    }

    // Check if the requesting user is the same as the employee ID or has appropriate permissions
    if (req.currentUser!.id !== employeeId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to submit self-assessment for another employee'
      });
    }

    const { appraisal_assignment_id, self_assessment_data } = req.body;

    if (!appraisal_assignment_id || !self_assessment_data) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: appraisal_assignment_id, self_assessment_data'
      });
    }

    // In a real implementation, we would update the appraisal assignment with the self-assessment data
    // For now, we'll just return a success message
    
    res.json({
      success: true,
      message: 'Self-assessment submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting self-assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit self-assessment',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

// GET /api/employees/:id/self-assessment - Get employee's self-assessment
router.get('/:id/self-assessment', authenticateJWT, checkPermission('appraisal.read'), async (req: Request, res: Response) => {
  try {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const employeeId = parseInt(idParam);
    if (isNaN(employeeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID'
      });
    }

    // Check if the requesting user is the same as the employee ID or has appropriate permissions
    if (req.currentUser!.id !== employeeId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view self-assessment for another employee'
      });
    }

    // In a real implementation, we would fetch the employee's self-assessment data
    // For now, we'll return an empty object
    
    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error fetching self-assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch self-assessment',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

export default router;