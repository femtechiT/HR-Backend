"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFormFields = exports.deleteForm = exports.updateForm = exports.createForm = exports.getFormById = exports.getAllForms = void 0;
const form_model_1 = __importDefault(require("../models/form.model"));
const form_field_model_1 = __importDefault(require("../models/form-field.model"));
const audit_log_model_1 = __importDefault(require("../models/audit-log.model"));
const getAllForms = async (req, res) => {
    try {
        const branchId = req.query.branchId ? parseInt(req.query.branchId) : undefined;
        const forms = await form_model_1.default.findAll(branchId);
        res.json({
            success: true,
            message: 'Forms retrieved successfully',
            data: { forms }
        });
    }
    catch (error) {
        console.error('Get all forms error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getAllForms = getAllForms;
const getFormById = async (req, res) => {
    try {
        const { id } = req.params;
        const formId = parseInt(Array.isArray(id) ? id[0] : id);
        if (isNaN(formId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid form ID'
            });
        }
        const form = await form_model_1.default.findById(formId);
        if (!form) {
            return res.status(404).json({
                success: false,
                message: 'Form not found'
            });
        }
        const fields = await form_field_model_1.default.findByFormId(formId);
        return res.json({
            success: true,
            message: 'Form retrieved successfully',
            data: { form, fields }
        });
    }
    catch (error) {
        console.error('Get form by ID error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getFormById = getFormById;
const createForm = async (req, res) => {
    try {
        const { name, description, form_type, branch_id, fields } = req.body;
        if (!name || !form_type) {
            return res.status(400).json({
                success: false,
                message: 'Form name and type are required'
            });
        }
        if (!req.currentUser) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        const formData = {
            name,
            description,
            form_type,
            branch_id,
            created_by: req.currentUser.id
        };
        const newForm = await form_model_1.default.create(formData);
        if (fields && Array.isArray(fields) && fields.length > 0) {
            for (const field of fields) {
                if (!field ||
                    field.field_name === undefined || field.field_name === null || field.field_name === '' ||
                    field.field_label === undefined || field.field_label === null || field.field_label === '' ||
                    field.field_type === undefined || field.field_type === null || field.field_type === '') {
                    console.warn('Skipping incomplete or null field:', field);
                    continue;
                }
                const fieldData = {
                    form_id: newForm.id,
                    field_name: field.field_name ?? null,
                    field_label: field.field_label ?? null,
                    field_type: field.field_type ?? null,
                    is_required: field.is_required ?? false,
                    placeholder: field.placeholder ?? null,
                    help_text: field.help_text ?? null,
                    validation_rule: field.validation_rule ?? null,
                    options: field.options ?? null,
                    field_order: field.field_order ?? 0
                };
                await form_field_model_1.default.create(fieldData);
            }
        }
        if (req.currentUser) {
            await audit_log_model_1.default.create({
                user_id: req.currentUser.id,
                action: 'form.created',
                entity_type: 'form',
                entity_id: newForm.id,
                before_data: null,
                after_data: newForm,
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });
        }
        return res.status(201).json({
            success: true,
            message: 'Form created successfully',
            data: { form: newForm }
        });
    }
    catch (error) {
        console.error('Create form error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.createForm = createForm;
const updateForm = async (req, res) => {
    try {
        const { id } = req.params;
        const formId = parseInt(Array.isArray(id) ? id[0] : id);
        const { name, description, form_type, branch_id, is_active, fields } = req.body;
        if (isNaN(formId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid form ID'
            });
        }
        const existingForm = await form_model_1.default.findById(formId);
        if (!existingForm) {
            return res.status(404).json({
                success: false,
                message: 'Form not found'
            });
        }
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        if (description !== undefined)
            updateData.description = description;
        if (form_type !== undefined)
            updateData.form_type = form_type;
        if (branch_id !== undefined)
            updateData.branch_id = branch_id;
        if (is_active !== undefined)
            updateData.is_active = is_active;
        const updatedForm = await form_model_1.default.update(formId, updateData);
        if (fields && Array.isArray(fields)) {
            await form_field_model_1.default.deleteByFormId(formId);
            for (const field of fields) {
                if (!field ||
                    field.field_name === undefined || field.field_name === null || field.field_name === '' ||
                    field.field_label === undefined || field.field_label === null || field.field_label === '' ||
                    field.field_type === undefined || field.field_type === null || field.field_type === '') {
                    console.warn('Skipping incomplete field during update:', field);
                    continue;
                }
                const fieldData = {
                    form_id: formId,
                    field_name: field.field_name ?? null,
                    field_label: field.field_label ?? null,
                    field_type: field.field_type ?? null,
                    is_required: field.is_required ?? false,
                    placeholder: field.placeholder ?? null,
                    help_text: field.help_text ?? null,
                    validation_rule: field.validation_rule ?? null,
                    options: field.options ?? null,
                    field_order: field.field_order ?? 0
                };
                await form_field_model_1.default.create(fieldData);
            }
        }
        if (req.currentUser) {
            await audit_log_model_1.default.create({
                user_id: req.currentUser.id,
                action: 'form.updated',
                entity_type: 'form',
                entity_id: formId,
                before_data: existingForm,
                after_data: updatedForm,
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });
        }
        return res.json({
            success: true,
            message: 'Form updated successfully',
            data: { form: updatedForm }
        });
    }
    catch (error) {
        console.error('Update form error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.updateForm = updateForm;
const deleteForm = async (req, res) => {
    try {
        const { id } = req.params;
        const formId = parseInt(Array.isArray(id) ? id[0] : id);
        if (isNaN(formId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid form ID'
            });
        }
        const existingForm = await form_model_1.default.findById(formId);
        if (!existingForm) {
            return res.status(404).json({
                success: false,
                message: 'Form not found'
            });
        }
        const deactivated = await form_model_1.default.delete(formId);
        if (!deactivated) {
            return res.status(404).json({
                success: false,
                message: 'Form not found'
            });
        }
        const updatedForm = await form_model_1.default.findById(formId);
        if (req.currentUser) {
            await audit_log_model_1.default.create({
                user_id: req.currentUser.id,
                action: 'form.deactivated',
                entity_type: 'form',
                entity_id: formId,
                before_data: existingForm,
                after_data: updatedForm,
                ip_address: req.ip,
                user_agent: req.get('User-Agent')
            });
        }
        return res.json({
            success: true,
            message: 'Form deactivated successfully'
        });
    }
    catch (error) {
        console.error('Deactivate form error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.deleteForm = deleteForm;
const getFormFields = async (req, res) => {
    try {
        const { id } = req.params;
        const formId = parseInt(Array.isArray(id) ? id[0] : id);
        if (isNaN(formId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid form ID'
            });
        }
        const fields = await form_field_model_1.default.findByFormId(formId);
        return res.json({
            success: true,
            message: 'Form fields retrieved successfully',
            data: { fields, formId }
        });
    }
    catch (error) {
        console.error('Get form fields error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
exports.getFormFields = getFormFields;
//# sourceMappingURL=form.controller.js.map