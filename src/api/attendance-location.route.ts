import { Router, Request, Response } from 'express';
import { authenticateJWT, checkPermission } from '../middleware/auth.middleware';
import AttendanceLocationModel from '../models/attendance-location.model';

const router = Router();

// GET /api/attendance-locations - Get all attendance locations
router.get('/', authenticateJWT, checkPermission('attendance_location:read'), async (req: Request, res: Response) => {
  try {
    const { branchId, isActive } = req.query;

    let locations;
    if (branchId) {
      const branchIdStr = Array.isArray(branchId) ? branchId[0] : branchId;
      const branchIdNum = parseInt(branchIdStr as string);
      locations = await AttendanceLocationModel.findByBranch(branchIdNum);
    } else if (isActive !== undefined) {
      const isActiveStr = Array.isArray(isActive) ? isActive[0] : isActive;
      const isActiveBool = isActiveStr === 'true';
      locations = await AttendanceLocationModel.findByActiveStatus(isActiveBool);
    } else {
      locations = await AttendanceLocationModel.findAll();
    }

    return res.json({
      success: true,
      message: 'Attendance locations retrieved successfully',
      data: { locations }
    });
  } catch (error) {
    console.error('Get attendance locations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/attendance-locations/:id - Get attendance location by ID
router.get('/:id', authenticateJWT, checkPermission('attendance_location:read'), async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const locationId = parseInt(idStr as string);

    if (isNaN(locationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location ID'
      });
    }

    const location = await AttendanceLocationModel.findById(locationId);
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
  } catch (error) {
    console.error('Get attendance location error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/attendance-locations - Create new attendance location
router.post('/', authenticateJWT, checkPermission('attendance-location:create'), async (req: Request, res: Response) => {
  try {
    const { name, location_coordinates, location_radius_meters, branch_id, is_active } = req.body;

    console.log('📍 POST /api/attendance-locations - Request body:', req.body);

    // Validate required fields
    if (!name || !location_coordinates) {
      return res.status(400).json({
        success: false,
        message: 'Name and location coordinates are required'
      });
    }

    const locationData = {
      name,
      location_coordinates, // Expected format: "POINT(longitude latitude)"
      location_radius_meters: location_radius_meters || 100, // Default to 100 meters
      branch_id: branch_id || null,
      is_active: is_active !== undefined ? Boolean(is_active) : true
    };

    console.log('📍 Passing to model:', locationData);

    const newLocation = await AttendanceLocationModel.create(locationData);

    return res.status(201).json({
      success: true,
      message: 'Attendance location created successfully',
      data: { location: newLocation }
    });
  } catch (error) {
    console.error('Create attendance location error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/attendance-locations/:id - Update attendance location
router.put('/:id', authenticateJWT, checkPermission('attendance-location:update'), async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const locationId = parseInt(idStr as string);
    const { name, location_coordinates, location_radius_meters, branch_id, is_active } = req.body;

    if (isNaN(locationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location ID'
      });
    }

    const existingLocation = await AttendanceLocationModel.findById(locationId);
    if (!existingLocation) {
      return res.status(404).json({
        success: false,
        message: 'Attendance location not found'
      });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (location_coordinates !== undefined) updateData.location_coordinates = location_coordinates;
    if (location_radius_meters !== undefined) updateData.location_radius_meters = location_radius_meters;
    if (branch_id !== undefined) updateData.branch_id = branch_id;
    if (is_active !== undefined) updateData.is_active = Boolean(is_active);

    const updatedLocation = await AttendanceLocationModel.update(locationId, updateData);

    return res.json({
      success: true,
      message: 'Attendance location updated successfully',
      data: { location: updatedLocation }
    });
  } catch (error) {
    console.error('Update attendance location error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE /api/attendance-locations/:id - Delete (deactivate) attendance location
router.delete('/:id', authenticateJWT, checkPermission('attendance-location:delete'), async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const locationId = parseInt(idStr as string);

    if (isNaN(locationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location ID'
      });
    }

    const deleted = await AttendanceLocationModel.delete(locationId);
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
  } catch (error) {
    console.error('Delete attendance location error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;