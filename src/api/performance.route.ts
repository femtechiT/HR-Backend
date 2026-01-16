import express, { Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import { PerformanceScoreModel, PerformanceScore } from '../models/performance-score.model';
import UserModel from '../models/user.model';

const router = express.Router();

// GET /api/performance/employee/:employeeId - Get performance scores for employee
router.get('/employee/:employeeId', authenticateJWT, checkPermission('performance.read'), async (req: Request, res: Response) => {
  try {
    const employeeIdParam = Array.isArray(req.params.employeeId) ? req.params.employeeId[0] : req.params.employeeId;
    const employeeId = parseInt(employeeIdParam);
    if (isNaN(employeeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID'
      });
    }

    const scores = await PerformanceScoreModel.findByEmployeeId(employeeId);

    res.json({
      success: true,
      data: scores
    });
  } catch (error) {
    console.error('Error fetching performance scores for employee:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance scores for employee',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

// GET /api/performance/template/:templateId - Get scores for specific template
router.get('/template/:templateId', authenticateJWT, checkPermission('performance.read'), async (req: Request, res: Response) => {
  try {
    const templateIdParam = Array.isArray(req.params.templateId) ? req.params.templateId[0] : req.params.templateId;
    const templateId = parseInt(templateIdParam);
    if (isNaN(templateId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template ID'
      });
    }

    const scores = await PerformanceScoreModel.findByTemplateId(templateId);

    res.json({
      success: true,
      data: scores
    });
  } catch (error) {
    console.error('Error fetching performance scores for template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance scores for template',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

// GET /api/performance/categories/:category - Get scores for specific category
router.get('/categories/:category', authenticateJWT, checkPermission('performance.read'), async (req: Request, res: Response) => {
  try {
    const categoryParam = Array.isArray(req.params.category) ? req.params.category[0] : req.params.category;
    const category = categoryParam;
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category parameter is required'
      });
    }

    const scores = await PerformanceScoreModel.findByCategory(category);

    res.json({
      success: true,
      data: scores
    });
  } catch (error) {
    console.error('Error fetching performance scores by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance scores by category',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

// GET /api/performance/period/:startDate/:endDate - Get performance for specific period
router.get('/period/:startDate/:endDate', authenticateJWT, checkPermission('performance.read'), async (req: Request, res: Response) => {
  try {
    const startDateParam = Array.isArray(req.params.startDate) ? req.params.startDate[0] : req.params.startDate;
    const endDateParam = Array.isArray(req.params.endDate) ? req.params.endDate[0] : req.params.endDate;

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    const scores = await PerformanceScoreModel.findByPeriod(startDate, endDate);

    res.json({
      success: true,
      data: scores
    });
  } catch (error) {
    console.error('Error fetching performance scores by period:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance scores by period',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

// POST /api/performance/recalculate - Recalculate scores for all employees
router.post('/recalculate', authenticateJWT, checkPermission('performance.read'), async (req: Request, res: Response) => {
  try {
    // This would typically trigger a background job to recalculate all scores
    // For now, we'll just return a success message indicating the job was queued
    res.json({
      success: true,
      message: 'Performance recalculation job has been queued'
    });
  } catch (error) {
    console.error('Error queuing performance recalculation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to queue performance recalculation',
      error: (error as Error).message
    });
  }
});

// POST /api/performance - Create/update performance score
router.post('/', authenticateJWT, checkPermission('performance.read'), async (req: Request, res: Response) => {
  try {
    const { employee_id, kpi_id, template_id, score, achieved_value, period_start, period_end } = req.body;

    // Validate required fields
    if (!employee_id || !kpi_id || !template_id || score === undefined || achieved_value === undefined || !period_start || !period_end) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: employee_id, kpi_id, template_id, score, achieved_value, period_start, period_end'
      });
    }

    // Validate that the user exists
    const user = await UserModel.findById(req.currentUser!.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const newScore: Omit<PerformanceScore, 'id' | 'calculated_at' | 'created_at' | 'updated_at'> = {
      employee_id,
      kpi_id,
      template_id,
      score,
      achieved_value,
      period_start: new Date(period_start),
      period_end: new Date(period_end),
      calculated_by: req.currentUser!.id
    };

    const createdScore = await PerformanceScoreModel.create(newScore);

    res.status(201).json({
      success: true,
      message: 'Performance score created successfully',
      data: createdScore
    });
  } catch (error) {
    console.error('Error creating performance score:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create performance score',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

export default router;