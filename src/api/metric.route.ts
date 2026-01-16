import express, { Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import { MetricsLibraryModel, MetricsLibrary } from '../models/metrics-library.model';
import UserModel from '../models/user.model';

const router = express.Router();

// GET /api/metrics - List all available metrics
router.get('/', authenticateJWT, checkPermission('metric.read'), async (req: Request, res: Response) => {
  try {
    const metrics = await MetricsLibraryModel.findAll();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch metrics',
      error: (error as Error).message
    });
  }
});

// GET /api/metrics/:id - Get specific metric
router.get('/:id', authenticateJWT, checkPermission('metric.read'), async (req: Request, res: Response) => {
  try {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid metric ID'
      });
    }

    const metric = await MetricsLibraryModel.findById(id);
    if (!metric) {
      return res.status(404).json({
        success: false,
        message: 'Metric not found'
      });
    }

    res.json({
      success: true,
      data: metric
    });
  } catch (error) {
    console.error('Error fetching metric:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch metric',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

// GET /api/metrics/categories/:category - Get metrics for specific category
router.get('/categories/:category', authenticateJWT, checkPermission('metric.read'), async (req: Request, res: Response) => {
  try {
    const categoryParam = Array.isArray(req.params.category) ? req.params.category[0] : req.params.category;
    const category = categoryParam;
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category parameter is required'
      });
    }

    const metrics = await MetricsLibraryModel.findByCategory(category);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error fetching metrics by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch metrics by category',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

// POST /api/metrics - Create new metric
router.post('/', authenticateJWT, checkPermission('metric.create'), async (req: Request, res: Response) => {
  try {
    const { name, description, data_type, formula, data_source, categories } = req.body;

    // Validate required fields
    if (!name || !description || !data_type || !formula || !data_source || !categories) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, description, data_type, formula, data_source, categories'
      });
    }

    // Validate data_type is one of the allowed values
    const validDataTypes: ('numeric' | 'percentage' | 'boolean' | 'rating')[] = ['numeric', 'percentage', 'boolean', 'rating'];
    if (!validDataTypes.includes(data_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data_type. Must be one of: numeric, percentage, boolean, rating'
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

    const newMetric: Omit<MetricsLibrary, 'id' | 'created_at' | 'updated_at'> = {
      name,
      description,
      data_type,
      formula,
      data_source,
      categories,
      is_active: true,
      created_by: req.currentUser!.id
    };

    const createdMetric = await MetricsLibraryModel.create(newMetric);
    
    res.status(201).json({
      success: true,
      message: 'Metric created successfully',
      data: createdMetric
    });
  } catch (error) {
    console.error('Error creating metric:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create metric',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

// PUT /api/metrics/:id - Update metric
router.put('/:id', authenticateJWT, checkPermission('metric.update'), async (req: Request, res: Response) => {
  try {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid metric ID'
      });
    }

    const metric = await MetricsLibraryModel.findById(id);
    if (!metric) {
      return res.status(404).json({
        success: false,
        message: 'Metric not found'
      });
    }

    const updatedFields = req.body;
    // Don't allow updating the created_by field
    delete updatedFields.created_by;

    // Validate data_type if it's being updated
    if (updatedFields.data_type) {
      const validDataTypes: ('numeric' | 'percentage' | 'boolean' | 'rating')[] = ['numeric', 'percentage', 'boolean', 'rating'];
      if (!validDataTypes.includes(updatedFields.data_type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid data_type. Must be one of: numeric, percentage, boolean, rating'
        });
      }
    }

    const success = await MetricsLibraryModel.update(id, updatedFields);
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update metric'
      });
    }

    const updatedMetric = await MetricsLibraryModel.findById(id);

    res.json({
      success: true,
      message: 'Metric updated successfully',
      data: updatedMetric
    });
  } catch (error) {
    console.error('Error updating metric:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update metric',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

// DELETE /api/metrics/:id - Delete metric (soft delete)
router.delete('/:id', authenticateJWT, checkPermission('metric.delete'), async (req: Request, res: Response) => {
  try {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid metric ID'
      });
    }

    const metric = await MetricsLibraryModel.findById(id);
    if (!metric) {
      return res.status(404).json({
        success: false,
        message: 'Metric not found'
      });
    }

    const success = await MetricsLibraryModel.delete(id);
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete metric'
      });
    }

    res.json({
      success: true,
      message: 'Metric deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting metric:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete metric',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

export default router;