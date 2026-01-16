import express, { Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import { AppraisalCycleModel, AppraisalCycle } from '../models/appraisal-cycle.model';
import UserModel from '../models/user.model';

const router = express.Router();

// GET /api/appraisals - List all appraisal cycles
router.get('/', authenticateJWT, checkPermission('appraisal.read'), async (req: Request, res: Response) => {
  try {
    const appraisals = await AppraisalCycleModel.findAll();
    res.json({
      success: true,
      data: appraisals
    });
  } catch (error) {
    console.error('Error fetching appraisal cycles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appraisal cycles',
      error: (error as Error).message
    });
  }
});

// GET /api/appraisals/:id - Get specific appraisal cycle
router.get('/:id', authenticateJWT, checkPermission('appraisal.read'), async (req: Request, res: Response) => {
  try {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appraisal cycle ID'
      });
    }

    const appraisal = await AppraisalCycleModel.findById(id);
    if (!appraisal) {
      return res.status(404).json({
        success: false,
        message: 'Appraisal cycle not found'
      });
    }

    res.json({
      success: true,
      data: appraisal
    });
  } catch (error) {
    console.error('Error fetching appraisal cycle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appraisal cycle',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

// GET /api/appraisals/template/:templateId - Get appraisals for specific template
router.get('/template/:templateId', authenticateJWT, checkPermission('appraisal.read'), async (req: Request, res: Response) => {
  try {
    const templateIdParam = Array.isArray(req.params.templateId) ? req.params.templateId[0] : req.params.templateId;
    const templateId = parseInt(templateIdParam);
    if (isNaN(templateId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template ID'
      });
    }

    const appraisals = await AppraisalCycleModel.findByTemplateId(templateId);

    res.json({
      success: true,
      data: appraisals
    });
  } catch (error) {
    console.error('Error fetching appraisals for template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appraisals for template',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

// GET /api/appraisals/categories/:category - Get appraisals for specific category
router.get('/categories/:category', authenticateJWT, checkPermission('appraisal.read'), async (req: Request, res: Response) => {
  try {
    const categoryParam = Array.isArray(req.params.category) ? req.params.category[0] : req.params.category;
    const category = categoryParam;
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category parameter is required'
      });
    }

    // This would require joining with appraisal_templates table
    // For now, we'll return an empty array as this endpoint would need more complex logic
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Error fetching appraisals by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appraisals by category',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

// POST /api/appraisals - Create new appraisal cycle
router.post('/', authenticateJWT, checkPermission('appraisal.create'), async (req: Request, res: Response) => {
  try {
    const { name, description, template_id, start_date, end_date, status } = req.body;

    // Validate required fields
    if (!name || !template_id || !start_date || !end_date || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, template_id, start_date, end_date, status'
      });
    }

    // Validate status is one of the allowed values
    const validStatuses: ('draft' | 'active' | 'completed' | 'cancelled')[] = ['draft', 'active', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: draft, active, completed, cancelled'
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

    const newAppraisal: Omit<AppraisalCycle, 'id' | 'created_at' | 'updated_at'> = {
      name,
      description,
      template_id,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      status,
      created_by: req.currentUser!.id
    };

    const createdAppraisal = await AppraisalCycleModel.create(newAppraisal);
    
    res.status(201).json({
      success: true,
      message: 'Appraisal cycle created successfully',
      data: createdAppraisal
    });
  } catch (error) {
    console.error('Error creating appraisal cycle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create appraisal cycle',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

// PUT /api/appraisals/:id - Update appraisal cycle
router.put('/:id', authenticateJWT, checkPermission('appraisal.update'), async (req: Request, res: Response) => {
  try {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appraisal cycle ID'
      });
    }

    const appraisal = await AppraisalCycleModel.findById(id);
    if (!appraisal) {
      return res.status(404).json({
        success: false,
        message: 'Appraisal cycle not found'
      });
    }

    const updatedFields = req.body;
    // Don't allow updating the created_by field
    delete updatedFields.created_by;

    // Validate status if it's being updated
    if (updatedFields.status) {
      const validStatuses: ('draft' | 'active' | 'completed' | 'cancelled')[] = ['draft', 'active', 'completed', 'cancelled'];
      if (!validStatuses.includes(updatedFields.status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: draft, active, completed, cancelled'
        });
      }
    }

    // Convert dates if they're being updated
    if (updatedFields.start_date) {
      updatedFields.start_date = new Date(updatedFields.start_date);
    }
    if (updatedFields.end_date) {
      updatedFields.end_date = new Date(updatedFields.end_date);
    }

    const success = await AppraisalCycleModel.update(id, updatedFields);
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update appraisal cycle'
      });
    }

    const updatedAppraisal = await AppraisalCycleModel.findById(id);

    res.json({
      success: true,
      message: 'Appraisal cycle updated successfully',
      data: updatedAppraisal
    });
  } catch (error) {
    console.error('Error updating appraisal cycle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appraisal cycle',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

// POST /api/appraisals/:id/start - Start appraisal cycle
router.post('/:id/start', authenticateJWT, checkPermission('appraisal.update'), async (req: Request, res: Response) => {
  try {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appraisal cycle ID'
      });
    }

    const appraisal = await AppraisalCycleModel.findById(id);
    if (!appraisal) {
      return res.status(404).json({
        success: false,
        message: 'Appraisal cycle not found'
      });
    }

    // Only allow starting if the cycle is currently in draft status
    if (appraisal.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Cannot start appraisal cycle that is not in draft status'
      });
    }

    const success = await AppraisalCycleModel.update(id, { status: 'active' });
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to start appraisal cycle'
      });
    }

    const updatedAppraisal = await AppraisalCycleModel.findById(id);

    res.json({
      success: true,
      message: 'Appraisal cycle started successfully',
      data: updatedAppraisal
    });
  } catch (error) {
    console.error('Error starting appraisal cycle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start appraisal cycle',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

// POST /api/appraisals/:id/end - End appraisal cycle
router.post('/:id/end', authenticateJWT, checkPermission('appraisal.update'), async (req: Request, res: Response) => {
  try {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appraisal cycle ID'
      });
    }

    const appraisal = await AppraisalCycleModel.findById(id);
    if (!appraisal) {
      return res.status(404).json({
        success: false,
        message: 'Appraisal cycle not found'
      });
    }

    // Only allow ending if the cycle is currently active
    if (appraisal.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot end appraisal cycle that is not active'
      });
    }

    const success = await AppraisalCycleModel.update(id, { status: 'completed' });
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to end appraisal cycle'
      });
    }

    const updatedAppraisal = await AppraisalCycleModel.findById(id);

    res.json({
      success: true,
      message: 'Appraisal cycle ended successfully',
      data: updatedAppraisal
    });
  } catch (error) {
    console.error('Error ending appraisal cycle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end appraisal cycle',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

// DELETE /api/appraisals/:id - Delete appraisal cycle
router.delete('/:id', authenticateJWT, checkPermission('appraisal.delete'), async (req: Request, res: Response) => {
  try {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appraisal cycle ID'
      });
    }

    const appraisal = await AppraisalCycleModel.findById(id);
    if (!appraisal) {
      return res.status(404).json({
        success: false,
        message: 'Appraisal cycle not found'
      });
    }

    const success = await AppraisalCycleModel.delete(id);
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete appraisal cycle'
      });
    }

    res.json({
      success: true,
      message: 'Appraisal cycle deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting appraisal cycle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete appraisal cycle',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

export default router;