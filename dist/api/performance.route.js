"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const performance_score_model_1 = require("../models/performance-score.model");
const user_model_1 = __importDefault(require("../models/user.model"));
const router = express_1.default.Router();
router.get('/employee/:employeeId', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('performance:read'), async (req, res) => {
    try {
        const employeeIdParam = Array.isArray(req.params.employeeId) ? req.params.employeeId[0] : req.params.employeeId;
        const employeeId = parseInt(employeeIdParam);
        if (isNaN(employeeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid employee ID'
            });
        }
        const scores = await performance_score_model_1.PerformanceScoreModel.findByEmployeeId(employeeId);
        res.json({
            success: true,
            data: scores
        });
    }
    catch (error) {
        console.error('Error fetching performance scores for employee:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch performance scores for employee',
            error: error.message
        });
    }
    return;
});
router.get('/template/:templateId', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('performance:read'), async (req, res) => {
    try {
        const templateIdParam = Array.isArray(req.params.templateId) ? req.params.templateId[0] : req.params.templateId;
        const templateId = parseInt(templateIdParam);
        if (isNaN(templateId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid template ID'
            });
        }
        const scores = await performance_score_model_1.PerformanceScoreModel.findByTemplateId(templateId);
        res.json({
            success: true,
            data: scores
        });
    }
    catch (error) {
        console.error('Error fetching performance scores for template:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch performance scores for template',
            error: error.message
        });
    }
    return;
});
router.get('/categories/:category', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('performance:read'), async (req, res) => {
    try {
        const categoryParam = Array.isArray(req.params.category) ? req.params.category[0] : req.params.category;
        const category = categoryParam;
        if (!category) {
            return res.status(400).json({
                success: false,
                message: 'Category parameter is required'
            });
        }
        const scores = await performance_score_model_1.PerformanceScoreModel.findByCategory(category);
        res.json({
            success: true,
            data: scores
        });
    }
    catch (error) {
        console.error('Error fetching performance scores by category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch performance scores by category',
            error: error.message
        });
    }
    return;
});
router.get('/period/:startDate/:endDate', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('performance:read'), async (req, res) => {
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
        const scores = await performance_score_model_1.PerformanceScoreModel.findByPeriod(startDate, endDate);
        res.json({
            success: true,
            data: scores
        });
    }
    catch (error) {
        console.error('Error fetching performance scores by period:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch performance scores by period',
            error: error.message
        });
    }
    return;
});
router.post('/recalculate', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('performance:read'), async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Performance recalculation job has been queued'
        });
    }
    catch (error) {
        console.error('Error queuing performance recalculation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to queue performance recalculation',
            error: error.message
        });
    }
});
router.post('/', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('performance:read'), async (req, res) => {
    try {
        const { employee_id, kpi_id, template_id, score, achieved_value, period_start, period_end } = req.body;
        if (!employee_id || !kpi_id || !template_id || score === undefined || achieved_value === undefined || !period_start || !period_end) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: employee_id, kpi_id, template_id, score, achieved_value, period_start, period_end'
            });
        }
        const user = await user_model_1.default.findById(req.currentUser.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const newScore = {
            employee_id,
            kpi_id,
            template_id,
            score,
            achieved_value,
            period_start: new Date(period_start),
            period_end: new Date(period_end),
            calculated_by: req.currentUser.id
        };
        const createdScore = await performance_score_model_1.PerformanceScoreModel.create(newScore);
        res.status(201).json({
            success: true,
            message: 'Performance score created successfully',
            data: createdScore
        });
    }
    catch (error) {
        console.error('Error creating performance score:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create performance score',
            error: error.message
        });
    }
    return;
});
exports.default = router;
//# sourceMappingURL=performance.route.js.map