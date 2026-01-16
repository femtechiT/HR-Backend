import { Request, Response } from 'express';
import { getNumberQueryParam } from '../utils/type-utils';
import StaffModel, { StaffInput, StaffUpdate } from '../models/staff.model';
import UserModel from '../models/user.model';
import AuditLogModel from '../models/audit-log.model';
import CpanelEmailService from '../services/cpanel-email.service';

// Controller for staff management
export const getAllStaff = async (req: Request, res: Response) => {
  try {
    const page = getNumberQueryParam(req, 'page', 1) || 1;
    const limit = getNumberQueryParam(req, 'limit', 20) || 20;
    const branchId = req.query.branchId ? getNumberQueryParam(req, 'branchId') : undefined;

    const offset = (page - 1) * limit;

    const { staff, totalCount } = await StaffModel.findAll(limit, offset, branchId);

    return res.json({
      success: true,
      message: 'Staff retrieved successfully',
      data: {
        staff,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: limit
        }
      }
    });
  } catch (error) {
    console.error('Get all staff error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getStaffById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const staffIdStr = Array.isArray(id) ? id[0] : id;
    const staffId = parseInt(staffIdStr);

    if (isNaN(staffId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff ID'
      });
    }

    const staff = await StaffModel.findById(staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    return res.json({
      success: true,
      message: 'Staff retrieved successfully',
      data: { staff }
    });
  } catch (error) {
    console.error('Get staff by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const createStaff = async (req: Request, res: Response) => {
  try {
    const { user_id, employee_id, designation, department, branch_id, joining_date, employment_type }: StaffInput = req.body;

    // Validate required fields
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Check if user exists
    const user = await UserModel.findById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user already has a staff record
    const existingStaff = await StaffModel.findByUserId(user_id);
    if (existingStaff) {
      return res.status(409).json({
        success: false,
        message: 'Staff record already exists for this user'
      });
    }

    // Create the staff record
    const staffData: StaffInput = {
      user_id,
      employee_id,
      designation,
      department,
      branch_id,
      joining_date: joining_date ? new Date(joining_date) : undefined,
      employment_type: employment_type || 'full_time'
    };

    const newStaff = await StaffModel.create(staffData);

    // Log the staff creation
    if (req.currentUser) {
      await AuditLogModel.logStaffOperation(
        req.currentUser.id,
        'staff.created',
        newStaff.id,
        null,
        newStaff,
        req.ip,
        req.get('User-Agent') || undefined
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Staff created successfully',
      data: { staff: newStaff }
    });
  } catch (error) {
    console.error('Create staff error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateStaff = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const staffId = parseInt(typeof idStr === 'string' ? idStr : '');
    const { employee_id, designation, department, branch_id, joining_date, employment_type, status }: StaffUpdate = req.body;

    if (isNaN(staffId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff ID'
      });
    }

    // Check if staff exists
    const existingStaff = await StaffModel.findById(staffId);
    if (!existingStaff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    // Prepare update data
    const updateData: StaffUpdate = {};
    if (employee_id !== undefined) updateData.employee_id = employee_id;
    if (designation !== undefined) updateData.designation = designation;
    if (department !== undefined) updateData.department = department;
    if (branch_id !== undefined) updateData.branch_id = branch_id;
    if (joining_date !== undefined) updateData.joining_date = new Date(joining_date);
    if (employment_type !== undefined) updateData.employment_type = employment_type;
    if (status !== undefined) updateData.status = status;

    // Get staff before update for audit log
    const beforeUpdate = { ...existingStaff };

    const updatedStaff = await StaffModel.update(staffId, updateData);

    // Log the staff update
    if (req.currentUser) {
      await AuditLogModel.logStaffOperation(
        req.currentUser.id,
        'staff.updated',
        staffId,
        beforeUpdate,
        updatedStaff,
        req.ip,
        req.get('User-Agent') || undefined
      );
    }

    return res.json({
      success: true,
      message: 'Staff updated successfully',
      data: { staff: updatedStaff }
    });
  } catch (error) {
    console.error('Update staff error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteStaff = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const staffId = parseInt(typeof idStr === 'string' ? idStr : '');

    if (isNaN(staffId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff ID'
      });
    }

    const existingStaff = await StaffModel.findById(staffId);
    if (!existingStaff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    // Get the associated user to access their email
    const user = await UserModel.findById(existingStaff.user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Associated user not found'
      });
    }

    // Instead of hard deleting, we'll deactivate the staff
    const deactivated = await StaffModel.deactivate(staffId);
    if (!deactivated) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    // Get updated staff record
    const updatedStaff = await StaffModel.findById(staffId);

    // Log the staff deactivation
    if (req.currentUser) {
      await AuditLogModel.logStaffOperation(
        req.currentUser.id,
        'staff.deactivated',
        staffId,
        existingStaff,
        updatedStaff,
        req.ip,
        req.get('User-Agent') || undefined
      );
    }

    // Only remove email if it belongs to our domain
    const emailParts = user.email.split('@');
    if (emailParts.length === 2) {
      const domain = emailParts[1];
      const companyDomain = process.env.CPANEL_DOMAIN || 'example.com';
      
      if (domain === companyDomain) {
        try {
          const emailPrefix = emailParts[0];
          const cpanelService = new CpanelEmailService();
          const deletionResult = await cpanelService.deleteEmailAccount(emailPrefix);
          
          if (deletionResult.success) {
            console.log(`Email account ${user.email} removed from cPanel successfully`);
          } else {
            console.error(`Failed to remove email account ${user.email} from cPanel:`, deletionResult.error);
            // Don't fail the entire operation if email deletion fails
          }
        } catch (emailError) {
          console.error('Error removing email account from cPanel:', emailError);
          // Don't fail the entire operation if email deletion fails
        }
      }
    }

    return res.json({
      success: true,
      message: 'Staff deactivated successfully and email account removed from cPanel if applicable'
    });
  } catch (error) {
    console.error('Deactivate staff error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const terminateStaff = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const staffId = parseInt(typeof idStr === 'string' ? idStr : '');

    if (isNaN(staffId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff ID'
      });
    }

    const existingStaff = await StaffModel.findById(staffId);
    if (!existingStaff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    // Get the associated user to access their email
    const user = await UserModel.findById(existingStaff.user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Associated user not found'
      });
    }

    // Update staff status to terminated
    const updatedStaff = await StaffModel.update(staffId, { status: 'terminated' });
    if (!updatedStaff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    // Log the staff termination
    if (req.currentUser) {
      await AuditLogModel.logStaffOperation(
        req.currentUser.id,
        'staff.terminated',
        staffId,
        existingStaff,
        updatedStaff,
        req.ip,
        req.get('User-Agent') || undefined
      );
    }

    // Only remove email if it belongs to our domain
    const emailParts = user.email.split('@');
    if (emailParts.length === 2) {
      const domain = emailParts[1];
      const companyDomain = process.env.CPANEL_DOMAIN || 'example.com';
      
      if (domain === companyDomain) {
        try {
          const emailPrefix = emailParts[0];
          const cpanelService = new CpanelEmailService();
          const deletionResult = await cpanelService.deleteEmailAccount(emailPrefix);
          
          if (deletionResult.success) {
            console.log(`Email account ${user.email} removed from cPanel successfully`);
          } else {
            console.error(`Failed to remove email account ${user.email} from cPanel:`, deletionResult.error);
            // Don't fail the entire operation if email deletion fails
          }
        } catch (emailError) {
          console.error('Error removing email account from cPanel:', emailError);
          // Don't fail the entire operation if email deletion fails
        }
      }
    }

    return res.json({
      success: true,
      message: 'Staff terminated successfully and email account removed from cPanel if applicable'
    });
  } catch (error) {
    console.error('Terminate staff error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getStaffByDepartment = async (req: Request, res: Response) => {
  try {
    const departmentParam = req.params.department;
    const department = Array.isArray(departmentParam) ? departmentParam[0] : departmentParam;
    const branchId = req.query.branchId ? getNumberQueryParam(req, 'branchId') : undefined;

    if (!department) {
      return res.status(400).json({
        success: false,
        message: 'Department is required'
      });
    }

    const staff = await StaffModel.findByDepartment(department as string, branchId);

    return res.json({
      success: true,
      message: 'Staff retrieved successfully',
      data: { staff, department, branchId }
    });
  } catch (error) {
    console.error('Get staff by department error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};