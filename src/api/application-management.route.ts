import { Router } from 'express';
import {
  updateApplicationStatus,
  getAllApplications,
  withdrawApplication,
  addCommentToApplication,
  getCommentsForApplication
} from '../controllers/application-management.controller';
import { authenticateJWT, checkPermission } from '../middleware/auth.middleware';

const router = Router();

// Protected routes for HR/Admin to manage applications
router.use(authenticateJWT);

// HR/Admin can update application status
router.put('/:id/status', checkPermission('job_application:update'), updateApplicationStatus);

// HR/Admin can get all applications with filtering
router.get('/', checkPermission('job_application:read'), getAllApplications);

// Anyone can withdraw their own application (but HR can also do it)
router.put('/:id/withdraw', withdrawApplication);

// HR/Admin can add comments to applications
router.post('/:id/comment', checkPermission('job_application:comment'), addCommentToApplication);

// Anyone can view comments for an application (applicant or HR)
router.get('/:id/comments', getCommentsForApplication);

export default router;