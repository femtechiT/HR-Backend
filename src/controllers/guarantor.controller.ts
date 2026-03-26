import { Request, Response } from 'express';
import GuarantorModel from '../models/guarantor.model';
import StaffModel from '../models/staff.model';
import path from 'path';
import fs from 'fs';

// Controller for guarantor management
export const getGuarantors = async (req: Request, res: Response) => {
  try {
    let staffId = req.params.staffId ? parseInt(req.params.staffId) : undefined;
    const isActiveOnly = req.query.isActiveOnly === 'true';

    if (!staffId) {
      return res.status(400).json({
        success: false,
        message: 'Staff ID is required'
      });
    }

    // Check if the provided ID is a user_id (common mistake from frontend)
    // If so, find the corresponding staff.id
    const staffRecord = await StaffModel.findByUserId(staffId);
    if (staffRecord) {
      // Found staff by user_id, use the actual staff.id
      staffId = staffRecord.id;
    }

    const guarantors = await GuarantorModel.findByStaffId(staffId, isActiveOnly);

    return res.json({
      success: true,
      message: 'Guarantors retrieved successfully',
      data: { guarantors }
    });
  } catch (error) {
    console.error('Get guarantors error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getGuarantor = async (req: Request, res: Response) => {
  try {
    const guarantorId = parseInt(req.params.id);

    if (isNaN(guarantorId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid guarantor ID'
      });
    }

    const guarantor = await GuarantorModel.findById(guarantorId);

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
  } catch (error) {
    console.error('Get guarantor error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const createGuarantor = async (req: Request, res: Response) => {
  try {
    const {
      staff_id,
      first_name,
      last_name,
      middle_name,
      date_of_birth,
      gender,
      phone_number,
      alternate_phone,
      email,
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
      country,
      id_type,
      id_number,
      id_issuing_authority,
      id_issue_date,
      id_expiry_date,
      relationship,
      occupation,
      employer_name,
      employer_address,
      employer_phone,
      guarantee_type,
      guarantee_amount,
      guarantee_start_date,
      guarantee_end_date,
      guarantee_terms,
      is_active
    } = req.body;

    // Validate required fields
    if (!staff_id || !first_name || !last_name || !phone_number || !address_line_1) {
      return res.status(400).json({
        success: false,
        message: 'Staff ID, first name, last name, phone number, and address are required'
      });
    }

    // Verify staff exists - staff_id is actually user_id from frontend
    const staff = await StaffModel.findByUserId(staff_id);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found. Please ensure your profile is complete.'
      });
    }

    // Use the actual staff.id (primary key) for the guarantor record
    const actualStaffId = staff.id;

    // Create guarantor - only include defined values
    const guarantorData: any = {
      staff_id: actualStaffId,
      first_name,
      last_name,
      phone_number,
      address_line_1
    };

    // Add optional fields only if they have values
    if (middle_name) guarantorData.middle_name = middle_name;
    if (date_of_birth) guarantorData.date_of_birth = new Date(date_of_birth);
    if (gender) guarantorData.gender = gender;
    if (alternate_phone) guarantorData.alternate_phone = alternate_phone;
    if (email) guarantorData.email = email;
    if (address_line_2) guarantorData.address_line_2 = address_line_2;
    if (city) guarantorData.city = city;
    if (state) guarantorData.state = state;
    if (postal_code) guarantorData.postal_code = postal_code;
    if (country) guarantorData.country = country;
    else guarantorData.country = 'Nigeria';
    if (id_type) guarantorData.id_type = id_type;
    if (id_number) guarantorData.id_number = id_number;
    if (id_issuing_authority) guarantorData.id_issuing_authority = id_issuing_authority;
    if (id_issue_date) guarantorData.id_issue_date = new Date(id_issue_date);
    if (id_expiry_date) guarantorData.id_expiry_date = new Date(id_expiry_date);
    if (relationship) guarantorData.relationship = relationship;
    if (occupation) guarantorData.occupation = occupation;
    if (employer_name) guarantorData.employer_name = employer_name;
    if (employer_address) guarantorData.employer_address = employer_address;
    if (employer_phone) guarantorData.employer_phone = employer_phone;
    if (guarantee_type) guarantorData.guarantee_type = guarantee_type;
    if (guarantee_amount) guarantorData.guarantee_amount = guarantee_amount;
    if (guarantee_start_date) guarantorData.guarantee_start_date = new Date(guarantee_start_date);
    if (guarantee_end_date) guarantorData.guarantee_end_date = new Date(guarantee_end_date);
    if (guarantee_terms) guarantorData.guarantee_terms = guarantee_terms;
    if (is_active !== undefined) guarantorData.is_active = is_active;
    else guarantorData.is_active = true;

    const guarantor = await GuarantorModel.create(guarantorData);

    return res.status(201).json({
      success: true,
      message: 'Guarantor created successfully',
      data: { guarantor }
    });
  } catch (error) {
    console.error('Create guarantor error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateGuarantor = async (req: Request, res: Response) => {
  try {
    const guarantorId = parseInt(req.params.id);

    if (isNaN(guarantorId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid guarantor ID'
      });
    }

    const guarantor = await GuarantorModel.findById(guarantorId);
    if (!guarantor) {
      return res.status(404).json({
        success: false,
        message: 'Guarantor not found'
      });
    }

    const updateData: any = {};
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
        } else {
          updateData[field] = req.body[field];
        }
      }
    }

    const updatedGuarantor = await GuarantorModel.update(guarantorId, updateData);

    return res.json({
      success: true,
      message: 'Guarantor updated successfully',
      data: { guarantor: updatedGuarantor }
    });
  } catch (error) {
    console.error('Update guarantor error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const deleteGuarantor = async (req: Request, res: Response) => {
  try {
    const guarantorId = parseInt(req.params.id);

    if (isNaN(guarantorId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid guarantor ID'
      });
    }

    const guarantor = await GuarantorModel.findById(guarantorId);
    if (!guarantor) {
      return res.status(404).json({
        success: false,
        message: 'Guarantor not found'
      });
    }

    // Delete associated files if they exist
    if (guarantor.guarantor_form_path) {
      const formPath = path.join(process.cwd(), guarantor.guarantor_form_path);
      if (fs.existsSync(formPath)) {
        fs.unlinkSync(formPath);
      }
    }

    if (guarantor.id_document_path) {
      const idPath = path.join(process.cwd(), guarantor.id_document_path);
      if (fs.existsSync(idPath)) {
        fs.unlinkSync(idPath);
      }
    }

    await GuarantorModel.delete(guarantorId);

    return res.json({
      success: true,
      message: 'Guarantor deleted successfully'
    });
  } catch (error) {
    console.error('Delete guarantor error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const verifyGuarantor = async (req: Request, res: Response) => {
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

    const guarantor = await GuarantorModel.findById(guarantorId);
    if (!guarantor) {
      return res.status(404).json({
        success: false,
        message: 'Guarantor not found'
      });
    }

    const updatedGuarantor = await GuarantorModel.verify(guarantorId, verifiedBy, verification_notes);

    return res.json({
      success: true,
      message: 'Guarantor verified successfully',
      data: { guarantor: updatedGuarantor }
    });
  } catch (error) {
    console.error('Verify guarantor error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const uploadGuarantorDocument = async (req: Request, res: Response) => {
  try {
    const guarantorId = parseInt(req.params.id);
    const documentType = req.params.documentType; // 'form' or 'id'

    if (isNaN(guarantorId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid guarantor ID'
      });
    }

    const guarantor = await GuarantorModel.findById(guarantorId);
    if (!guarantor) {
      return res.status(404).json({
        success: false,
        message: 'Guarantor not found'
      });
    }

    // Check for uploaded file (multer with .single() provides req.file, not req.files)
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const file = req.file;
    const filePath = `/uploads/guarantors/${file.filename}`;

    // Delete old file if it exists (prevent orphaned files)
    const oldFilePath = documentType === 'id' 
      ? guarantor.id_document_path 
      : guarantor.guarantor_form_path;
    
    if (oldFilePath) {
      const oldFileFullPath = path.join(process.cwd(), oldFilePath);
      if (fs.existsSync(oldFileFullPath)) {
        fs.unlinkSync(oldFileFullPath);
      }
    }

    const updateData = documentType === 'id'
      ? { id_document_path: filePath }
      : { guarantor_form_path: filePath };

    const updatedGuarantor = await GuarantorModel.update(guarantorId, updateData);

    return res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        guarantor: updatedGuarantor,
        file_path: filePath
      }
    });
  } catch (error) {
    console.error('Upload guarantor document error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
