"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const role_permission_model_1 = __importDefault(require("../models/role-permission.model"));
const role_model_1 = __importDefault(require("../models/role.model"));
const router = express_1.default.Router();
router.get('/available', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('permissions.manage'), async (req, res) => {
    try {
        const allPermissions = [
            'staff.create', 'staff.read', 'staff.update', 'staff.delete',
            'user.create', 'user.read', 'user.update', 'user.delete',
            'role.create', 'role.read', 'role.update', 'role.delete',
            'permission.manage',
            'form.create', 'form.read', 'form.update', 'form.delete',
            'form_submission.read', 'form_submission.update',
            'leave.create', 'leave.read', 'leave.update', 'leave.delete',
            'leave.approve',
            'attendance.create', 'attendance.read', 'attendance.update', 'attendance.delete',
            'attendance.manage',
            'payroll.create', 'payroll.read', 'payroll.update', 'payroll.delete',
            'payroll.manage',
            'appraisal_template.create', 'appraisal_template.read', 'appraisal_template.update', 'appraisal_template.delete',
            'metric.create', 'metric.read', 'metric.update', 'metric.delete',
            'kpi.create', 'kpi.read', 'kpi.update', 'kpi.delete',
            'target.create', 'target.read', 'target.update', 'target.delete',
            'appraisal.create', 'appraisal.read', 'appraisal.update', 'appraisal.submit',
            'performance.read',
            'branch.create', 'branch.read', 'branch.update', 'branch.delete',
            'document.upload', 'document.download',
            'report.view', 'report.generate',
            'setting.configure',
            'audit.read'
        ];
        res.json({
            success: true,
            data: allPermissions
        });
    }
    catch (error) {
        console.error('Error fetching available permissions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch available permissions',
            error: error.message
        });
    }
    return;
});
router.get('/roles/:roleId/permissions', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('role.read'), async (req, res) => {
    try {
        const roleIdParam = Array.isArray(req.params.roleId) ? req.params.roleId[0] : req.params.roleId;
        const roleId = parseInt(roleIdParam);
        if (isNaN(roleId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role ID'
            });
        }
        const role = await role_model_1.default.findById(roleId);
        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }
        const permissions = await role_permission_model_1.default.findByRoleId(roleId);
        res.json({
            success: true,
            data: permissions.map(rp => rp.permission)
        });
    }
    catch (error) {
        console.error('Error fetching role permissions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch role permissions',
            error: error.message
        });
    }
    return;
});
router.post('/roles/:roleId/permissions', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('permission.manage'), async (req, res) => {
    try {
        const roleIdParam = Array.isArray(req.params.roleId) ? req.params.roleId[0] : req.params.roleId;
        const roleId = parseInt(roleIdParam);
        if (isNaN(roleId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role ID'
            });
        }
        const { permissions } = req.body;
        if (!Array.isArray(permissions) || permissions.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Permissions array is required and cannot be empty'
            });
        }
        const role = await role_model_1.default.findById(roleId);
        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }
        const results = [];
        for (const permission of permissions) {
            try {
                await role_permission_model_1.default.create({
                    role_id: roleId,
                    permission: permission,
                    allow_deny: 'allow'
                });
                results.push({ permission, status: 'assigned' });
            }
            catch (err) {
                results.push({ permission, status: 'failed', error: err.message });
            }
        }
        res.json({
            success: true,
            message: `Permissions assigned to role successfully`,
            data: results
        });
    }
    catch (error) {
        console.error('Error assigning permissions to role:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to assign permissions to role',
            error: error.message
        });
    }
    return;
});
router.delete('/roles/:roleId/permissions', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('permission.manage'), async (req, res) => {
    try {
        const roleIdParam = Array.isArray(req.params.roleId) ? req.params.roleId[0] : req.params.roleId;
        const roleId = parseInt(roleIdParam);
        if (isNaN(roleId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role ID'
            });
        }
        const { permissions } = req.body;
        if (!Array.isArray(permissions) || permissions.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Permissions array is required and cannot be empty'
            });
        }
        const role = await role_model_1.default.findById(roleId);
        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }
        const success = await role_permission_model_1.default.deleteMultipleRolePermissions(roleId, permissions);
        const results = permissions.map(permission => ({
            permission,
            status: success ? 'removed' : 'failed'
        }));
        res.json({
            success: true,
            message: `Permissions removed from role successfully`,
            data: results
        });
    }
    catch (error) {
        console.error('Error removing permissions from role:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove permissions from role',
            error: error.message
        });
    }
    return;
});
exports.default = router;
//# sourceMappingURL=role-permission.route.js.map