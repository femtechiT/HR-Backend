"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activatePaymentType = exports.deletePaymentType = exports.updatePaymentType = exports.createPaymentType = exports.getPaymentTypeById = exports.getAllPaymentTypes = void 0;
const payment_type_model_1 = __importDefault(require("../models/payment-type.model"));
const audit_log_model_1 = __importDefault(require("../models/audit-log.model"));
const getAllPaymentTypes = async (req, res) => {
    try {
        const paymentTypes = await payment_type_model_1.default.findAll();
        res.json({
            success: true,
            message: 'Payment types retrieved successfully',
            data: { paymentTypes }
        });
    }
    catch (error) {
        console.error('Get all payment types error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getAllPaymentTypes = getAllPaymentTypes;
const getPaymentTypeById = async (req, res) => {
    try {
        const { id } = req.params;
        const paymentTypeId = parseInt(Array.isArray(id) ? id[0] : id);
        if (isNaN(paymentTypeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment type ID'
            });
        }
        const paymentType = await payment_type_model_1.default.findById(paymentTypeId);
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
    }
    catch (error) {
        console.error('Get payment type by ID error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getPaymentTypeById = getPaymentTypeById;
const createPaymentType = async (req, res) => {
    try {
        const { name, payment_category, calculation_type, formula, applies_to_all } = req.body;
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
        const existingPaymentType = await payment_type_model_1.default.findByName(name);
        if (existingPaymentType) {
            return res.status(409).json({
                success: false,
                message: 'A payment type with this name already exists'
            });
        }
        const paymentTypeData = {
            name,
            payment_category,
            calculation_type,
            formula,
            applies_to_all,
            created_by: req.currentUser.id
        };
        const newPaymentType = await payment_type_model_1.default.create(paymentTypeData);
        await audit_log_model_1.default.create({
            user_id: req.currentUser.id,
            action: 'payment_type.created',
            entity_type: 'payment_type',
            entity_id: newPaymentType.id,
            before_data: null,
            after_data: newPaymentType,
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });
        return res.status(201).json({
            success: true,
            message: 'Payment type created successfully',
            data: { paymentType: newPaymentType }
        });
    }
    catch (error) {
        console.error('Create payment type error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.createPaymentType = createPaymentType;
const updatePaymentType = async (req, res) => {
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
        const existingPaymentType = await payment_type_model_1.default.findById(paymentTypeId);
        if (!existingPaymentType) {
            return res.status(404).json({
                success: false,
                message: 'Payment type not found'
            });
        }
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        if (payment_category !== undefined)
            updateData.payment_category = payment_category;
        if (calculation_type !== undefined)
            updateData.calculation_type = calculation_type;
        if (formula !== undefined)
            updateData.formula = formula;
        if (applies_to_all !== undefined)
            updateData.applies_to_all = applies_to_all;
        if (is_active !== undefined)
            updateData.is_active = is_active;
        const updatedPaymentType = await payment_type_model_1.default.update(paymentTypeId, updateData);
        if (req.currentUser) {
            await audit_log_model_1.default.create({
                user_id: req.currentUser.id,
                action: 'payment_type.updated',
                entity_type: 'payment_type',
                entity_id: paymentTypeId,
                before_data: existingPaymentType,
                after_data: updatedPaymentType,
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });
        }
        return res.json({
            success: true,
            message: 'Payment type updated successfully',
            data: { paymentType: updatedPaymentType }
        });
    }
    catch (error) {
        console.error('Update payment type error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.updatePaymentType = updatePaymentType;
const deletePaymentType = async (req, res) => {
    try {
        const { id } = req.params;
        const paymentTypeId = parseInt(Array.isArray(id) ? id[0] : id);
        if (isNaN(paymentTypeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment type ID'
            });
        }
        const existingPaymentType = await payment_type_model_1.default.findById(paymentTypeId);
        if (!existingPaymentType) {
            return res.status(404).json({
                success: false,
                message: 'Payment type not found'
            });
        }
        const deactivated = await payment_type_model_1.default.delete(paymentTypeId);
        if (!deactivated) {
            return res.status(404).json({
                success: false,
                message: 'Payment type not found'
            });
        }
        const updatedPaymentType = await payment_type_model_1.default.findById(paymentTypeId);
        if (req.currentUser) {
            await audit_log_model_1.default.create({
                user_id: req.currentUser.id,
                action: 'payment_type.deactivated',
                entity_type: 'payment_type',
                entity_id: paymentTypeId,
                before_data: existingPaymentType,
                after_data: updatedPaymentType,
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });
        }
        return res.json({
            success: true,
            message: 'Payment type deactivated successfully'
        });
    }
    catch (error) {
        console.error('Deactivate payment type error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.deletePaymentType = deletePaymentType;
const activatePaymentType = async (req, res) => {
    try {
        const { id } = req.params;
        const paymentTypeId = parseInt(Array.isArray(id) ? id[0] : id);
        if (isNaN(paymentTypeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment type ID'
            });
        }
        const existingPaymentType = await payment_type_model_1.default.findById(paymentTypeId);
        if (!existingPaymentType) {
            return res.status(404).json({
                success: false,
                message: 'Payment type not found'
            });
        }
        const activated = await payment_type_model_1.default.activate(paymentTypeId);
        if (!activated) {
            return res.status(404).json({
                success: false,
                message: 'Payment type not found'
            });
        }
        const updatedPaymentType = await payment_type_model_1.default.findById(paymentTypeId);
        if (req.currentUser) {
            await audit_log_model_1.default.create({
                user_id: req.currentUser.id,
                action: 'payment_type.activated',
                entity_type: 'payment_type',
                entity_id: paymentTypeId,
                before_data: existingPaymentType,
                after_data: updatedPaymentType,
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });
        }
        return res.json({
            success: true,
            message: 'Payment type activated successfully',
            data: { paymentType: updatedPaymentType }
        });
    }
    catch (error) {
        console.error('Activate payment type error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.activatePaymentType = activatePaymentType;
//# sourceMappingURL=payment-type.controller.js.map