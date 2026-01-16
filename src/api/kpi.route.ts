import express, { Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import { KpiDefinitionModel, KpiDefinition } from '../models/kpi-definition.model';
import UserModel from '../models/user.model';

const router = express.Router();

// GET /api/kpis - List all KPI definitions
router.get('/', authenticateJWT, checkPermission('kpi.read'), async (req: Request, res: Response) => {
  try {
    const kpis = await KpiDefinitionModel.findAll();
    res.json({
      success: true,
      data: kpis
    });
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch KPIs',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

// GET /api/kpis/:id - Get specific KPI
router.get('/:id', authenticateJWT, checkPermission('kpi.read'), async (req: Request, res: Response) => {
  try {
    const idParam = typeof req.params.id === 'string' ? req.params.id : '';
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid KPI ID'
      });
    }

    const kpi = await KpiDefinitionModel.findById(id);
    if (!kpi) {
      return res.status(404).json({
        success: false,
        message: 'KPI not found'
      });
    }

    res.json({
      success: true,
      data: kpi
    });
  } catch (error) {
    console.error('Error fetching KPI:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch KPI',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

// GET /api/kpis/categories/:category - Get KPIs for specific category
router.get('/categories/:category', authenticateJWT, checkPermission('kpi.read'), async (req: Request, res: Response) => {
  try {
    const category = typeof req.params.category === 'string' ? req.params.category : '';
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category parameter is required'
      });
    }

    const kpis = await KpiDefinitionModel.findByCategory(category);

    res.json({
      success: true,
      data: kpis
    });
  } catch (error) {
    console.error('Error fetching KPIs by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch KPIs by category',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

// POST /api/kpis - Create new KPI
router.post('/', authenticateJWT, checkPermission('kpi.create'), async (req: Request, res: Response) => {
  try {
    const { name, description, formula, weight, metric_ids, categories } = req.body;

    // Validate required fields
    if (!name || !description || !formula || weight === undefined || !metric_ids || !categories) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, description, formula, weight, metric_ids, categories'
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

    const newKpi: Omit<KpiDefinition, 'id' | 'created_at' | 'updated_at'> = {
      name,
      description,
      formula,
      weight,
      metric_ids,
      categories,
      is_active: true,
      created_by: req.currentUser!.id
    };

    const createdKpi = await KpiDefinitionModel.create(newKpi);
    
    res.status(201).json({
      success: true,
      message: 'KPI created successfully',
      data: createdKpi
    });
  } catch (error) {
    console.error('Error creating KPI:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create KPI',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

// PUT /api/kpis/:id - Update KPI
router.put('/:id', authenticateJWT, checkPermission('kpi.update'), async (req: Request, res: Response) => {
  try {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid KPI ID'
      });
    }

    const kpi = await KpiDefinitionModel.findById(id);
    if (!kpi) {
      return res.status(404).json({
        success: false,
        message: 'KPI not found'
      });
    }

    const updatedFields = req.body;
    // Don't allow updating the created_by field
    delete updatedFields.created_by;

    const success = await KpiDefinitionModel.update(id, updatedFields);
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update KPI'
      });
    }

    const updatedKpi = await KpiDefinitionModel.findById(id);

    res.json({
      success: true,
      message: 'KPI updated successfully',
      data: updatedKpi
    });
  } catch (error) {
    console.error('Error updating KPI:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update KPI',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

// DELETE /api/kpis/:id - Delete KPI (soft delete)
router.delete('/:id', authenticateJWT, checkPermission('kpi.delete'), async (req: Request, res: Response) => {
  try {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid KPI ID'
      });
    }

    const kpi = await KpiDefinitionModel.findById(id);
    if (!kpi) {
      return res.status(404).json({
        success: false,
        message: 'KPI not found'
      });
    }

    const success = await KpiDefinitionModel.delete(id);
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete KPI'
      });
    }

    res.json({
      success: true,
      message: 'KPI deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting KPI:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete KPI',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

export default router;