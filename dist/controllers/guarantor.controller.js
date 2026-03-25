"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadGuarantorDocument = exports.verifyGuarantor = exports.deleteGuarantor = exports.updateGuarantor = exports.createGuarantor = exports.getGuarantor = exports.getGuarantors = void 0;
const guarantor_model_1 = __importDefault(require("../models/guarantor.model"));
const staff_model_1 = __importDefault(require("../models/staff.model"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const getGuarantors = async (req, res) => {
    try {
        const staffId = req.params.staffId ? parseInt(req.params.staffId) : undefined;
        const isActiveOnly = req.query.isActiveOnly === 'true';
        if (!staffId) {
            return res.status(400).json({
                success: false,
                message: 'Staff ID is required'
            });
        }
        const guarantors = await guarantor_model_1.default.findByStaffId(staffId, isActiveOnly);
        return res.json({
            success: true,
            message: 'Guarantors retrieved successfully',
            data: { guarantors }
        });
    }
    catch (error) {
        console.error('Get guarantors error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getGuarantors = getGuarantors;
const getGuarantor = async (req, res) => {
    try {
        const guarantorId = parseInt(req.params.id);
        if (isNaN(guarantorId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid guarantor ID'
            });
        }
        const guarantor = await guarantor_model_1.default.findById(guarantorId);
        if (!guarantor) {
            return res.status(404).json({
                success: false,
                message: 'Guarantor not found'
            });
        }
        return res.json({
            success: true,
            message: 'Guarantor retrieved successfully',
            data: { guarantor }
        });
    }
    catch (error) {
        console.error('Get guarantor error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getGuarantor = getGuarantor;
const createGuarantor = async (req, res) => {
    try {
        const { staff_id, first_name, last_name, middle_name, date_of_birth, gender, phone_number, alternate_phone, email, address_line_1, address_line_2, city, state, postal_code, country, id_type, id_number, id_issuing_authority, id_issue_date, id_expiry_date, relationship, occupation, employer_name, employer_address, employer_phone, guarantee_type, guarantee_amount, guarantee_start_date, guarantee_end_date, guarantee_terms, is_active } = req.body;
        if (!staff_id || !first_name || !last_name || !phone_number || !address_line_1) {
            return res.status(400).json({
                success: false,
                message: 'Staff ID, first name, last name, phone number, and address are required'
            });
        }
        const staff = await staff_model_1.default.findById(staff_id);
        if (!staff) {
            return res.status(404).json({
                success: false,
                message: 'Staff member not found'
            });
        }
        const guarantorData = {
            staff_id,
            first_name,
            last_name,
            middle_name,
            date_of_birth: date_of_birth ? new Date(date_of_birth) : undefined,
            gender,
            phone_number,
            alternate_phone,
            email,
            address_line_1,
            address_line_2,
            city,
            state,
            postal_code,
            country: country || 'Nigeria',
            id_type,
            id_number,
            id_issuing_authority,
            id_issue_date: id_issue_date ? new Date(id_issue_date) : undefined,
            id_expiry_date: id_expiry_date ? new Date(id_expiry_date) : undefined,
            relationship,
            occupation,
            employer_name,
            employer_address,
            employer_phone,
            guarantee_type,
            guarantee_amount,
            guarantee_start_date: guarantee_start_date ? new Date(guarantee_start_date) : undefined,
            guarantee_end_date: guarantee_end_date ? new Date(guarantee_end_date) : undefined,
            guarantee_terms,
            is_active: is_active !== undefined ? is_active : true
        };
        const guarantor = await guarantor_model_1.default.create(guarantorData);
        return res.status(201).json({
            success: true,
            message: 'Guarantor created successfully',
            data: { guarantor }
        });
    }
    catch (error) {
        console.error('Create guarantor error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.createGuarantor = createGuarantor;
const updateGuarantor = async (req, res) => {
    try {
        const guarantorId = parseInt(req.params.id);
        if (isNaN(guarantorId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid guarantor ID'
            });
        }
        const guarantor = await guarantor_model_1.default.findById(guarantorId);
        if (!guarantor) {
            return res.status(404).json({
                success: false,
                message: 'Guarantor not found'
            });
        }
        const updateData = {};
        const allowedFields = [
            'first_name', 'middle_name', 'last_name', 'date_of_birth', 'gender',
            'phone_number', 'alternate_phone', 'email',
            'address_line_1', 'address_line_2', 'city', 'state', 'postal_code', 'country',
            'id_type', 'id_number', 'id_issuing_authority', 'id_issue_date', 'id_expiry_date',
            'relationship', 'occupation', 'employer_name', 'employer_address', 'employer_phone',
            'guarantee_type', 'guarantee_amount', 'guarantee_start_date', 'guarantee_end_date', 'guarantee_terms',
            'guarantor_form_path', 'id_document_path',
            'is_verified', 'verification_notes', 'is_active'
        ];
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                if (field.includes('_date') && req.body[field]) {
                    updateData[field] = new Date(req.body[field]);
                }
                else {
                    updateData[field] = req.body[field];
                }
            }
        }
        const updatedGuarantor = await guarantor_model_1.default.update(guarantorId, updateData);
        return res.json({
            success: true,
            message: 'Guarantor updated successfully',
            data: { guarantor: updatedGuarantor }
        });
    }
    catch (error) {
        console.error('Update guarantor error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.updateGuarantor = updateGuarantor;
const deleteGuarantor = async (req, res) => {
    try {
        const guarantorId = parseInt(req.params.id);
        if (isNaN(guarantorId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid guarantor ID'
            });
        }
        const guarantor = await guarantor_model_1.default.findById(guarantorId);
        if (!guarantor) {
            return res.status(404).json({
                success: false,
                message: 'Guarantor not found'
            });
        }
        if (guarantor.guarantor_form_path) {
            const formPath = path_1.default.join(process.cwd(), guarantor.guarantor_form_path);
            if (fs_1.default.existsSync(formPath)) {
                fs_1.default.unlinkSync(formPath);
            }
        }
        if (guarantor.id_document_path) {
            const idPath = path_1.default.join(process.cwd(), guarantor.id_document_path);
            if (fs_1.default.existsSync(idPath)) {
                fs_1.default.unlinkSync(idPath);
            }
        }
        await guarantor_model_1.default.delete(guarantorId);
        return res.json({
            success: true,
            message: 'Guarantor deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete guarantor error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.deleteGuarantor = deleteGuarantor;
const verifyGuarantor = async (req, res) => {
    try {
        const guarantorId = parseInt(req.params.id);
        const { verification_notes } = req.body;
        const verifiedBy = req.currentUser?.id;
        if (isNaN(guarantorId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid guarantor ID'
            });
        }
        if (!verifiedBy) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: No user information'
            });
        }
        const guarantor = await guarantor_model_1.default.findById(guarantorId);
        if (!guarantor) {
            return res.status(404).json({
                success: false,
                message: 'Guarantor not found'
            });
        }
        const updatedGuarantor = await guarantor_model_1.default.verify(guarantorId, verifiedBy, verification_notes);
        return res.json({
            success: true,
            message: 'Guarantor verified successfully',
            data: { guarantor: updatedGuarantor }
        });
    }
    catch (error) {
        console.error('Verify guarantor error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.verifyGuarantor = verifyGuarantor;
const uploadGuarantorDocument = async (req, res) => {
    try {
        const guarantorId = parseInt(req.params.id);
        const documentType = req.params.documentType;
        if (isNaN(guarantorId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid guarantor ID'
            });
        }
        const guarantor = await guarantor_model_1.default.findById(guarantorId);
        if (!guarantor) {
            return res.status(404).json({
                success: false,
                message: 'Guarantor not found'
            });
        }
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }
        const file = req.files[0];
        const filePath = `/uploads/guarantors/${file.filename}`;
        const oldFilePath = documentType === 'id'
            ? guarantor.id_document_path
            : guarantor.guarantor_form_path;
        if (oldFilePath) {
            const oldFileFullPath = path_1.default.join(process.cwd(), oldFilePath);
            if (fs_1.default.existsSync(oldFileFullPath)) {
                fs_1.default.unlinkSync(oldFileFullPath);
            }
        }
        const updateData = documentType === 'id'
            ? { id_document_path: filePath }
            : { guarantor_form_path: filePath };
        const updatedGuarantor = await guarantor_model_1.default.update(guarantorId, updateData);
        return res.json({
            success: true,
            message: 'Document uploaded successfully',
            data: {
                guarantor: updatedGuarantor,
                file_path: filePath
            }
        });
    }
    catch (error) {
        console.error('Upload guarantor document error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.uploadGuarantorDocument = uploadGuarantorDocument;
//# sourceMappingURL=guarantor.controller.js.map