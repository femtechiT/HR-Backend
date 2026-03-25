"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const metrics_library_model_1 = require("../models/metrics-library.model");
const user_model_1 = __importDefault(require("../models/user.model"));
const router = express_1.default.Router();
router.get('/', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('metric:read'), async (req, res) => {
    try {
        const metrics = await metrics_library_model_1.MetricsLibraryModel.findAll();
        res.json({
            success: true,
            data: metrics
        });
    }
    catch (error) {
        console.error('Error fetching metrics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch metrics',
            error: error.message
        });
    }
});
router.get('/:id', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('metric:read'), async (req, res) => {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const id = parseInt(idParam);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid metric ID'
            });
        }
        const metric = await metrics_library_model_1.MetricsLibraryModel.findById(id);
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
    }
    catch (error) {
        console.error('Error fetching metric:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch metric',
            error: error.message
        });
    }
    return;
});
router.get('/categories/:category', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('metric:read'), async (req, res) => {
    try {
        const categoryParam = Array.isArray(req.params.category) ? req.params.category[0] : req.params.category;
        const category = categoryParam;
        if (!category) {
            return res.status(400).json({
                success: false,
                message: 'Category parameter is required'
            });
        }
        const metrics = await metrics_library_model_1.MetricsLibraryModel.findByCategory(category);
        res.json({
            success: true,
            data: metrics
        });
    }
    catch (error) {
        console.error('Error fetching metrics by category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch metrics by category',
            error: error.message
        });
    }
    return;
});
router.post('/', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('metric.create'), async (req, res) => {
    try {
        const { name, description, data_type, formula, data_source, categories } = req.body;
        if (!name || !description || !data_type || !formula || !data_source || !categories) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: name, description, data_type, formula, data_source, categories'
            });
        }
        const validDataTypes = ['numeric', 'percentage', 'boolean', 'rating'];
        if (!validDataTypes.includes(data_type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid data_type. Must be one of: numeric, percentage, boolean, rating'
            });
        }
        const user = await user_model_1.default.findById(req.currentUser.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const newMetric = {
            name,
            description,
            data_type,
            formula,
            data_source,
            categories,
            is_active: true,
            created_by: req.currentUser.id
        };
        const createdMetric = await metrics_library_model_1.MetricsLibraryModel.create(newMetric);
        res.status(201).json({
            success: true,
            message: 'Metric created successfully',
            data: createdMetric
        });
    }
    catch (error) {
        console.error('Error creating metric:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create metric',
            error: error.message
        });
    }
    return;
});
router.put('/:id', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('metric.update'), async (req, res) => {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const id = parseInt(idParam);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid metric ID'
            });
        }
        const metric = await metrics_library_model_1.MetricsLibraryModel.findById(id);
        if (!metric) {
            return res.status(404).json({
                success: false,
                message: 'Metric not found'
            });
        }
        const updatedFields = req.body;
        delete updatedFields.created_by;
        if (updatedFields.data_type) {
            const validDataTypes = ['numeric', 'percentage', 'boolean', 'rating'];
            if (!validDataTypes.includes(updatedFields.data_type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid data_type. Must be one of: numeric, percentage, boolean, rating'
                });
            }
        }
        const success = await metrics_library_model_1.MetricsLibraryModel.update(id, updatedFields);
        if (!success) {
            return res.status(400).json({
                success: false,
                message: 'Failed to update metric'
            });
        }
        const updatedMetric = await metrics_library_model_1.MetricsLibraryModel.findById(id);
        res.json({
            success: true,
            message: 'Metric updated successfully',
            data: updatedMetric
        });
    }
    catch (error) {
        console.error('Error updating metric:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update metric',
            error: error.message
        });
    }
    return;
});
router.delete('/:id', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('metric.delete'), async (req, res) => {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const id = parseInt(idParam);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid metric ID'
            });
        }
        const metric = await metrics_library_model_1.MetricsLibraryModel.findById(id);
        if (!metric) {
            return res.status(404).json({
                success: false,
                message: 'Metric not found'
            });
        }
        const success = await metrics_library_model_1.MetricsLibraryModel.delete(id);
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
    }
    catch (error) {
        console.error('Error deleting metric:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete metric',
            error: error.message
        });
    }
    return;
});
exports.default = router;
//# sourceMappingURL=metric.route.js.map