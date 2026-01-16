import { Request, Response } from 'express';
import BranchModel from '../models/branch.model';
import AuditLogModel from '../models/audit-log.model';

// Controller to update attendance mode for all branches
export const updateGlobalAttendanceMode = async (req: Request, res: Response) => {
  try {
    const { attendance_mode } = req.body;

    // Validate attendance mode
    if (!['branch_based', 'multiple_locations'].includes(attendance_mode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attendance mode. Valid values are: branch_based, multiple_locations'
      });
    }

    if (!req.currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get all branches to update
    const allBranches = await BranchModel.findAll();

    // Update attendance mode for all branches
    const updatedBranches = [];
    for (const branch of allBranches) {
      const updatedBranch = await BranchModel.update(branch.id, { attendance_mode });

      // Check if update was successful
      if (!updatedBranch) {
        console.error(`Failed to update branch ${branch.id} attendance mode`);
        continue; // Skip to next branch
      }

      updatedBranches.push(updatedBranch);

      // Log the change for each branch
      await AuditLogModel.create({
        user_id: req.currentUser.id,
        action: 'branch.attendance_mode.updated',
        entity_type: 'branch',
        entity_id: branch.id,
        before_data: { ...branch, attendance_mode: branch.attendance_mode },
        after_data: { ...updatedBranch, attendance_mode: updatedBranch.attendance_mode },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
    }

    return res.json({
      success: true,
      message: `Attendance mode updated to ${attendance_mode} for all branches`,
      data: { 
        branches_updated: updatedBranches.length,
        updated_branches: updatedBranches
      }
    });
  } catch (error) {
    console.error('Update global attendance mode error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Controller to get current attendance mode for all branches
export const getGlobalAttendanceMode = async (req: Request, res: Response) => {
  try {
    // Get all branches with their attendance modes
    const allBranches = await BranchModel.findAll();

    const attendanceModes = allBranches.map(branch => ({
      id: branch.id,
      name: branch.name,
      attendance_mode: branch.attendance_mode
    }));

    // Check if all branches have the same mode
    const uniqueModes = [...new Set(attendanceModes.map(b => b.attendance_mode))];
    const isConsistent = uniqueModes.length <= 1;

    return res.json({
      success: true,
      message: 'Global attendance mode information retrieved successfully',
      data: {
        is_consistent: isConsistent,
        current_modes: uniqueModes,
        branches: attendanceModes
      }
    });
  } catch (error) {
    console.error('Get global attendance mode error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};