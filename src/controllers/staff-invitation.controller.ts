import { Request, Response } from 'express';
import StaffInvitationService from '../services/staff-invitation.service';
import { getNumberQueryParam } from '../utils/type-utils';

interface InviteStaffRequestBody {
  firstName: string;
  lastName: string;
  personalEmail: string;
  roleId: number;
  branchId?: number;
}

export const inviteNewStaff = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, personalEmail, roleId, branchId }: InviteStaffRequestBody = req.body;

    // Validate required fields
    if (!firstName || !lastName || !personalEmail || !roleId) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, personal email, and role ID are required'
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(personalEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid personal email format'
      });
    }

    // Initialize the invitation service
    const invitationService = new StaffInvitationService();

    // Invite the new staff member
    const result = await invitationService.inviteNewStaff({
      firstName,
      lastName,
      personalEmail,
      roleId,
      branchId
    });

    if (result.success) {
      return res.status(201).json({
        success: true,
        message: 'Staff member invited successfully',
        data: {
          workEmail: result.workEmail
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.error || 'Failed to invite staff member',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Invite new staff error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deactivateStaff = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id;
    const idStr = Array.isArray(idParam) ? idParam[0] : idParam;
    const userId = parseInt(typeof idStr === 'string' ? idStr : '');
    const removeEmail = req.query.removeEmail === 'true';

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    // Initialize the invitation service
    const invitationService = new StaffInvitationService();

    // Deactivate the staff member
    const result = await invitationService.deactivateStaff(userId, removeEmail);

    if (result.success) {
      return res.json({
        success: true,
        message: removeEmail
          ? 'Staff member deactivated successfully and email account removed from cPanel'
          : 'Staff member deactivated successfully'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: result.error || 'Failed to deactivate staff member',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Deactivate staff error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};