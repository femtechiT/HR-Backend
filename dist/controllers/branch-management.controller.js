"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBranch = exports.updateBranch = exports.createBranch = exports.getBranchById = exports.getAllBranches = void 0;
const branch_model_1 = __importDefault(require("../models/branch.model"));
const getAllBranches = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const name = Array.isArray(req.query.name) ? req.query.name[0] : req.query.name;
        const status = Array.isArray(req.query.status) ? req.query.status[0] : req.query.status;
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
        const branches = await branch_model_1.default.findAll();
        const totalCount = branches.length;
        const totalPages = Math.ceil(totalCount / limit);
        return res.json({
            success: true,
            message: 'Branches retrieved successfully',
            data: {
                branches,
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
        console.error('Get all branches error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getAllBranches = getAllBranches;
const getBranchById = async (req, res) => {
    try {
        const idParam = req.params.id;
        const branchIdStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const branchId = parseInt(typeof branchIdStr === 'string' ? branchIdStr : '');
        if (isNaN(branchId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid branch ID'
            });
        }
        const branch = await branch_model_1.default.findById(branchId);
        if (!branch) {
            return res.status(404).json({
                success: false,
                message: 'Branch not found'
            });
        }
        return res.json({
            success: true,
            message: 'Branch retrieved successfully',
            data: { branch }
        });
    }
    catch (error) {
        console.error('Get branch by ID error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getBranchById = getBranchById;
const createBranch = async (req, res) => {
    try {
        const { name, code, address, city, state, country, phone, email, manager_user_id, location_coordinates, location_radius_meters, attendance_mode } = req.body;
        if (!name || !code) {
            return res.status(400).json({
                success: false,
                message: 'Branch name and code are required'
            });
        }
        const existingBranch = await branch_model_1.default.findByCode(code);
        if (existingBranch) {
            return res.status(409).json({
                success: false,
                message: 'A branch with this code already exists'
            });
        }
        const branchData = {
            name,
            code,
            address: address || '',
            city: city || '',
            state: state || '',
            country: country || '',
            phone: phone || '',
            email: email || '',
            manager_user_id: manager_user_id || null,
            location_coordinates: location_coordinates || null,
            location_radius_meters: location_radius_meters || null,
            attendance_mode: attendance_mode || null
        };
        const newBranch = await branch_model_1.default.create(branchData);
        return res.status(201).json({
            success: true,
            message: 'Branch created successfully',
            data: { branch: newBranch }
        });
    }
    catch (error) {
        console.error('Create branch error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.createBranch = createBranch;
const updateBranch = async (req, res) => {
    try {
        const idParam = req.params.id;
        const branchIdStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const branchId = parseInt(typeof branchIdStr === 'string' ? branchIdStr : '');
        const { name, code, address, city, state, country, phone, email, manager_user_id, location_coordinates, location_radius_meters, attendance_mode, status } = req.body;
        if (isNaN(branchId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid branch ID'
            });
        }
        const existingBranch = await branch_model_1.default.findById(branchId);
        if (!existingBranch) {
            return res.status(404).json({
                success: false,
                message: 'Branch not found'
            });
        }
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        if (code !== undefined)
            updateData.code = code;
        if (address !== undefined)
            updateData.address = address;
        if (city !== undefined)
            updateData.city = city;
        if (state !== undefined)
            updateData.state = state;
        if (country !== undefined)
            updateData.country = country;
        if (phone !== undefined)
            updateData.phone = phone;
        if (email !== undefined)
            updateData.email = email;
        if (manager_user_id !== undefined)
            updateData.manager_user_id = manager_user_id;
        if (location_coordinates !== undefined)
            updateData.location_coordinates = location_coordinates;
        if (location_radius_meters !== undefined)
            updateData.location_radius_meters = location_radius_meters;
        if (attendance_mode !== undefined)
            updateData.attendance_mode = attendance_mode;
        if (status !== undefined)
            updateData.status = status;
        const updatedBranch = await branch_model_1.default.update(branchId, updateData);
        return res.json({
            success: true,
            message: 'Branch updated successfully',
            data: { branch: updatedBranch }
        });
    }
    catch (error) {
        console.error('Update branch error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.updateBranch = updateBranch;
const deleteBranch = async (req, res) => {
    try {
        const idParam = req.params.id;
        const branchIdStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const branchId = parseInt(typeof branchIdStr === 'string' ? branchIdStr : '');
        if (isNaN(branchId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid branch ID'
            });
        }
        const deleted = await branch_model_1.default.delete(branchId);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Branch not found'
            });
        }
        return res.json({
            success: true,
            message: 'Branch deactivated successfully'
        });
    }
    catch (error) {
        console.error('Delete branch error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.deleteBranch = deleteBranch;
//# sourceMappingURL=branch-management.controller.js.map