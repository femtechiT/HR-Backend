"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const appraisal_cycle_model_1 = require("../models/appraisal-cycle.model");
const user_model_1 = __importDefault(require("../models/user.model"));
const router = express_1.default.Router();
router.get('/', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('appraisal:read'), async (req, res) => {
    try {
        const appraisals = await appraisal_cycle_model_1.AppraisalCycleModel.findAll();
        res.json({
            success: true,
            data: appraisals
        });
    }
    catch (error) {
        console.error('Error fetching appraisal cycles:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch appraisal cycles',
            error: error.message
        });
    }
});
router.get('/:id', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('appraisal:read'), async (req, res) => {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const id = parseInt(idParam);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid appraisal cycle ID'
            });
        }
        const appraisal = await appraisal_cycle_model_1.AppraisalCycleModel.findById(id);
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
    }
    catch (error) {
        console.error('Error fetching appraisal cycle:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch appraisal cycle',
            error: error.message
        });
    }
    return;
});
router.get('/template/:templateId', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('appraisal:read'), async (req, res) => {
    try {
        const templateIdParam = Array.isArray(req.params.templateId) ? req.params.templateId[0] : req.params.templateId;
        const templateId = parseInt(templateIdParam);
        if (isNaN(templateId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid template ID'
            });
        }
        const appraisals = await appraisal_cycle_model_1.AppraisalCycleModel.findByTemplateId(templateId);
        res.json({
            success: true,
            data: appraisals
        });
    }
    catch (error) {
        console.error('Error fetching appraisals for template:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch appraisals for template',
            error: error.message
        });
    }
    return;
});
router.get('/categories/:category', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('appraisal:read'), async (req, res) => {
    try {
        const categoryParam = Array.isArray(req.params.category) ? req.params.category[0] : req.params.category;
        const category = categoryParam;
        if (!category) {
            return res.status(400).json({
                success: false,
                message: 'Category parameter is required'
            });
        }
        res.json({
            success: true,
            data: []
        });
    }
    catch (error) {
        console.error('Error fetching appraisals by category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch appraisals by category',
            error: error.message
        });
    }
    return;
});
router.post('/', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('appraisal.create'), async (req, res) => {
    try {
        const { name, description, template_id, start_date, end_date, status } = req.body;
        if (!name || !template_id || !start_date || !end_date || !status) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: name, template_id, start_date, end_date, status'
            });
        }
        const validStatuses = ['draft', 'active', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be one of: draft, active, completed, cancelled'
            });
        }
        const user = await user_model_1.default.findById(req.currentUser.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const newAppraisal = {
            name,
            description,
            template_id,
            start_date: new Date(start_date),
            end_date: new Date(end_date),
            status,
            created_by: req.currentUser.id
        };
        const createdAppraisal = await appraisal_cycle_model_1.AppraisalCycleModel.create(newAppraisal);
        res.status(201).json({
            success: true,
            message: 'Appraisal cycle created successfully',
            data: createdAppraisal
        });
    }
    catch (error) {
        console.error('Error creating appraisal cycle:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create appraisal cycle',
            error: error.message
        });
    }
    return;
});
router.put('/:id', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('appraisal.update'), async (req, res) => {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const id = parseInt(idParam);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid appraisal cycle ID'
            });
        }
        const appraisal = await appraisal_cycle_model_1.AppraisalCycleModel.findById(id);
        if (!appraisal) {
            return res.status(404).json({
                success: false,
                message: 'Appraisal cycle not found'
            });
        }
        const updatedFields = req.body;
        delete updatedFields.created_by;
        if (updatedFields.status) {
            const validStatuses = ['draft', 'active', 'completed', 'cancelled'];
            if (!validStatuses.includes(updatedFields.status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status. Must be one of: draft, active, completed, cancelled'
                });
            }
        }
        if (updatedFields.start_date) {
            updatedFields.start_date = new Date(updatedFields.start_date);
        }
        if (updatedFields.end_date) {
            updatedFields.end_date = new Date(updatedFields.end_date);
        }
        const success = await appraisal_cycle_model_1.AppraisalCycleModel.update(id, updatedFields);
        if (!success) {
            return res.status(400).json({
                success: false,
                message: 'Failed to update appraisal cycle'
            });
        }
        const updatedAppraisal = await appraisal_cycle_model_1.AppraisalCycleModel.findById(id);
        res.json({
            success: true,
            message: 'Appraisal cycle updated successfully',
            data: updatedAppraisal
        });
    }
    catch (error) {
        console.error('Error updating appraisal cycle:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update appraisal cycle',
            error: error.message
        });
    }
    return;
});
router.post('/:id/start', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('appraisal.update'), async (req, res) => {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const id = parseInt(idParam);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid appraisal cycle ID'
            });
        }
        const appraisal = await appraisal_cycle_model_1.AppraisalCycleModel.findById(id);
        if (!appraisal) {
            return res.status(404).json({
                success: false,
                message: 'Appraisal cycle not found'
            });
        }
        if (appraisal.status !== 'draft') {
            return res.status(400).json({
                success: false,
                message: 'Cannot start appraisal cycle that is not in draft status'
            });
        }
        const success = await appraisal_cycle_model_1.AppraisalCycleModel.update(id, { status: 'active' });
        if (!success) {
            return res.status(400).json({
                success: false,
                message: 'Failed to start appraisal cycle'
            });
        }
        const updatedAppraisal = await appraisal_cycle_model_1.AppraisalCycleModel.findById(id);
        res.json({
            success: true,
            message: 'Appraisal cycle started successfully',
            data: updatedAppraisal
        });
    }
    catch (error) {
        console.error('Error starting appraisal cycle:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start appraisal cycle',
            error: error.message
        });
    }
    return;
});
router.post('/:id/end', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('appraisal.update'), async (req, res) => {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const id = parseInt(idParam);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid appraisal cycle ID'
            });
        }
        const appraisal = await appraisal_cycle_model_1.AppraisalCycleModel.findById(id);
        if (!appraisal) {
            return res.status(404).json({
                success: false,
                message: 'Appraisal cycle not found'
            });
        }
        if (appraisal.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Cannot end appraisal cycle that is not active'
            });
        }
        const success = await appraisal_cycle_model_1.AppraisalCycleModel.update(id, { status: 'completed' });
        if (!success) {
            return res.status(400).json({
                success: false,
                message: 'Failed to end appraisal cycle'
            });
        }
        const updatedAppraisal = await appraisal_cycle_model_1.AppraisalCycleModel.findById(id);
        res.json({
            success: true,
            message: 'Appraisal cycle ended successfully',
            data: updatedAppraisal
        });
    }
    catch (error) {
        console.error('Error ending appraisal cycle:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to end appraisal cycle',
            error: error.message
        });
    }
    return;
});
router.delete('/:id', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('appraisal.delete'), async (req, res) => {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const id = parseInt(idParam);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid appraisal cycle ID'
            });
        }
        const appraisal = await appraisal_cycle_model_1.AppraisalCycleModel.findById(id);
        if (!appraisal) {
            return res.status(404).json({
                success: false,
                message: 'Appraisal cycle not found'
            });
        }
        const success = await appraisal_cycle_model_1.AppraisalCycleModel.delete(id);
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
    }
    catch (error) {
        console.error('Error deleting appraisal cycle:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete appraisal cycle',
            error: error.message
        });
    }
    return;
});
exports.default = router;
//# sourceMappingURL=appraisal.route.js.map