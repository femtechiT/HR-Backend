import { Request, Response } from 'express';
import StaffPaymentStructureModel, { StaffPaymentStructureInput, StaffPaymentStructureUpdate } from '../models/staff-payment-structure.model';
import PaymentTypeModel from '../models/payment-type.model';
import StaffModel from '../models/staff.model';
import AuditLogModel from '../models/audit-log.model';

// Controller for staff payment structure management
export const getStaffPaymentStructure = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const staffId = parseInt(Array.isArray(id) ? id[0] : id);

    if (isNaN(staffId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff ID'
      });
    }

    // Check if staff exists
    const staff = await StaffModel.findById(staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Get current payment structure for the staff
    const paymentStructures = await StaffPaymentStructureModel.findByStaffId(staffId);

    // Get detailed payment type information
    const detailedStructures = await Promise.all(
      paymentStructures.map(async (structure) => {
        const paymentType = await PaymentTypeModel.findById(structure.payment_type_id);
        return {
          ...structure,
          payment_type_details: paymentType
        };
      })
    );

    return res.json({
      success: true,
      message: 'Staff payment structure retrieved successfully',
      data: { paymentStructures: detailedStructures }
    });
  } catch (error) {
    console.error('Get staff payment structure error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const addPaymentToStaff = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // staff id
    const staffId = parseInt(Array.isArray(id) ? id[0] : id);
    const { payment_type_id, value, effective_from, effective_to } = req.body;

    if (isNaN(staffId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff ID'
      });
    }

    if (!req.currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Validate required fields
    if (!payment_type_id || value === undefined || !effective_from) {
      return res.status(400).json({
        success: false,
        message: 'Payment type ID, value, and effective_from are required'
      });
    }

    // Check if staff exists
    const staff = await StaffModel.findById(staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Check if payment type exists and is active
    const paymentType = await PaymentTypeModel.findById(payment_type_id);
    if (!paymentType) {
      return res.status(404).json({
        success: false,
        message: 'Payment type not found'
      });
    }

    if (!paymentType.is_active) {
      return res.status(400).json({
        success: false,
        message: 'Payment type is not active'
      });
    }

    // Check if this payment type is already assigned to the staff member with overlapping dates
    const existingStructures = await StaffPaymentStructureModel.findByStaffAndPaymentType(staffId, payment_type_id);
    
    // Check for overlapping effective dates
    for (const structure of existingStructures) {
      if (effective_to) {
        // New structure has end date
        if (
          (new Date(effective_from) <= new Date(structure.effective_to!) && new Date(effective_to) >= new Date(structure.effective_from)) ||
          (new Date(structure.effective_from) <= new Date(effective_to) && new Date(structure.effective_to!) >= new Date(effective_from))
        ) {
          return res.status(409).json({
            success: false,
            message: `This payment type is already assigned to this staff with overlapping dates (${structure.effective_from} to ${structure.effective_to})`
          });
        }
      } else {
        // New structure has no end date (ongoing)
        if (new Date(effective_from) <= new Date(structure.effective_to!) && new Date(structure.effective_from) <= new Date(effective_from)) {
          return res.status(409).json({
            success: false,
            message: `This payment type is already assigned to this staff with overlapping dates (${structure.effective_from} to ${structure.effective_to || 'ongoing'})`
          });
        }
      }
    }

    // Create the staff payment structure
    const paymentStructureData: StaffPaymentStructureInput = {
      staff_id: staffId,
      payment_type_id,
      value,
      effective_from: new Date(effective_from),
      effective_to: effective_to ? new Date(effective_to) : null,
      created_by: req.currentUser.id
    };

    const newPaymentStructure = await StaffPaymentStructureModel.create(paymentStructureData);

    // Get the payment type details for logging
    const paymentTypeDetails = await PaymentTypeModel.findById(payment_type_id);

    // Log the staff payment structure creation
    await AuditLogModel.create({
      user_id: req.currentUser.id,
      action: 'staff_payment_structure.created',
      entity_type: 'staff_payment_structure',
      entity_id: newPaymentStructure.id,
      before_data: null,
      after_data: { ...newPaymentStructure, payment_type_details: paymentTypeDetails },
      ip_address: req.ip,
      user_agent: req.get('User-Agent') || null
    });

    return res.status(201).json({
      success: true,
      message: 'Payment type added to staff successfully',
      data: { paymentStructure: { ...newPaymentStructure, payment_type_details: paymentTypeDetails } }
    });
  } catch (error) {
    console.error('Add payment to staff error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateStaffPayment = async (req: Request, res: Response) => {
  try {
    const { staffId, paymentId } = req.params;
    const parsedStaffId = parseInt(Array.isArray(staffId) ? staffId[0] : staffId);
    const parsedPaymentId = parseInt(Array.isArray(paymentId) ? paymentId[0] : paymentId);
    const { value, effective_from, effective_to } = req.body;

    if (isNaN(parsedStaffId) || isNaN(parsedPaymentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff ID or payment structure ID'
      });
    }

    // Check if the payment structure exists and belongs to the staff
    const existingStructure = await StaffPaymentStructureModel.findById(parsedPaymentId);
    if (!existingStructure || existingStructure.staff_id !== parsedStaffId) {
      return res.status(404).json({
        success: false,
        message: 'Payment structure not found for this staff member'
      });
    }

    // Prepare update data
    const updateData: StaffPaymentStructureUpdate = {};
    if (value !== undefined) updateData.value = value;
    if (effective_from !== undefined) updateData.effective_from = new Date(effective_from);
    if (effective_to !== undefined) updateData.effective_to = effective_to ? new Date(effective_to) : null;

    const updatedStructure = await StaffPaymentStructureModel.update(parsedPaymentId, updateData);

    // Get the payment type details for response
    const paymentTypeDetails = await PaymentTypeModel.findById(existingStructure.payment_type_id);

    // Log the staff payment structure update
    if (req.currentUser) {
      await AuditLogModel.create({
        user_id: req.currentUser.id,
        action: 'staff_payment_structure.updated',
        entity_type: 'staff_payment_structure',
        entity_id: parsedPaymentId,
        before_data: existingStructure,
        after_data: { ...updatedStructure, payment_type_details: paymentTypeDetails },
        ip_address: req.ip,
        user_agent: req.get('User-Agent') || null
      });
    }

    return res.json({
      success: true,
      message: 'Staff payment structure updated successfully',
      data: { paymentStructure: { ...updatedStructure, payment_type_details: paymentTypeDetails } }
    });
  } catch (error) {
    console.error('Update staff payment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const removePaymentFromStaff = async (req: Request, res: Response) => {
  try {
    const { staffId, paymentId } = req.params;
    const parsedStaffId = parseInt(Array.isArray(staffId) ? staffId[0] : staffId);
    const parsedPaymentId = parseInt(Array.isArray(paymentId) ? paymentId[0] : paymentId);

    if (isNaN(parsedStaffId) || isNaN(parsedPaymentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff ID or payment structure ID'
      });
    }

    // Check if the payment structure exists and belongs to the staff
    const existingStructure = await StaffPaymentStructureModel.findById(parsedPaymentId);
    if (!existingStructure || existingStructure.staff_id !== parsedStaffId) {
      return res.status(404).json({
        success: false,
        message: 'Payment structure not found for this staff member'
      });
    }

    // Instead of deleting, we'll deactivate by setting effective_to to today
    const deactivated = await StaffPaymentStructureModel.deactivate(parsedPaymentId, new Date());

    if (!deactivated) {
      return res.status(404).json({
        success: false,
        message: 'Payment structure not found'
      });
    }

    // Get updated structure
    const updatedStructure = await StaffPaymentStructureModel.findById(parsedPaymentId);

    // Get the payment type details for response
    const paymentTypeDetails = await PaymentTypeModel.findById(existingStructure.payment_type_id);

    // Log the staff payment structure removal
    if (req.currentUser) {
      await AuditLogModel.create({
        user_id: req.currentUser.id,
        action: 'staff_payment_structure.deactivated',
        entity_type: 'staff_payment_structure',
        entity_id: parsedPaymentId,
        before_data: existingStructure,
        after_data: { ...updatedStructure, payment_type_details: paymentTypeDetails },
        ip_address: req.ip,
        user_agent: req.get('User-Agent') || null
      });
    }

    return res.json({
      success: true,
      message: 'Payment type removed from staff successfully',
      data: { paymentStructure: { ...updatedStructure, payment_type_details: paymentTypeDetails } }
    });
  } catch (error) {
    console.error('Remove payment from staff error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};