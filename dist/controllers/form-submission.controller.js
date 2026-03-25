"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFormSubmission = exports.updateFormSubmission = exports.submitForm = exports.getFormSubmissionById = exports.getAllFormSubmissions = void 0;
const form_submission_model_1 = __importDefault(require("../models/form-submission.model"));
const form_model_1 = __importDefault(require("../models/form.model"));
const form_field_model_1 = __importDefault(require("../models/form-field.model"));
const audit_log_model_1 = __importDefault(require("../models/audit-log.model"));
const getAllFormSubmissions = async (req, res) => {
    try {
        const formId = req.query.formId ? parseInt(req.query.formId) : undefined;
        const userId = req.query.userId ? parseInt(req.query.userId) : undefined;
        const status = req.query.status;
        const submissions = await form_submission_model_1.default.findAll(formId, userId, status);
        res.json({
            success: true,
            message: 'Form submissions retrieved successfully',
            data: { submissions }
        });
    }
    catch (error) {
        console.error('Get all form submissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getAllFormSubmissions = getAllFormSubmissions;
const getFormSubmissionById = async (req, res) => {
    try {
        const { id } = req.params;
        const submissionId = parseInt(Array.isArray(id) ? id[0] : id);
        if (isNaN(submissionId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid submission ID'
            });
        }
        const submission = await form_submission_model_1.default.findById(submissionId);
        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Form submission not found'
            });
        }
        return res.json({
            success: true,
            message: 'Form submission retrieved successfully',
            data: { submission }
        });
    }
    catch (error) {
        console.error('Get form submission by ID error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getFormSubmissionById = getFormSubmissionById;
const submitForm = async (req, res) => {
    try {
        const { form_id, submission_data, status, notes } = req.body;
        if (!form_id || !submission_data) {
            return res.status(400).json({
                success: false,
                message: 'Form ID and submission data are required'
            });
        }
        if (!req.currentUser) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        const form = await form_model_1.default.findById(form_id);
        if (!form) {
            return res.status(404).json({
                success: false,
                message: 'Form not found'
            });
        }
        const formFields = await form_field_model_1.default.findByFormId(form_id);
        const errors = [];
        for (const field of formFields) {
            const fieldValue = submission_data[field.field_name];
            if (field.is_required && (fieldValue === undefined || fieldValue === null || fieldValue === '')) {
                errors.push(`Field '${field.field_label}' is required`);
            }
            if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
                switch (field.field_type) {
                    case 'email':
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(fieldValue)) {
                            errors.push(`Field '${field.field_label}' must be a valid email`);
                        }
                        break;
                    case 'number':
                        if (isNaN(fieldValue)) {
                            errors.push(`Field '${field.field_label}' must be a number`);
                        }
                        break;
                    case 'date':
                        const date = new Date(fieldValue);
                        if (isNaN(date.getTime())) {
                            errors.push(`Field '${field.field_label}' must be a valid date`);
                        }
                        break;
                }
                if (field.validation_rule) {
                    try {
                        const regex = new RegExp(field.validation_rule);
                        if (!regex.test(fieldValue)) {
                            errors.push(`Field '${field.field_label}' does not match required format`);
                        }
                    }
                    catch (e) {
                        console.warn(`Invalid validation rule for field ${field.field_name}: ${field.validation_rule}`);
                    }
                }
            }
        }
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }
        const submissionData = {
            form_id,
            user_id: req.currentUser.id,
            submission_data,
            status: status || 'submitted',
            notes
        };
        const newSubmission = await form_submission_model_1.default.create(submissionData);
        await audit_log_model_1.default.logStaffOperation(req.currentUser.id, 'form.submitted', newSubmission.id, null, newSubmission, req.ip, req.get('User-Agent') || undefined);
        return res.status(201).json({
            success: true,
            message: 'Form submitted successfully',
            data: { submission: newSubmission }
        });
    }
    catch (error) {
        console.error('Submit form error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.submitForm = submitForm;
const updateFormSubmission = async (req, res) => {
    try {
        const { id } = req.params;
        const submissionId = parseInt(Array.isArray(id) ? id[0] : id);
        const { status, reviewed_by, reviewed_at, notes } = req.body;
        if (isNaN(submissionId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid submission ID'
            });
        }
        const existingSubmission = await form_submission_model_1.default.findById(submissionId);
        if (!existingSubmission) {
            return res.status(404).json({
                success: false,
                message: 'Form submission not found'
            });
        }
        const updateData = {};
        if (status !== undefined)
            updateData.status = status;
        if (reviewed_by !== undefined)
            updateData.reviewed_by = reviewed_by;
        if (reviewed_at !== undefined)
            updateData.reviewed_at = reviewed_at;
        if (notes !== undefined)
            updateData.notes = notes;
        const updatedSubmission = await form_submission_model_1.default.update(submissionId, updateData);
        if (req.currentUser) {
            await audit_log_model_1.default.logStaffOperation(req.currentUser.id, 'form.submission.updated', submissionId, existingSubmission, updatedSubmission, req.ip, req.get('User-Agent') || undefined);
        }
        return res.json({
            success: true,
            message: 'Form submission updated successfully',
            data: { submission: updatedSubmission }
        });
    }
    catch (error) {
        console.error('Update form submission error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.updateFormSubmission = updateFormSubmission;
const deleteFormSubmission = async (req, res) => {
    try {
        const { id } = req.params;
        const submissionId = parseInt(Array.isArray(id) ? id[0] : id);
        if (isNaN(submissionId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid submission ID'
            });
        }
        const deleted = await form_submission_model_1.default.delete(submissionId);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Form submission not found'
            });
        }
        return res.json({
            success: true,
            message: 'Form submission deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete form submission error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.deleteFormSubmission = deleteFormSubmission;
//# sourceMappingURL=form-submission.controller.js.map