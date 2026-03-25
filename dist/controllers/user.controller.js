"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeUserPermission = exports.addUserPermission = exports.getUserPermissions = exports.terminateUser = exports.deleteUser = exports.updateUser = exports.createUser = exports.getUserById = exports.getAllUsers = void 0;
const type_utils_1 = require("../utils/type-utils");
const user_model_1 = __importDefault(require("../models/user.model"));
const user_permission_model_1 = __importDefault(require("../models/user-permission.model"));
const cpanel_email_service_1 = __importDefault(require("../services/cpanel-email.service"));
const getAllUsers = async (req, res) => {
    try {
        const page = (0, type_utils_1.getNumberQueryParam)(req, 'page', 1) || 1;
        const limit = (0, type_utils_1.getNumberQueryParam)(req, 'limit', 20) || 20;
        const offset = (page - 1) * limit;
        const branchId = req.query.branchId ? (0, type_utils_1.getNumberQueryParam)(req, 'branchId') : undefined;
        const status = (0, type_utils_1.getStringQueryParam)(req, 'status');
        const roleId = req.query.roleId ? (0, type_utils_1.getNumberQueryParam)(req, 'roleId') : undefined;
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
        const { users, totalCount } = await user_model_1.default.findAllWithFilters(limit, offset, branchId, status, roleId);
        const totalPages = Math.ceil(totalCount / limit);
        return res.json({
            success: true,
            message: 'Users retrieved successfully',
            data: {
                users,
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
        console.error('Get all users error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getAllUsers = getAllUsers;
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const idStr = Array.isArray(id) ? id[0] : id;
        const userId = parseInt(idStr);
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        return res.json({
            success: true,
            message: 'User retrieved successfully',
            data: { user }
        });
    }
    catch (error) {
        console.error('Get user by ID error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getUserById = getUserById;
const createUser = async (req, res) => {
    try {
        const { email, password, full_name, phone, role_id, branch_id } = req.body;
        if (!email || !password || !full_name || !role_id) {
            return res.status(400).json({
                success: false,
                message: 'Email, password, full name, and role ID are required'
            });
        }
        const existingUser = await user_model_1.default.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'A user with this email already exists'
            });
        }
        const userData = {
            email,
            password,
            full_name,
            phone,
            role_id,
            branch_id
        };
        const newUser = await user_model_1.default.create(userData);
        const { password_hash, ...userWithoutPassword } = newUser;
        return res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: { user: userWithoutPassword }
        });
    }
    catch (error) {
        console.error('Create user error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.createUser = createUser;
const updateUser = async (req, res) => {
    try {
        const idParam = req.params.id;
        const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const userId = parseInt(typeof idStr === 'string' ? idStr : '');
        const { email, password, full_name, phone, role_id, branch_id, status, must_change_password } = req.body;
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }
        const existingUser = await user_model_1.default.findById(userId);
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const updateData = {};
        if (email !== undefined)
            updateData.email = email;
        if (password !== undefined)
            updateData.password = password;
        if (full_name !== undefined)
            updateData.full_name = full_name;
        if (phone !== undefined)
            updateData.phone = phone;
        if (role_id !== undefined)
            updateData.role_id = role_id;
        if (branch_id !== undefined)
            updateData.branch_id = branch_id;
        if (status !== undefined)
            updateData.status = status;
        if (must_change_password !== undefined)
            updateData.must_change_password = must_change_password;
        const updatedUser = await user_model_1.default.update(userId, updateData);
        if (updatedUser) {
            const { password_hash, ...userWithoutPassword } = updatedUser;
            return res.json({
                success: true,
                message: 'User updated successfully',
                data: { user: userWithoutPassword }
            });
        }
        else {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
    }
    catch (error) {
        console.error('Update user error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    try {
        const idParam = req.params.id;
        const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const userId = parseInt(typeof idStr === 'string' ? idStr : '');
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }
        const deleted = await user_model_1.default.delete(userId);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        return res.json({
            success: true,
            message: 'User deactivated successfully'
        });
    }
    catch (error) {
        console.error('Deactivate user error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.deleteUser = deleteUser;
const terminateUser = async (req, res) => {
    try {
        const idParam = req.params.id;
        const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const userId = parseInt(typeof idStr === 'string' ? idStr : '');
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const terminated = await user_model_1.default.softDelete(userId);
        if (!terminated) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const emailParts = user.email.split('@');
        if (emailParts.length === 2) {
            const domain = emailParts[1];
            const companyDomain = process.env.CPANEL_DOMAIN || 'example.com';
            if (domain === companyDomain) {
                try {
                    const emailPrefix = emailParts[0];
                    const cpanelService = new cpanel_email_service_1.default();
                    const deletionResult = await cpanelService.deleteEmailAccount(emailPrefix);
                    if (deletionResult.success) {
                        console.log(`Email account ${user.email} removed from cPanel successfully`);
                    }
                    else {
                        console.error(`Failed to remove email account ${user.email} from cPanel:`, deletionResult.error);
                    }
                }
                catch (emailError) {
                    console.error('Error removing email account from cPanel:', emailError);
                }
            }
        }
        return res.json({
            success: true,
            message: 'User terminated successfully and email account removed from cPanel'
        });
    }
    catch (error) {
        console.error('Terminate user error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.terminateUser = terminateUser;
const getUserPermissions = async (req, res) => {
    try {
        const idParam = req.params.id;
        const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const userId = parseInt(typeof idStr === 'string' ? idStr : '');
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }
        const permissions = await user_permission_model_1.default.getUserPermissions(userId);
        return res.json({
            success: true,
            message: 'User permissions retrieved successfully',
            data: { permissions }
        });
    }
    catch (error) {
        console.error('Get user permissions error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getUserPermissions = getUserPermissions;
const addUserPermission = async (req, res) => {
    try {
        const idParam = req.params.id;
        const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const userId = parseInt(typeof idStr === 'string' ? idStr : '');
        const { permission, allow_deny } = req.body;
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }
        if (!permission) {
            return res.status(400).json({
                success: false,
                message: 'Permission is required'
            });
        }
        const existingPermission = await user_permission_model_1.default.findByUserAndPermission(userId, permission);
        if (existingPermission) {
            return res.status(409).json({
                success: false,
                message: 'Permission already exists for this user'
            });
        }
        const permissionData = {
            user_id: userId,
            permission,
            allow_deny: allow_deny || 'allow'
        };
        const newPermission = await user_permission_model_1.default.create(permissionData);
        return res.status(201).json({
            success: true,
            message: 'User permission added successfully',
            data: { permission: newPermission }
        });
    }
    catch (error) {
        console.error('Add user permission error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.addUserPermission = addUserPermission;
const removeUserPermission = async (req, res) => {
    try {
        const idParam = req.params.id;
        const permissionParam = req.params.permission;
        const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const permissionStr = Array.isArray(permissionParam) ? permissionParam[0] : permissionParam;
        const userId = parseInt(typeof idStr === 'string' ? idStr : '');
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }
        if (!permissionStr) {
            return res.status(400).json({
                success: false,
                message: 'Permission is required'
            });
        }
        const deleted = await user_permission_model_1.default.deleteUserPermission(userId, permissionStr);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'User permission not found'
            });
        }
        return res.json({
            success: true,
            message: 'User permission removed successfully'
        });
    }
    catch (error) {
        console.error('Remove user permission error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.removeUserPermission = removeUserPermission;
//# sourceMappingURL=user.controller.js.map