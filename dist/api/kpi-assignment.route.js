"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const kpi_assignment_model_1 = require("../models/kpi-assignment.model");
const user_model_1 = __importDefault(require("../models/user.model"));
const router = express_1.default.Router();
router.get('/', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('kpi_assignment:read'), async (req, res) => {
    try {
        const assignments = await kpi_assignment_model_1.KpiAssignmentModel.findAll();
        res.json({
            success: true,
            data: assignments
        });
    }
    catch (error) {
        console.error('Error fetching KPI assignments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch KPI assignments',
            error: error.message
        });
    }
    return;
});
router.get('/:id', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('kpi_assignment:read'), async (req, res) => {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const id = parseInt(idParam);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid assignment ID'
            });
        }
        const assignment = await kpi_assignment_model_1.KpiAssignmentModel.findById(id);
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'KPI assignment not found'
            });
        }
        res.json({
            success: true,
            data: assignment
        });
    }
    catch (error) {
        console.error('Error fetching KPI assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch KPI assignment',
            error: error.message
        });
    }
    return;
});
router.get('/user/:userId', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('kpi_assignment:read'), async (req, res) => {
    try {
        const userIdParam = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
        const userId = parseInt(userIdParam);
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }
        const assignments = await kpi_assignment_model_1.KpiAssignmentModel.findByUserId(userId);
        res.json({
            success: true,
            data: assignments
        });
    }
    catch (error) {
        console.error('Error fetching KPI assignments for user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch KPI assignments for user',
            error: error.message
        });
    }
    return;
});
router.get('/kpi/:kpiId', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('kpi_assignment:read'), async (req, res) => {
    try {
        const kpiIdParam = Array.isArray(req.params.kpiId) ? req.params.kpiId[0] : req.params.kpiId;
        const kpiId = parseInt(kpiIdParam);
        if (isNaN(kpiId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid KPI ID'
            });
        }
        const assignments = await kpi_assignment_model_1.KpiAssignmentModel.findByKpiDefinitionId(kpiId);
        res.json({
            success: true,
            data: assignments
        });
    }
    catch (error) {
        console.error('Error fetching KPI assignments for KPI:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch KPI assignments for KPI',
            error: error.message
        });
    }
    return;
});
router.post('/', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('kpi_assignment.create'), async (req, res) => {
    try {
        const { user_id, kpi_definition_id, cycle_start_date, cycle_end_date, custom_target_value, notes } = req.body;
        if (!user_id || !kpi_definition_id || !cycle_start_date || !cycle_end_date) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: user_id, kpi_definition_id, cycle_start_date, cycle_end_date'
            });
        }
        const user = await user_model_1.default.findById(user_id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const newAssignment = {
            user_id,
            kpi_definition_id,
            cycle_start_date: new Date(cycle_start_date),
            cycle_end_date: new Date(cycle_end_date),
            assigned_by: req.currentUser.id,
            custom_target_value,
            notes
        };
        const createdAssignment = await kpi_assignment_model_1.KpiAssignmentModel.create(newAssignment);
        res.status(201).json({
            success: true,
            message: 'KPI assignment created successfully',
            data: createdAssignment
        });
    }
    catch (error) {
        console.error('Error creating KPI assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create KPI assignment',
            error: error.message
        });
    }
    return;
});
router.put('/:id', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('kpi_assignment.update'), async (req, res) => {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const id = parseInt(idParam);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid assignment ID'
            });
        }
        const assignment = await kpi_assignment_model_1.KpiAssignmentModel.findById(id);
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'KPI assignment not found'
            });
        }
        const updatedFields = req.body;
        delete updatedFields.assigned_by;
        if (updatedFields.cycle_start_date) {
            updatedFields.cycle_start_date = new Date(updatedFields.cycle_start_date);
        }
        if (updatedFields.cycle_end_date) {
            updatedFields.cycle_end_date = new Date(updatedFields.cycle_end_date);
        }
        const success = await kpi_assignment_model_1.KpiAssignmentModel.update(id, updatedFields);
        if (!success) {
            return res.status(400).json({
                success: false,
                message: 'Failed to update KPI assignment'
            });
        }
        const updatedAssignment = await kpi_assignment_model_1.KpiAssignmentModel.findById(id);
        res.json({
            success: true,
            message: 'KPI assignment updated successfully',
            data: updatedAssignment
        });
    }
    catch (error) {
        console.error('Error updating KPI assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update KPI assignment',
            error: error.message
        });
    }
    return;
});
router.patch('/:id', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('kpi_assignment.update'), async (req, res) => {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const id = parseInt(idParam);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid assignment ID'
            });
        }
        const assignment = await kpi_assignment_model_1.KpiAssignmentModel.findById(id);
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'KPI assignment not found'
            });
        }
        const updatedFields = req.body;
        delete updatedFields.assigned_by;
        if (updatedFields.cycle_start_date) {
            updatedFields.cycle_start_date = new Date(updatedFields.cycle_start_date);
        }
        if (updatedFields.cycle_end_date) {
            updatedFields.cycle_end_date = new Date(updatedFields.cycle_end_date);
        }
        const success = await kpi_assignment_model_1.KpiAssignmentModel.update(id, updatedFields);
        if (!success) {
            return res.status(400).json({
                success: false,
                message: 'Failed to update KPI assignment'
            });
        }
        const updatedAssignment = await kpi_assignment_model_1.KpiAssignmentModel.findById(id);
        res.json({
            success: true,
            message: 'KPI assignment updated successfully',
            data: updatedAssignment
        });
    }
    catch (error) {
        console.error('Error updating KPI assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update KPI assignment',
            error: error.message
        });
    }
    return;
});
router.delete('/:id', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('kpi_assignment.delete'), async (req, res) => {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const id = parseInt(idParam);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid assignment ID'
            });
        }
        const assignment = await kpi_assignment_model_1.KpiAssignmentModel.findById(id);
        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'KPI assignment not found'
            });
        }
        const success = await kpi_assignment_model_1.KpiAssignmentModel.delete(id);
        if (!success) {
            return res.status(400).json({
                success: false,
                message: 'Failed to delete KPI assignment'
            });
        }
        res.json({
            success: true,
            message: 'KPI assignment deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting KPI assignment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete KPI assignment',
            error: error.message
        });
    }
    return;
});
exports.default = router;
//# sourceMappingURL=kpi-assignment.route.js.map