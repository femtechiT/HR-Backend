import { Router } from 'express';
import {
  getGuarantors,
  getGuarantor,
  createGuarantor,
  updateGuarantor,
  deleteGuarantor,
  verifyGuarantor,
  uploadGuarantorDocument
} from '../controllers/guarantor.controller';
import { authenticateJWT, checkPermission } from '../middleware/auth.middleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for guarantor document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'guarantors');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const guarantorId = req.params.id;
    const docType = req.params.documentType;
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `guarantor-${guarantorId}-${docType}-${uniqueSuffix}${ext}`);
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

// Serve guarantor documents (public access for viewing)
router.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(process.cwd(), 'uploads', 'guarantors', filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      message: 'File not found'
    });
  }
  
  res.sendFile(filePath);
});

// GET /api/guarantors/staff/:staffId - Get all guarantors for a staff member
router.get('/staff/:staffId', authenticateJWT, getGuarantors);

// GET /api/guarantors/:id - Get specific guarantor (only requires authentication)
router.get('/:id', authenticateJWT, getGuarantor);

// POST /api/guarantors - Create new guarantor (only requires authentication)
router.post('/', authenticateJWT, createGuarantor);

// PUT /api/guarantors/:id - Update guarantor (only requires authentication)
router.put('/:id', authenticateJWT, updateGuarantor);

// DELETE /api/guarantors/:id - Delete guarantor (only requires authentication)
router.delete('/:id', authenticateJWT, deleteGuarantor);

// POST /api/guarantors/:id/verify - Verify guarantor (admin only)
router.post('/:id/verify', authenticateJWT, verifyGuarantor);

// POST /api/guarantors/:id/upload/:documentType - Upload guarantor document
router.post('/:id/upload/:documentType', authenticateJWT, upload.single('document'), uploadGuarantorDocument);

export default router;
