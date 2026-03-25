"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const target_model_1 = require("../models/target.model");
const user_model_1 = __importDefault(require("../models/user.model"));
const router = express_1.default.Router();
router.get('/', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('target:read'), async (req, res) => {
    try {
        const targets = await target_model_1.TargetModel.findAll();
        res.json({
            success: true,
            data: targets
        });
    }
    catch (error) {
        console.error('Error fetching targets:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch targets',
            error: error.message
        });
    }
});
router.get('/:id', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('target:read'), async (req, res) => {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const id = parseInt(idParam);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid target ID'
            });
        }
        const target = await target_model_1.TargetModel.findById(id);
        if (!target) {
            return res.status(404).json({
                success: false,
                message: 'Target not found'
            });
        }
        res.json({
            success: true,
            data: target
        });
    }
    catch (error) {
        console.error('Error fetching target:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch target',
            error: error.message
        });
    }
    return;
});
router.get('/employee/:employeeId', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('target:read'), async (req, res) => {
    try {
        const employeeIdParam = Array.isArray(req.params.employeeId) ? req.params.employeeId[0] : req.params.employeeId;
        const employeeId = parseInt(employeeIdParam);
        if (isNaN(employeeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid employee ID'
            });
        }
        const targets = await target_model_1.TargetModel.findByEmployeeId(employeeId);
        res.json({
            success: true,
            data: targets
        });
    }
    catch (error) {
        console.error('Error fetching targets for employee:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch targets for employee',
            error: error.message
        });
    }
    return;
});
router.get('/template/:templateId', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('target:read'), async (req, res) => {
    try {
        const templateIdParam = Array.isArray(req.params.templateId) ? req.params.templateId[0] : req.params.templateId;
        const templateId = parseInt(templateIdParam);
        if (isNaN(templateId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid template ID'
            });
        }
        const targets = await target_model_1.TargetModel.findByTemplateId(templateId);
        res.json({
            success: true,
            data: targets
        });
    }
    catch (error) {
        console.error('Error fetching targets for template:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch targets for template',
            error: error.message
        });
    }
    return;
});
router.get('/categories/:category', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('target:read'), async (req, res) => {
    try {
        const categoryParam = Array.isArray(req.params.category) ? req.params.category[0] : req.params.category;
        const category = categoryParam;
        if (!category) {
            return res.status(400).json({
                success: false,
                message: 'Category parameter is required'
            });
        }
        const targets = await target_model_1.TargetModel.findByCategory(category);
        res.json({
            success: true,
            data: targets
        });
    }
    catch (error) {
        console.error('Error fetching targets by category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch targets by category',
            error: error.message
        });
    }
    return;
});
router.post('/', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('target.create'), async (req, res) => {
    try {
        const { kpi_id, employee_id, department_id, template_id, target_type, target_value, period_start, period_end } = req.body;
        if (!kpi_id || !employee_id || !target_type || target_value === undefined || !period_start || !period_end) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: kpi_id, employee_id, target_type, target_value, period_start, period_end'
            });
        }
        const validTargetTypes = ['minimum', 'standard', 'stretch'];
        if (!validTargetTypes.includes(target_type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid target_type. Must be one of: minimum, standard, stretch'
            });
        }
        const user = await user_model_1.default.findById(req.currentUser.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const newTarget = {
            kpi_id,
            employee_id,
            department_id,
            template_id,
            target_type,
            target_value,
            period_start: new Date(period_start),
            period_end: new Date(period_end),
            created_by: req.currentUser.id
        };
        const createdTarget = await target_model_1.TargetModel.create(newTarget);
        res.status(201).json({
            success: true,
            message: 'Target created successfully',
            data: createdTarget
        });
    }
    catch (error) {
        console.error('Error creating target:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create target',
            error: error.message
        });
    }
    return;
});
router.put('/:id', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('target.update'), async (req, res) => {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const id = parseInt(idParam);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid target ID'
            });
        }
        const target = await target_model_1.TargetModel.findById(id);
        if (!target) {
            return res.status(404).json({
                success: false,
                message: 'Target not found'
            });
        }
        const updatedFields = req.body;
        delete updatedFields.created_by;
        if (updatedFields.target_type) {
            const validTargetTypes = ['minimum', 'standard', 'stretch'];
            if (!validTargetTypes.includes(updatedFields.target_type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid target_type. Must be one of: minimum, standard, stretch'
                });
            }
        }
        if (updatedFields.period_start) {
            updatedFields.period_start = new Date(updatedFields.period_start);
        }
        if (updatedFields.period_end) {
            updatedFields.period_end = new Date(updatedFields.period_end);
        }
        const success = await target_model_1.TargetModel.update(id, updatedFields);
        if (!success) {
            return res.status(400).json({
                success: false,
                message: 'Failed to update target'
            });
        }
        const updatedTarget = await target_model_1.TargetModel.findById(id);
        res.json({
            success: true,
            message: 'Target updated successfully',
            data: updatedTarget
        });
    }
    catch (error) {
        console.error('Error updating target:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update target',
            error: error.message
        });
    }
    return;
});
router.delete('/:id', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('target.delete'), async (req, res) => {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const id = parseInt(idParam);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid target ID'
            });
        }
        const target = await target_model_1.TargetModel.findById(id);
        if (!target) {
            return res.status(404).json({
                success: false,
                message: 'Target not found'
            });
        }
        const success = await target_model_1.TargetModel.delete(id);
        if (!success) {
            return res.status(400).json({
                success: false,
                message: 'Failed to delete target'
            });
        }
        res.json({
            success: true,
            message: 'Target deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting target:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete target',
            error: error.message
        });
    }
    return;
});
exports.default = router;
//# sourceMappingURL=target.route.js.map