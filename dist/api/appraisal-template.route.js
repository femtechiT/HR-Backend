"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const appraisal_template_model_1 = require("../models/appraisal-template.model");
const user_model_1 = __importDefault(require("../models/user.model"));
const router = express_1.default.Router();
router.get('/', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('appraisal_template:read'), async (req, res) => {
    try {
        const templates = await appraisal_template_model_1.AppraisalTemplateModel.findAll();
        res.json({
            success: true,
            data: templates
        });
    }
    catch (error) {
        console.error('Error fetching appraisal templates:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch appraisal templates',
            error: error.message
        });
    }
    return;
});
router.get('/:id', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('appraisal_template:read'), async (req, res) => {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const id = parseInt(idParam);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid template ID'
            });
        }
        const template = await appraisal_template_model_1.AppraisalTemplateModel.findById(id);
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
    }
    catch (error) {
        console.error('Error fetching appraisal template:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch appraisal template',
            error: error.message
        });
    }
    return;
});
router.get('/categories/:category', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('appraisal_template:read'), async (req, res) => {
    try {
        const categoryParam = Array.isArray(req.params.category) ? req.params.category[0] : req.params.category;
        const category = categoryParam;
        if (!category) {
            return res.status(400).json({
                success: false,
                message: 'Category parameter is required'
            });
        }
        const templates = await appraisal_template_model_1.AppraisalTemplateModel.findByCategory(category);
        res.json({
            success: true,
            data: templates
        });
    }
    catch (error) {
        console.error('Error fetching appraisal templates by category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch appraisal templates by category',
            error: error.message
        });
    }
    return;
});
router.post('/', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('appraisal_template.create'), async (req, res) => {
    try {
        const { name, description, category, kpi_ids } = req.body;
        if (!name || !description || !category || !kpi_ids) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: name, description, category, kpi_ids'
            });
        }
        const user = await user_model_1.default.findById(req.currentUser.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const newTemplate = {
            name,
            description,
            category,
            kpi_ids,
            is_active: true,
            created_by: req.currentUser.id
        };
        const createdTemplate = await appraisal_template_model_1.AppraisalTemplateModel.create(newTemplate);
        res.status(201).json({
            success: true,
            message: 'Appraisal template created successfully',
            data: createdTemplate
        });
    }
    catch (error) {
        console.error('Error creating appraisal template:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create appraisal template',
            error: error.message
        });
    }
    return;
});
router.put('/:id', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('appraisal_template.update'), async (req, res) => {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const id = parseInt(idParam);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid template ID'
            });
        }
        const template = await appraisal_template_model_1.AppraisalTemplateModel.findById(id);
        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Appraisal template not found'
            });
        }
        const updatedFields = req.body;
        delete updatedFields.created_by;
        const success = await appraisal_template_model_1.AppraisalTemplateModel.update(id, updatedFields);
        if (!success) {
            return res.status(400).json({
                success: false,
                message: 'Failed to update appraisal template'
            });
        }
        const updatedTemplate = await appraisal_template_model_1.AppraisalTemplateModel.findById(id);
        res.json({
            success: true,
            message: 'Appraisal template updated successfully',
            data: updatedTemplate
        });
    }
    catch (error) {
        console.error('Error updating appraisal template:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update appraisal template',
            error: error.message
        });
    }
    return;
});
router.delete('/:id', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('appraisal_template.delete'), async (req, res) => {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const id = parseInt(idParam);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid template ID'
            });
        }
        const template = await appraisal_template_model_1.AppraisalTemplateModel.findById(id);
        if (!template) {
            return res.status(404).json({
                success: false,
                message: 'Appraisal template not found'
            });
        }
        const success = await appraisal_template_model_1.AppraisalTemplateModel.delete(id);
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
    }
    catch (error) {
        console.error('Error deleting appraisal template:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete appraisal template',
            error: error.message
        });
    }
    return;
});
exports.default = router;
//# sourceMappingURL=appraisal-template.route.js.map