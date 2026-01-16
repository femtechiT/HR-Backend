import { Request, Response } from 'express';
import FormModel, { FormInput, FormUpdate } from '../models/form.model';
import FormFieldModel, { FormFieldInput } from '../models/form-field.model';
import AuditLogModel from '../models/audit-log.model';

// Controller for form management
export const getAllForms = async (req: Request, res: Response) => {
  try {
    const branchId = req.query.branchId ? parseInt(req.query.branchId as string) : undefined;
    
    const forms = await FormModel.findAll(branchId);
    
    res.json({
      success: true,
      message: 'Forms retrieved successfully',
      data: { forms }
    });
  } catch (error) {
    console.error('Get all forms error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getFormById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const formId = parseInt(Array.isArray(id) ? id[0] : id);

    if (isNaN(formId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form ID'
      });
    }

    const form = await FormModel.findById(formId);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    // Also get the form fields
    const fields = await FormFieldModel.findByFormId(formId);

    return res.json({
      success: true,
      message: 'Form retrieved successfully',
      data: { form, fields }
    });
  } catch (error) {
    console.error('Get form by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const createForm = async (req: Request, res: Response) => {
  try {
    const { name, description, form_type, branch_id, fields } = req.body;

    // Validate required fields
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

    // Create the form
    const formData: FormInput = {
      name,
      description,
      form_type,
      branch_id,
      created_by: req.currentUser.id
    };

    const newForm = await FormModel.create(formData);

    // Create form fields if provided
    if (fields && Array.isArray(fields) && fields.length > 0) {
      for (const field of fields) {
        // Skip if field data is incomplete
        if (!field ||
            field.field_name === undefined || field.field_name === null || field.field_name === '' ||
            field.field_label === undefined || field.field_label === null || field.field_label === '' ||
            field.field_type === undefined || field.field_type === null || field.field_type === '') {
          console.warn('Skipping incomplete or null field:', field);
          continue;
        }

        const fieldData: FormFieldInput = {
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

        await FormFieldModel.create(fieldData);
      }
    }

    // Log the form creation if currentUser exists
    if (req.currentUser) {
      await AuditLogModel.create({
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
  } catch (error) {
    console.error('Create form error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateForm = async (req: Request, res: Response) => {
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

    // Check if form exists
    const existingForm = await FormModel.findById(formId);
    if (!existingForm) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    // Prepare update data
    const updateData: FormUpdate = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (form_type !== undefined) updateData.form_type = form_type;
    if (branch_id !== undefined) updateData.branch_id = branch_id;
    if (is_active !== undefined) updateData.is_active = is_active;

    const updatedForm = await FormModel.update(formId, updateData);

    // Update form fields if provided
    if (fields && Array.isArray(fields)) {
      // First, delete all existing fields for this form
      await FormFieldModel.deleteByFormId(formId);

      // Then create new fields
      for (const field of fields) {
        // Skip if field data is incomplete
        if (!field ||
            field.field_name === undefined || field.field_name === null || field.field_name === '' ||
            field.field_label === undefined || field.field_label === null || field.field_label === '' ||
            field.field_type === undefined || field.field_type === null || field.field_type === '') {
          console.warn('Skipping incomplete field during update:', field);
          continue;
        }

        const fieldData: FormFieldInput = {
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

        await FormFieldModel.create(fieldData);
      }
    }

    // Log the form update
    if (req.currentUser) {
      await AuditLogModel.create({
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
  } catch (error) {
    console.error('Update form error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteForm = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const formId = parseInt(Array.isArray(id) ? id[0] : id);

    if (isNaN(formId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form ID'
      });
    }

    const existingForm = await FormModel.findById(formId);
    if (!existingForm) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    // Instead of hard deleting, we'll deactivate the form
    const deactivated = await FormModel.delete(formId);
    if (!deactivated) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    // Get updated form record
    const updatedForm = await FormModel.findById(formId);

    // Log the form deactivation
    if (req.currentUser) {
      await AuditLogModel.create({
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
  } catch (error) {
    console.error('Deactivate form error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getFormFields = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const formId = parseInt(Array.isArray(id) ? id[0] : id);

    if (isNaN(formId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid form ID'
      });
    }

    const fields = await FormFieldModel.findByFormId(formId);

    return res.json({
      success: true,
      message: 'Form fields retrieved successfully',
      data: { fields, formId }
    });
  } catch (error) {
    console.error('Get form fields error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};