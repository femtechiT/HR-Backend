import { Router } from 'express';
import {
  submitJobApplication,
  getApplicationById,
  getApplicationsByJobPosting,
  getApplicationsByApplicant
} from '../controllers/application-submission.controller';
import { upload } from '../controllers/application-submission.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// Public route for job seekers to submit applications
router.post('/', upload.single('resume'), submitJobApplication);

// Protected routes for applicants and HR to view applications
router.use(authenticateJWT);

// Routes for applicants to check their application status
router.get('/my-applications/:email', getApplicationsByApplicant);
router.get('/:id', getApplicationById);

// Route for HR to get applications for a specific job posting
router.get('/by-job/:job_posting_id', getApplicationsByJobPosting);

export default router;