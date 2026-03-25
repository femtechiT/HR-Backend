"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeRolePermission = exports.addRolePermission = exports.getRolePermissions = exports.deleteRole = exports.updateRole = exports.createRole = exports.getRoleById = exports.getAllRoles = void 0;
const role_model_1 = __importDefault(require("../models/role.model"));
const role_permission_model_1 = __importDefault(require("../models/role-permission.model"));
const getAllRoles = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const name = Array.isArray(req.query.name) ? req.query.name[0] : req.query.name;
        if (page < 1) {
            return res.status(400).json({
                success: false,
                message: 'Page number must be greater than 0'
            });
        }
        if (limit < 1 || limit > 100) {
            return res.status(400).json({
                success: false,
                message: 'Limit must be between 1 and 100'
            });
        }
        const { roles, totalCount } = await role_model_1.default.findAllWithFilters(limit, offset, typeof name === 'string' ? name : undefined);
        const totalPages = Math.ceil(totalCount / limit);
        return res.json({
            success: true,
            message: 'Roles retrieved successfully',
            data: {
                roles,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: totalCount,
                    itemsPerPage: limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1,
                    nextPage: page < totalPages ? page + 1 : null,
                    prevPage: page > 1 ? page - 1 : null
                }
            }
        });
    }
    catch (error) {
        console.error('Get all roles error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getAllRoles = getAllRoles;
const getRoleById = async (req, res) => {
    try {
        const idParam = req.params.id;
        const roleIdStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const roleId = parseInt(typeof roleIdStr === 'string' ? roleIdStr : '');
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
        return res.json({
            success: true,
            message: 'Role retrieved successfully',
            data: { role }
        });
    }
    catch (error) {
        console.error('Get role by ID error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getRoleById = getRoleById;
const createRole = async (req, res) => {
    try {
        const { name, description, permissions } = req.body;
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Role name is required'
            });
        }
        const existingRole = await role_model_1.default.findByName(name);
        if (existingRole) {
            return res.status(409).json({
                success: false,
                message: 'A role with this name already exists'
            });
        }
        const roleData = {
            name,
            description: description || '',
            permissions: permissions || []
        };
        const newRole = await role_model_1.default.create(roleData);
        return res.status(201).json({
            success: true,
            message: 'Role created successfully',
            data: { role: newRole }
        });
    }
    catch (error) {
        console.error('Create role error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.createRole = createRole;
const updateRole = async (req, res) => {
    try {
        const idParam = req.params.id;
        const roleIdStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const roleId = parseInt(typeof roleIdStr === 'string' ? roleIdStr : '');
        const { name, description, permissions } = req.body;
        if (isNaN(roleId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role ID'
            });
        }
        const existingRole = await role_model_1.default.findById(roleId);
        if (!existingRole) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        if (description !== undefined)
            updateData.description = description;
        if (permissions !== undefined)
            updateData.permissions = permissions;
        const updatedRole = await role_model_1.default.update(roleId, updateData);
        return res.json({
            success: true,
            message: 'Role updated successfully',
            data: { role: updatedRole }
        });
    }
    catch (error) {
        console.error('Update role error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.updateRole = updateRole;
const deleteRole = async (req, res) => {
    try {
        const idParam = req.params.id;
        const roleIdStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const roleId = parseInt(typeof roleIdStr === 'string' ? roleIdStr : '');
        if (isNaN(roleId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role ID'
            });
        }
        const deleted = await role_model_1.default.delete(roleId);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }
        return res.json({
            success: true,
            message: 'Role deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete role error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.deleteRole = deleteRole;
const getRolePermissions = async (req, res) => {
    try {
        const idParam = req.params.id;
        const roleIdStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const roleId = parseInt(typeof roleIdStr === 'string' ? roleIdStr : '');
        if (isNaN(roleId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role ID'
            });
        }
        const permissions = await role_permission_model_1.default.getRolePermissions(roleId);
        return res.json({
            success: true,
            message: 'Role permissions retrieved successfully',
            data: { permissions }
        });
    }
    catch (error) {
        console.error('Get role permissions error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getRolePermissions = getRolePermissions;
const addRolePermission = async (req, res) => {
    try {
        const idParam = req.params.id;
        const roleIdStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const roleId = parseInt(typeof roleIdStr === 'string' ? roleIdStr : '');
        const { permission, allow_deny } = req.body;
        if (isNaN(roleId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role ID'
            });
        }
        if (!permission) {
            return res.status(400).json({
                success: false,
                message: 'Permission is required'
            });
        }
        const existingPermission = await role_permission_model_1.default.findByRoleAndPermission(roleId, permission);
        if (existingPermission) {
            return res.status(409).json({
                success: false,
                message: 'Permission already exists for this role'
            });
        }
        const permissionData = {
            role_id: roleId,
            permission,
            allow_deny: allow_deny || 'allow'
        };
        const newPermission = await role_permission_model_1.default.create(permissionData);
        return res.status(201).json({
            success: true,
            message: 'Role permission added successfully',
            data: { permission: newPermission }
        });
    }
    catch (error) {
        console.error('Add role permission error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.addRolePermission = addRolePermission;
const removeRolePermission = async (req, res) => {
    try {
        const { id } = req.params;
        const permissionParam = req.params.permission;
        const permissionStr = Array.isArray(permissionParam) ? permissionParam[0] : permissionParam;
        const idParam = req.params.id;
        const roleIdStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const roleId = parseInt(typeof roleIdStr === 'string' ? roleIdStr : '');
        if (isNaN(roleId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role ID'
            });
        }
        if (!permissionStr) {
            return res.status(400).json({
                success: false,
                message: 'Permission is required'
            });
        }
        const deleted = await role_permission_model_1.default.deleteRolePermission(roleId, permissionStr);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Role permission not found'
            });
        }
        return res.json({
            success: true,
            message: 'Role permission removed successfully'
        });
    }
    catch (error) {
        console.error('Remove role permission error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.removeRolePermission = removeRolePermission;
//# sourceMappingURL=role.controller.js.map