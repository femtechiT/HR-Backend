"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const kpi_definition_model_1 = require("../models/kpi-definition.model");
const user_model_1 = __importDefault(require("../models/user.model"));
const router = express_1.default.Router();
router.get('/', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('kpi:read'), async (req, res) => {
    try {
        const kpis = await kpi_definition_model_1.KpiDefinitionModel.findAll();
        res.json({
            success: true,
            data: kpis
        });
    }
    catch (error) {
        console.error('Error fetching KPIs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch KPIs',
            error: error.message
        });
    }
    return;
});
router.get('/:id', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('kpi:read'), async (req, res) => {
    try {
        const idParam = typeof req.params.id === 'string' ? req.params.id : '';
        const id = parseInt(idParam);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid KPI ID'
            });
        }
        const kpi = await kpi_definition_model_1.KpiDefinitionModel.findById(id);
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
    }
    catch (error) {
        console.error('Error fetching KPI:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch KPI',
            error: error.message
        });
    }
    return;
});
router.get('/categories/:category', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('kpi:read'), async (req, res) => {
    try {
        const category = typeof req.params.category === 'string' ? req.params.category : '';
        if (!category) {
            return res.status(400).json({
                success: false,
                message: 'Category parameter is required'
            });
        }
        const kpis = await kpi_definition_model_1.KpiDefinitionModel.findByCategory(category);
        res.json({
            success: true,
            data: kpis
        });
    }
    catch (error) {
        console.error('Error fetching KPIs by category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch KPIs by category',
            error: error.message
        });
    }
    return;
});
router.post('/', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('kpi.create'), async (req, res) => {
    try {
        const { name, description, formula, weight, metric_ids, categories } = req.body;
        if (!name || !description || !formula || weight === undefined || !metric_ids || !categories) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: name, description, formula, weight, metric_ids, categories'
            });
        }
        const user = await user_model_1.default.findById(req.currentUser.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const newKpi = {
            name,
            description,
            formula,
            weight,
            metric_ids,
            categories,
            is_active: true,
            created_by: req.currentUser.id
        };
        const createdKpi = await kpi_definition_model_1.KpiDefinitionModel.create(newKpi);
        res.status(201).json({
            success: true,
            message: 'KPI created successfully',
            data: createdKpi
        });
    }
    catch (error) {
        console.error('Error creating KPI:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create KPI',
            error: error.message
        });
    }
    return;
});
router.put('/:id', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('kpi.update'), async (req, res) => {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const id = parseInt(idParam);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid KPI ID'
            });
        }
        const kpi = await kpi_definition_model_1.KpiDefinitionModel.findById(id);
        if (!kpi) {
            return res.status(404).json({
                success: false,
                message: 'KPI not found'
            });
        }
        const updatedFields = req.body;
        delete updatedFields.created_by;
        const success = await kpi_definition_model_1.KpiDefinitionModel.update(id, updatedFields);
        if (!success) {
            return res.status(400).json({
                success: false,
                message: 'Failed to update KPI'
            });
        }
        const updatedKpi = await kpi_definition_model_1.KpiDefinitionModel.findById(id);
        res.json({
            success: true,
            message: 'KPI updated successfully',
            data: updatedKpi
        });
    }
    catch (error) {
        console.error('Error updating KPI:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update KPI',
            error: error.message
        });
    }
    return;
});
router.delete('/:id', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('kpi.delete'), async (req, res) => {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const id = parseInt(idParam);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid KPI ID'
            });
        }
        const kpi = await kpi_definition_model_1.KpiDefinitionModel.findById(id);
        if (!kpi) {
            return res.status(404).json({
                success: false,
                message: 'KPI not found'
            });
        }
        const success = await kpi_definition_model_1.KpiDefinitionModel.delete(id);
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
    }
    catch (error) {
        console.error('Error deleting KPI:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete KPI',
            error: error.message
        });
    }
    return;
});
exports.default = router;
//# sourceMappingURL=kpi.route.js.map