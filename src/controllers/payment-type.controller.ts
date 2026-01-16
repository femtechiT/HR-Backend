import { Request, Response } from 'express';
import PaymentTypeModel, { PaymentTypeInput, PaymentTypeUpdate } from '../models/payment-type.model';
import AuditLogModel from '../models/audit-log.model';

// Controller for payment type management
export const getAllPaymentTypes = async (req: Request, res: Response) => {
  try {
    const paymentTypes = await PaymentTypeModel.findAll();

    res.json({
      success: true,
      message: 'Payment types retrieved successfully',
      data: { paymentTypes }
    });
  } catch (error) {
    console.error('Get all payment types error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getPaymentTypeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const paymentTypeId = parseInt(Array.isArray(id) ? id[0] : id);

    if (isNaN(paymentTypeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment type ID'
      });
    }

    const paymentType = await PaymentTypeModel.findById(paymentTypeId);
    if (!paymentType) {
      return res.status(404).json({
        success: false,
        message: 'Payment type not found'
      });
    }

    return res.json({
      success: true,
      message: 'Payment type retrieved successfully',
      data: { paymentType }
    });
  } catch (error) {
    console.error('Get payment type by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const createPaymentType = async (req: Request, res: Response) => {
  try {
    const { name, payment_category, calculation_type, formula, applies_to_all } = req.body;

    // Validate required fields
    if (!name || !payment_category || !calculation_type) {
      return res.status(400).json({
        success: false,
        message: 'Payment type name, category, and calculation type are required'
      });
    }

    if (!req.currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if payment type with this name already exists
    const existingPaymentType = await PaymentTypeModel.findByName(name);
    if (existingPaymentType) {
      return res.status(409).json({
        success: false,
        message: 'A payment type with this name already exists'
      });
    }

    // Create the payment type
    const paymentTypeData: PaymentTypeInput = {
      name,
      payment_category,
      calculation_type,
      formula,
      applies_to_all,
      created_by: req.currentUser.id
    };

    const newPaymentType = await PaymentTypeModel.create(paymentTypeData);

    // Log the payment type creation
    await AuditLogModel.create({
      user_id: req.currentUser.id,
      action: 'payment_type.created',
      entity_type: 'payment_type',
      entity_id: newPaymentType.id,
      before_data: null,
      after_data: newPaymentType,
      ip_address: req.ip,
      user_agent: req.get('User-Agent') || null
    });

    return res.status(201).json({
      success: true,
      message: 'Payment type created successfully',
      data: { paymentType: newPaymentType }
    });
  } catch (error) {
    console.error('Create payment type error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updatePaymentType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const paymentTypeId = parseInt(Array.isArray(id) ? id[0] : id);
    const { name, payment_category, calculation_type, formula, applies_to_all, is_active } = req.body;

    if (isNaN(paymentTypeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment type ID'
      });
    }

    // Check if payment type exists
    const existingPaymentType = await PaymentTypeModel.findById(paymentTypeId);
    if (!existingPaymentType) {
      return res.status(404).json({
        success: false,
        message: 'Payment type not found'
      });
    }

    // Prepare update data
    const updateData: PaymentTypeUpdate = {};
    if (name !== undefined) updateData.name = name;
    if (payment_category !== undefined) updateData.payment_category = payment_category;
    if (calculation_type !== undefined) updateData.calculation_type = calculation_type;
    if (formula !== undefined) updateData.formula = formula;
    if (applies_to_all !== undefined) updateData.applies_to_all = applies_to_all;
    if (is_active !== undefined) updateData.is_active = is_active;

    const updatedPaymentType = await PaymentTypeModel.update(paymentTypeId, updateData);

    // Log the payment type update
    if (req.currentUser) {
      await AuditLogModel.create({
        user_id: req.currentUser.id,
        action: 'payment_type.updated',
        entity_type: 'payment_type',
        entity_id: paymentTypeId,
        before_data: existingPaymentType,
        after_data: updatedPaymentType,
        ip_address: req.ip,
        user_agent: req.get('User-Agent') || null
      });
    }

    return res.json({
      success: true,
      message: 'Payment type updated successfully',
      data: { paymentType: updatedPaymentType }
    });
  } catch (error) {
    console.error('Update payment type error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deletePaymentType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const paymentTypeId = parseInt(Array.isArray(id) ? id[0] : id);

    if (isNaN(paymentTypeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment type ID'
      });
    }

    const existingPaymentType = await PaymentTypeModel.findById(paymentTypeId);
    if (!existingPaymentType) {
      return res.status(404).json({
        success: false,
        message: 'Payment type not found'
      });
    }

    // Instead of hard deleting, we'll deactivate the payment type
    const deactivated = await PaymentTypeModel.delete(paymentTypeId);
    if (!deactivated) {
      return res.status(404).json({
        success: false,
        message: 'Payment type not found'
      });
    }

    // Get updated payment type record
    const updatedPaymentType = await PaymentTypeModel.findById(paymentTypeId);

    // Log the payment type deactivation
    if (req.currentUser) {
      await AuditLogModel.create({
        user_id: req.currentUser.id,
        action: 'payment_type.deactivated',
        entity_type: 'payment_type',
        entity_id: paymentTypeId,
        before_data: existingPaymentType,
        after_data: updatedPaymentType,
        ip_address: req.ip,
        user_agent: req.get('User-Agent') || null
      });
    }

    return res.json({
      success: true,
      message: 'Payment type deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate payment type error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const activatePaymentType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const paymentTypeId = parseInt(Array.isArray(id) ? id[0] : id);

    if (isNaN(paymentTypeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment type ID'
      });
    }

    const existingPaymentType = await PaymentTypeModel.findById(paymentTypeId);
    if (!existingPaymentType) {
      return res.status(404).json({
        success: false,
        message: 'Payment type not found'
      });
    }

    // Activate the payment type
    const activated = await PaymentTypeModel.activate(paymentTypeId);
    if (!activated) {
      return res.status(404).json({
        success: false,
        message: 'Payment type not found'
      });
    }

    // Get updated payment type record
    const updatedPaymentType = await PaymentTypeModel.findById(paymentTypeId);

    // Log the payment type activation
    if (req.currentUser) {
      await AuditLogModel.create({
        user_id: req.currentUser.id,
        action: 'payment_type.activated',
        entity_type: 'payment_type',
        entity_id: paymentTypeId,
        before_data: existingPaymentType,
        after_data: updatedPaymentType,
        ip_address: req.ip,
        user_agent: req.get('User-Agent') || null
      });
    }

    return res.json({
      success: true,
      message: 'Payment type activated successfully',
      data: { paymentType: updatedPaymentType }
    });
  } catch (error) {
    console.error('Activate payment type error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};