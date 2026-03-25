"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDepartment = exports.updateDepartment = exports.createDepartment = exports.getDepartmentById = exports.getAllDepartments = void 0;
const database_1 = require("../config/database");
const getAllDepartments = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const name = Array.isArray(req.query.name) ? req.query.name[0] : req.query.name;
        const branchId = Array.isArray(req.query.branchId) ? req.query.branchId[0] : req.query.branchId;
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
        let query = `SELECT d.*, b.name as branch_name FROM departments d LEFT JOIN branches b ON d.branch_id = b.id`;
        const params = [];
        const conditions = [];
        if (typeof name === 'string' && name.trim() !== '') {
            conditions.push('d.name LIKE ?');
            params.push(`%${name}%`);
        }
        if (typeof branchId === 'string' && branchId.trim() !== '') {
            const branchIdNum = parseInt(branchId);
            if (!isNaN(branchIdNum)) {
                conditions.push('d.branch_id = ?');
                params.push(branchIdNum);
            }
        }
        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }
        query += ` ORDER BY d.name LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        let countQuery = `SELECT COUNT(*) as count FROM departments d`;
        const countParams = [];
        const countConditions = [];
        if (typeof name === 'string' && name.trim() !== '') {
            countConditions.push('d.name LIKE ?');
            countParams.push(`%${name}%`);
        }
        if (typeof branchId === 'string' && branchId.trim() !== '') {
            const branchIdNum = parseInt(branchId);
            if (!isNaN(branchIdNum)) {
                countConditions.push('d.branch_id = ?');
                countParams.push(branchIdNum);
            }
        }
        if (countConditions.length > 0) {
            countQuery += ` WHERE ${countConditions.join(' AND ')}`;
        }
        const [rows, countResult] = await Promise.all([
            database_1.pool.execute(query, params),
            database_1.pool.execute(countQuery, countParams)
        ]);
        const departments = rows[0];
        const totalCount = countResult[0][0].count;
        const totalPages = Math.ceil(totalCount / limit);
        return res.json({
            success: true,
            message: 'Departments retrieved successfully',
            data: {
                departments,
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
        console.error('Get all departments error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getAllDepartments = getAllDepartments;
const getDepartmentById = async (req, res) => {
    try {
        const idParam = req.params.id;
        const deptIdStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const deptId = parseInt(typeof deptIdStr === 'string' ? deptIdStr : '');
        if (isNaN(deptId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid department ID'
            });
        }
        const [rows] = await database_1.pool.execute(`SELECT d.*, b.name as branch_name FROM departments d 
       LEFT JOIN branches b ON d.branch_id = b.id 
       WHERE d.id = ?`, [deptId]);
        const department = rows[0];
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }
        return res.json({
            success: true,
            message: 'Department retrieved successfully',
            data: { department }
        });
    }
    catch (error) {
        console.error('Get department by ID error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getDepartmentById = getDepartmentById;
const createDepartment = async (req, res) => {
    try {
        const { name, description, branch_id } = req.body;
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Department name is required'
            });
        }
        const [existingRows] = await database_1.pool.execute('SELECT id FROM departments WHERE name = ?', [name]);
        if (existingRows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'A department with this name already exists'
            });
        }
        if (branch_id) {
            const [branchRows] = await database_1.pool.execute('SELECT id FROM branches WHERE id = ?', [branch_id]);
            if (branchRows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Branch not found'
                });
            }
        }
        const [result] = await database_1.pool.execute(`INSERT INTO departments (name, description, branch_id, created_at, updated_at) 
       VALUES (?, ?, ?, NOW(), NOW())`, [name, description || '', branch_id || null]);
        const deptId = result.insertId;
        const [newDeptRows] = await database_1.pool.execute(`SELECT d.*, b.name as branch_name FROM departments d 
       LEFT JOIN branches b ON d.branch_id = b.id 
       WHERE d.id = ?`, [deptId]);
        const newDepartment = newDeptRows[0];
        return res.status(201).json({
            success: true,
            message: 'Department created successfully',
            data: { department: newDepartment }
        });
    }
    catch (error) {
        console.error('Create department error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.createDepartment = createDepartment;
const updateDepartment = async (req, res) => {
    try {
        const idParam = req.params.id;
        const deptIdStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const deptId = parseInt(typeof deptIdStr === 'string' ? deptIdStr : '');
        const { name, description, branch_id } = req.body;
        if (isNaN(deptId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid department ID'
            });
        }
        const [existingRows] = await database_1.pool.execute('SELECT id FROM departments WHERE id = ?', [deptId]);
        if (existingRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }
        if (name) {
            const [sameNameRows] = await database_1.pool.execute('SELECT id FROM departments WHERE name = ? AND id != ?', [name, deptId]);
            if (sameNameRows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'Another department with this name already exists'
                });
            }
        }
        if (branch_id !== undefined) {
            if (branch_id) {
                const [branchRows] = await database_1.pool.execute('SELECT id FROM branches WHERE id = ?', [branch_id]);
                if (branchRows.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Branch not found'
                    });
                }
            }
        }
        const updates = [];
        const values = [];
        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description);
        }
        if (branch_id !== undefined) {
            updates.push('branch_id = ?');
            values.push(branch_id);
        }
        if (updates.length === 0) {
            return (0, exports.getDepartmentById)(req, res);
        }
        values.push(deptId);
        await database_1.pool.execute(`UPDATE departments SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`, values);
        const [updatedDeptRows] = await database_1.pool.execute(`SELECT d.*, b.name as branch_name FROM departments d 
       LEFT JOIN branches b ON d.branch_id = b.id 
       WHERE d.id = ?`, [deptId]);
        const updatedDepartment = updatedDeptRows[0];
        return res.json({
            success: true,
            message: 'Department updated successfully',
            data: { department: updatedDepartment }
        });
    }
    catch (error) {
        console.error('Update department error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.updateDepartment = updateDepartment;
const deleteDepartment = async (req, res) => {
    try {
        const idParam = req.params.id;
        const deptIdStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const deptId = parseInt(typeof deptIdStr === 'string' ? deptIdStr : '');
        if (isNaN(deptId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid department ID'
            });
        }
        const [existingRows] = await database_1.pool.execute('SELECT id FROM departments WHERE id = ?', [deptId]);
        if (existingRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }
        const [staffRows] = await database_1.pool.execute('SELECT COUNT(*) as count FROM staff WHERE department = (SELECT name FROM departments WHERE id = ?)', [deptId]);
        if (staffRows[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete department that has staff members assigned to it'
            });
        }
        await database_1.pool.execute('DELETE FROM departments WHERE id = ?', [deptId]);
        return res.json({
            success: true,
            message: 'Department deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete department error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.deleteDepartment = deleteDepartment;
//# sourceMappingURL=department-management.controller.js.map