"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serveStaffDocument = exports.deleteStaffDocument = exports.getStaffDocument = exports.getStaffDocuments = exports.uploadStaffDocument = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const database_1 = require("../config/database");
const staff_document_model_1 = __importDefault(require("../models/staff-document.model"));
const uploadStaffDocument = async (req, res) => {
    try {
        const staffId = parseInt(req.params.id);
        const documentType = req.body.document_type;
        const uploadedBy = req.currentUser?.id;
        if (!staffId || isNaN(staffId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid staff ID'
            });
        }
        if (!documentType) {
            return res.status(400).json({
                success: false,
                message: 'Document type is required'
            });
        }
        if (!req.files || !Array.isArray(req.files)) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded. Please upload a PDF or image file.'
            });
        }
        const files = req.files;
        const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        const file = files[0];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            fs_1.default.unlinkSync(file.path);
            return res.status(400).json({
                success: false,
                message: 'Invalid file type. Only PDF and images (JPG, PNG) are allowed.'
            });
        }
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            fs_1.default.unlinkSync(file.path);
            return res.status(400).json({
                success: false,
                message: 'File size exceeds 10MB limit.'
            });
        }
        const documentData = {
            staff_id: staffId,
            document_type: documentType,
            document_name: file.originalname,
            file_path: `/uploads/staff-documents/${path_1.default.basename(file.filename)}`,
            file_size: file.size,
            mime_type: file.mimetype,
            uploaded_by: uploadedBy || 1,
            expiry_date: null
        };
        const createdDocument = await staff_document_model_1.default.create(documentData);
        const uploadedDocument = {
            id: createdDocument.id,
            staff_id: staffId,
            document_type: documentType,
            document_name: file.originalname,
            file_path: `/uploads/staff-documents/${path_1.default.basename(file.filename)}`,
            file_size: file.size,
            mime_type: file.mimetype,
            uploaded_by: uploadedBy || 1,
            uploaded_at: new Date().toISOString()
        };
        return res.status(201).json({
            success: true,
            message: 'Document uploaded successfully',
            data: {
                document: uploadedDocument
            }
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to upload document'
        });
    }
};
exports.uploadStaffDocument = uploadStaffDocument;
const getStaffDocuments = async (req, res) => {
    try {
        const staffId = parseInt(req.params.id);
        if (!staffId || isNaN(staffId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid staff ID'
            });
        }
        const documents = await staff_document_model_1.default.findByStaffId(staffId);
        return res.status(200).json({
            success: true,
            message: 'Documents retrieved successfully',
            data: {
                documents: documents,
                total: documents.length
            }
        });
    }
    catch (error) {
        console.error('Get documents error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to retrieve documents'
        });
    }
};
exports.getStaffDocuments = getStaffDocuments;
const getStaffDocument = async (req, res) => {
    try {
        const documentId = parseInt(req.params.documentId);
        if (!documentId || isNaN(documentId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid document ID'
            });
        }
        const document = await staff_document_model_1.default.findById(documentId);
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Document retrieved successfully',
            data: {
                document
            }
        });
    }
    catch (error) {
        console.error('Get document error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to retrieve document'
        });
    }
};
exports.getStaffDocument = getStaffDocument;
const deleteStaffDocument = async (req, res) => {
    try {
        const documentId = parseInt(req.params.documentId);
        if (!documentId || isNaN(documentId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid document ID'
            });
        }
        const document = await staff_document_model_1.default.findById(documentId);
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }
        const filePath = path_1.default.join(process.cwd(), document.file_path);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        await database_1.pool.execute('DELETE FROM staff_documents WHERE id = ?', [documentId]);
        return res.status(200).json({
            success: true,
            message: 'Document deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete document error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete document'
        });
    }
};
exports.deleteStaffDocument = deleteStaffDocument;
const serveStaffDocument = async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path_1.default.join(process.cwd(), 'uploads', 'staff-documents', filename);
        if (!fs_1.default.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }
        res.sendFile(filePath);
    }
    catch (error) {
        console.error('Serve document error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to serve document'
        });
    }
};
exports.serveStaffDocument = serveStaffDocument;
//# sourceMappingURL=staff-document.controller.js.map