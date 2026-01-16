import express, { Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/permission.middleware';
import { AppraisalTemplateModel, AppraisalTemplate } from '../models/appraisal-template.model';
import UserModel from '../models/user.model';

const router = express.Router();

// GET /api/appraisal-templates - List all appraisal templates
router.get('/', authenticateJWT, checkPermission('appraisal_template.read'), async (req: Request, res: Response) => {
  try {
    const templates = await AppraisalTemplateModel.findAll();
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching appraisal templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appraisal templates',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

// GET /api/appraisal-templates/:id - Get specific appraisal template
router.get('/:id', authenticateJWT, checkPermission('appraisal_template.read'), async (req: Request, res: Response) => {
  try {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template ID'
      });
    }

    const template = await AppraisalTemplateModel.findById(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Appraisal template not found'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error fetching appraisal template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appraisal template',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

// GET /api/appraisal-templates/categories/:category - Get templates for specific category
router.get('/categories/:category', authenticateJWT, checkPermission('appraisal_template.read'), async (req: Request, res: Response) => {
  try {
    const categoryParam = Array.isArray(req.params.category) ? req.params.category[0] : req.params.category;
    const category = categoryParam;
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category parameter is required'
      });
    }

    const templates = await AppraisalTemplateModel.findByCategory(category);

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching appraisal templates by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appraisal templates by category',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

// POST /api/appraisal-templates - Create new appraisal template
router.post('/', authenticateJWT, checkPermission('appraisal_template.create'), async (req: Request, res: Response) => {
  try {
    const { name, description, category, kpi_ids } = req.body;

    // Validate required fields
    if (!name || !description || !category || !kpi_ids) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, description, category, kpi_ids'
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

    const newTemplate: Omit<AppraisalTemplate, 'id' | 'created_at' | 'updated_at'> = {
      name,
      description,
      category,
      kpi_ids,
      is_active: true,
      created_by: req.currentUser!.id
    };

    const createdTemplate = await AppraisalTemplateModel.create(newTemplate);

    res.status(201).json({
      success: true,
      message: 'Appraisal template created successfully',
      data: createdTemplate
    });
  } catch (error) {
    console.error('Error creating appraisal template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create appraisal template',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

// PUT /api/appraisal-templates/:id - Update appraisal template
router.put('/:id', authenticateJWT, checkPermission('appraisal_template.update'), async (req: Request, res: Response) => {
  try {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template ID'
      });
    }

    const template = await AppraisalTemplateModel.findById(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Appraisal template not found'
      });
    }

    const updatedFields = req.body;
    // Don't allow updating the created_by field
    delete updatedFields.created_by;

    const success = await AppraisalTemplateModel.update(id, updatedFields);
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update appraisal template'
      });
    }

    const updatedTemplate = await AppraisalTemplateModel.findById(id);

    res.json({
      success: true,
      message: 'Appraisal template updated successfully',
      data: updatedTemplate
    });
  } catch (error) {
    console.error('Error updating appraisal template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appraisal template',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

// DELETE /api/appraisal-templates/:id - Delete appraisal template (soft delete)
router.delete('/:id', authenticateJWT, checkPermission('appraisal_template.delete'), async (req: Request, res: Response) => {
  try {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template ID'
      });
    }

    const template = await AppraisalTemplateModel.findById(id);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Appraisal template not found'
      });
    }

    const success = await AppraisalTemplateModel.delete(id);
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete appraisal template'
      });
    }

    res.json({
      success: true,
      message: 'Appraisal template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting appraisal template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete appraisal template',
      error: (error as Error).message
    });
  }
  return; // Explicitly return to satisfy TypeScript
});

export default router;