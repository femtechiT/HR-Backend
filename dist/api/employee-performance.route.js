"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const performance_score_model_1 = require("../models/performance-score.model");
const appraisal_assignment_model_1 = require("../models/appraisal-assignment.model");
const router = express_1.default.Router();
router.get('/:id/performance', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('performance:read'), async (req, res) => {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const employeeId = parseInt(idParam);
        if (isNaN(employeeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid employee ID'
            });
        }
        const performanceScores = await performance_score_model_1.PerformanceScoreModel.findByEmployeeId(employeeId);
        res.json({
            success: true,
            data: performanceScores
        });
    }
    catch (error) {
        console.error('Error fetching employee performance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch employee performance',
            error: error.message
        });
    }
    return;
});
router.get('/:id/appraisals', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('appraisal:read'), async (req, res) => {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const employeeId = parseInt(idParam);
        if (isNaN(employeeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid employee ID'
            });
        }
        const appraisalAssignments = await appraisal_assignment_model_1.AppraisalAssignmentModel.findByEmployeeId(employeeId);
        res.json({
            success: true,
            data: appraisalAssignments
        });
    }
    catch (error) {
        console.error('Error fetching employee appraisals:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch employee appraisals',
            error: error.message
        });
    }
    return;
});
router.get('/:id/appraisals/template/:templateId', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('appraisal:read'), async (req, res) => {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const templateIdParam = Array.isArray(req.params.templateId) ? req.params.templateId[0] : req.params.templateId;
        const employeeId = parseInt(idParam);
        const templateId = parseInt(templateIdParam);
        if (isNaN(employeeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid employee ID'
            });
        }
        if (isNaN(templateId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid template ID'
            });
        }
        res.json({
            success: true,
            data: []
        });
    }
    catch (error) {
        console.error('Error fetching employee appraisals for template:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch employee appraisals for template',
            error: error.message
        });
    }
    return;
});
router.post('/:id/self-assessment', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('appraisal.submit'), async (req, res) => {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const employeeId = parseInt(idParam);
        if (isNaN(employeeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid employee ID'
            });
        }
        if (req.currentUser.id !== employeeId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to submit self-assessment for another employee'
            });
        }
        const { appraisal_assignment_id, self_assessment_data } = req.body;
        if (!appraisal_assignment_id || !self_assessment_data) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: appraisal_assignment_id, self_assessment_data'
            });
        }
        res.json({
            success: true,
            message: 'Self-assessment submitted successfully'
        });
    }
    catch (error) {
        console.error('Error submitting self-assessment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit self-assessment',
            error: error.message
        });
    }
    return;
});
router.get('/:id/self-assessment', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('appraisal:read'), async (req, res) => {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const employeeId = parseInt(idParam);
        if (isNaN(employeeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid employee ID'
            });
        }
        if (req.currentUser.id !== employeeId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to view self-assessment for another employee'
            });
        }
        res.json({
            success: true,
            data: {}
        });
    }
    catch (error) {
        console.error('Error fetching self-assessment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch self-assessment',
            error: error.message
        });
    }
    return;
});
exports.default = router;
//# sourceMappingURL=employee-performance.route.js.map