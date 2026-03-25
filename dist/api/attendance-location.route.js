"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const attendance_location_model_1 = __importDefault(require("../models/attendance-location.model"));
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('attendance_location:read'), async (req, res) => {
    try {
        const { branchId, isActive } = req.query;
        let locations;
        if (branchId) {
            const branchIdStr = Array.isArray(branchId) ? branchId[0] : branchId;
            const branchIdNum = parseInt(branchIdStr);
            locations = await attendance_location_model_1.default.findByBranch(branchIdNum);
        }
        else if (isActive !== undefined) {
            const isActiveStr = Array.isArray(isActive) ? isActive[0] : isActive;
            const isActiveBool = isActiveStr === 'true';
            locations = await attendance_location_model_1.default.findByActiveStatus(isActiveBool);
        }
        else {
            locations = await attendance_location_model_1.default.findAll();
        }
        return res.json({
            success: true,
            message: 'Attendance locations retrieved successfully',
            data: { locations }
        });
    }
    catch (error) {
        console.error('Get attendance locations error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.get('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('attendance_location:read'), async (req, res) => {
    try {
        const idParam = req.params.id;
        const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const locationId = parseInt(idStr);
        if (isNaN(locationId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid location ID'
            });
        }
        const location = await attendance_location_model_1.default.findById(locationId);
        if (!location) {
            return res.status(404).json({
                success: false,
                message: 'Attendance location not found'
            });
        }
        return res.json({
            success: true,
            message: 'Attendance location retrieved successfully',
            data: { location }
        });
    }
    catch (error) {
        console.error('Get attendance location error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.post('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('attendance-location:create'), async (req, res) => {
    try {
        const { name, location_coordinates, location_radius_meters, branch_id, is_active } = req.body;
        console.log('📍 POST /api/attendance-locations - Request body:', req.body);
        if (!name || !location_coordinates) {
            return res.status(400).json({
                success: false,
                message: 'Name and location coordinates are required'
            });
        }
        const locationData = {
            name,
            location_coordinates,
            location_radius_meters: location_radius_meters || 100,
            branch_id: branch_id || null,
            is_active: is_active !== undefined ? Boolean(is_active) : true
        };
        console.log('📍 Passing to model:', locationData);
        const newLocation = await attendance_location_model_1.default.create(locationData);
        return res.status(201).json({
            success: true,
            message: 'Attendance location created successfully',
            data: { location: newLocation }
        });
    }
    catch (error) {
        console.error('Create attendance location error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.put('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('attendance-location:update'), async (req, res) => {
    try {
        const idParam = req.params.id;
        const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const locationId = parseInt(idStr);
        const { name, location_coordinates, location_radius_meters, branch_id, is_active } = req.body;
        if (isNaN(locationId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid location ID'
            });
        }
        const existingLocation = await attendance_location_model_1.default.findById(locationId);
        if (!existingLocation) {
            return res.status(404).json({
                success: false,
                message: 'Attendance location not found'
            });
        }
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        if (location_coordinates !== undefined)
            updateData.location_coordinates = location_coordinates;
        if (location_radius_meters !== undefined)
            updateData.location_radius_meters = location_radius_meters;
        if (branch_id !== undefined)
            updateData.branch_id = branch_id;
        if (is_active !== undefined)
            updateData.is_active = Boolean(is_active);
        const updatedLocation = await attendance_location_model_1.default.update(locationId, updateData);
        return res.json({
            success: true,
            message: 'Attendance location updated successfully',
            data: { location: updatedLocation }
        });
    }
    catch (error) {
        console.error('Update attendance location error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
router.delete('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('attendance-location:delete'), async (req, res) => {
    try {
        const idParam = req.params.id;
        const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
        const locationId = parseInt(idStr);
        if (isNaN(locationId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid location ID'
            });
        }
        const deleted = await attendance_location_model_1.default.delete(locationId);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Attendance location not found'
            });
        }
        return res.json({
            success: true,
            message: 'Attendance location deactivated successfully'
        });
    }
    catch (error) {
        console.error('Delete attendance location error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=attendance-location.route.js.map