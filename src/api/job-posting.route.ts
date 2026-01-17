import { Router } from 'express';
import {
  getAllJobPostings,
  getJobPostingById,
  createJobPosting,
  updateJobPosting,
  closeJobPosting,
  deleteJobPosting
} from '../controllers/job-posting.controller';
import { authenticateJWT, checkPermission } from '../middleware/auth.middleware';

const router = Router();

// Public route for job seekers to view job postings
router.get('/', getAllJobPostings);
router.get('/:id', getJobPostingById);

// Protected routes for HR/Admin to manage job postings
router.use(authenticateJWT);

// Only HR/Admin can create, update, or delete job postings
router.post('/', checkPermission('job_posting:create'), createJobPosting);
router.put('/:id', checkPermission('job_posting:update'), updateJobPosting);
router.post('/:id/close', checkPermission('job_posting:update'), closeJobPosting);
router.delete('/:id', checkPermission('job_posting:delete'), deleteJobPosting);

export default router;