"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removePaymentFromStaff = exports.updateStaffPayment = exports.addPaymentToStaff = exports.getStaffPaymentStructure = void 0;
const staff_payment_structure_model_1 = __importDefault(require("../models/staff-payment-structure.model"));
const payment_type_model_1 = __importDefault(require("../models/payment-type.model"));
const staff_model_1 = __importDefault(require("../models/staff.model"));
const audit_log_model_1 = __importDefault(require("../models/audit-log.model"));
const getStaffPaymentStructure = async (req, res) => {
    try {
        const { id } = req.params;
        const staffId = parseInt(Array.isArray(id) ? id[0] : id);
        if (isNaN(staffId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid staff ID'
            });
        }
        const staff = await staff_model_1.default.findById(staffId);
        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff member not found'
            });
        }
        const paymentStructures = await staff_payment_structure_model_1.default.findByStaffId(staffId);
        const detailedStructures = await Promise.all(paymentStructures.map(async (structure) => {
            const paymentType = await payment_type_model_1.default.findById(structure.payment_type_id);
            return {
                ...structure,
                payment_type_details: paymentType
            };
        }));
        return res.json({
            success: true,
            message: 'Staff payment structure retrieved successfully',
            data: { paymentStructures: detailedStructures }
        });
    }
    catch (error) {
        console.error('Get staff payment structure error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getStaffPaymentStructure = getStaffPaymentStructure;
const addPaymentToStaff = async (req, res) => {
    try {
        const { id } = req.params;
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
        if (!payment_type_id || value === undefined || !effective_from) {
            return res.status(400).json({
                success: false,
                message: 'Payment type ID, value, and effective_from are required'
            });
        }
        const staff = await staff_model_1.default.findById(staffId);
        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff member not found'
            });
        }
        const paymentType = await payment_type_model_1.default.findById(payment_type_id);
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
        const existingStructures = await staff_payment_structure_model_1.default.findByStaffAndPaymentType(staffId, payment_type_id);
        for (const structure of existingStructures) {
            if (effective_to) {
                if ((new Date(effective_from) <= new Date(structure.effective_to) && new Date(effective_to) >= new Date(structure.effective_from)) ||
                    (new Date(structure.effective_from) <= new Date(effective_to) && new Date(structure.effective_to) >= new Date(effective_from))) {
                    return res.status(409).json({
                        success: false,
                        message: `This payment type is already assigned to this staff with overlapping dates (${structure.effective_from} to ${structure.effective_to})`
                    });
                }
            }
            else {
                if (new Date(effective_from) <= new Date(structure.effective_to) && new Date(structure.effective_from) <= new Date(effective_from)) {
                    return res.status(409).json({
                        success: false,
                        message: `This payment type is already assigned to this staff with overlapping dates (${structure.effective_from} to ${structure.effective_to || 'ongoing'})`
                    });
                }
            }
        }
        const paymentStructureData = {
            staff_id: staffId,
            payment_type_id,
            value,
            effective_from: new Date(effective_from),
            effective_to: effective_to ? new Date(effective_to) : null,
            created_by: req.currentUser.id
        };
        const newPaymentStructure = await staff_payment_structure_model_1.default.create(paymentStructureData);
        const paymentTypeDetails = await payment_type_model_1.default.findById(payment_type_id);
        await audit_log_model_1.default.create({
            user_id: req.currentUser.id,
            action: 'staff_payment_structure.created',
            entity_type: 'staff_payment_structure',
            entity_id: newPaymentStructure.id,
            before_data: null,
            after_data: { ...newPaymentStructure, payment_type_details: paymentTypeDetails },
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
        });
        return res.status(201).json({
            success: true,
            message: 'Payment type added to staff successfully',
            data: { paymentStructure: { ...newPaymentStructure, payment_type_details: paymentTypeDetails } }
        });
    }
    catch (error) {
        console.error('Add payment to staff error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.addPaymentToStaff = addPaymentToStaff;
const updateStaffPayment = async (req, res) => {
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
        const existingStructure = await staff_payment_structure_model_1.default.findById(parsedPaymentId);
        if (!existingStructure || existingStructure.staff_id !== parsedStaffId) {
            return res.status(404).json({
                success: false,
                message: 'Payment structure not found for this staff member'
            });
        }
        const updateData = {};
        if (value !== undefined)
            updateData.value = value;
        if (effective_from !== undefined)
            updateData.effective_from = new Date(effective_from);
        if (effective_to !== undefined)
            updateData.effective_to = effective_to ? new Date(effective_to) : null;
        const updatedStructure = await staff_payment_structure_model_1.default.update(parsedPaymentId, updateData);
        const paymentTypeDetails = await payment_type_model_1.default.findById(existingStructure.payment_type_id);
        if (req.currentUser) {
            await audit_log_model_1.default.create({
                user_id: req.currentUser.id,
                action: 'staff_payment_structure.updated',
                entity_type: 'staff_payment_structure',
                entity_id: parsedPaymentId,
                before_data: existingStructure,
                after_data: { ...updatedStructure, payment_type_details: paymentTypeDetails },
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });
        }
        return res.json({
            success: true,
            message: 'Staff payment structure updated successfully',
            data: { paymentStructure: { ...updatedStructure, payment_type_details: paymentTypeDetails } }
        });
    }
    catch (error) {
        console.error('Update staff payment error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.updateStaffPayment = updateStaffPayment;
const removePaymentFromStaff = async (req, res) => {
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
        const existingStructure = await staff_payment_structure_model_1.default.findById(parsedPaymentId);
        if (!existingStructure || existingStructure.staff_id !== parsedStaffId) {
            return res.status(404).json({
                success: false,
                message: 'Payment structure not found for this staff member'
            });
        }
        const deactivated = await staff_payment_structure_model_1.default.deactivate(parsedPaymentId, new Date());
        if (!deactivated) {
            return res.status(404).json({
                success: false,
                message: 'Payment structure not found'
            });
        }
        const updatedStructure = await staff_payment_structure_model_1.default.findById(parsedPaymentId);
        const paymentTypeDetails = await payment_type_model_1.default.findById(existingStructure.payment_type_id);
        if (req.currentUser) {
            await audit_log_model_1.default.create({
                user_id: req.currentUser.id,
                action: 'staff_payment_structure.deactivated',
                entity_type: 'staff_payment_structure',
                entity_id: parsedPaymentId,
                before_data: existingStructure,
                after_data: { ...updatedStructure, payment_type_details: paymentTypeDetails },
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });
        }
        return res.json({
            success: true,
            message: 'Payment type removed from staff successfully',
            data: { paymentStructure: { ...updatedStructure, payment_type_details: paymentTypeDetails } }
        });
    }
    catch (error) {
        console.error('Remove payment from staff error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.removePaymentFromStaff = removePaymentFromStaff;
//# sourceMappingURL=staff-payment-structure.controller.js.map