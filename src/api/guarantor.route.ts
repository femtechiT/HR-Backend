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

const router = Router();

// Configure multer for guarantor document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'guarantors');
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

// GET /api/guarantors/staff/:staffId - Get all guarantors for a staff member
router.get('/staff/:staffId', authenticateJWT, getGuarantors);

// GET /api/guarantors/:id - Get specific guarantor
router.get('/:id', authenticateJWT, checkPermission('staff:read'), getGuarantor);

// POST /api/guarantors - Create new guarantor
router.post('/', authenticateJWT, checkPermission('staff:create'), createGuarantor);

// PUT /api/guarantors/:id - Update guarantor
router.put('/:id', authenticateJWT, checkPermission('staff:update'), updateGuarantor);

// DELETE /api/guarantors/:id - Delete guarantor
router.delete('/:id', authenticateJWT, checkPermission('staff:delete'), deleteGuarantor);

// POST /api/guarantors/:id/verify - Verify guarantor (admin only)
router.post('/:id/verify', authenticateJWT, checkPermission('staff:update'), verifyGuarantor);

// POST /api/guarantors/:id/upload/:documentType - Upload guarantor document (form or id)
router.post('/:id/upload/:documentType', authenticateJWT, checkPermission('staff:update'), upload.single('document'), uploadGuarantorDocument);

export default router;
