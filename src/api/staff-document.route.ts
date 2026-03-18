import { Router } from 'express';
import {
  uploadStaffDocument,
  getStaffDocuments,
  getStaffDocument,
  deleteStaffDocument,
  serveStaffDocument
} from '../controllers/staff-document.controller';
import { authenticateJWT, checkPermission } from '../middleware/auth.middleware';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'staff-documents');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `staff-doc-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and images are allowed.'));
    }
  }
});

// Serve uploaded files (must be before other routes to avoid conflicts)
router.get('/uploads/staff-documents/:filename', serveStaffDocument);

// Get staff documents
router.get('/staff/:id/documents', authenticateJWT, checkPermission('documents:read'), getStaffDocuments);

// Get specific document
router.get('/staff/documents/:documentId', authenticateJWT, checkPermission('documents:read'), getStaffDocument);

// Upload document
router.post('/staff/:id/documents', authenticateJWT, checkPermission('documents:upload'), upload.array('documents', 5), uploadStaffDocument);

// Delete document
router.delete('/staff/documents/:documentId', authenticateJWT, checkPermission('documents:delete'), deleteStaffDocument);

export default router;
