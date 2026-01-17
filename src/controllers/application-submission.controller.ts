import { Request, Response } from 'express';
import { pool } from '../config/database';
import { notificationService } from '../services/notification.service';
import multer from 'multer';
import path from 'path';

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/resumes/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({ storage: storage });

/**
 * Submit a job application
 */
export const submitJobApplication = async (req: Request, res: Response) => {
  try {
    const { job_posting_id, applicant_name, applicant_email, applicant_phone, cover_letter } = req.body;

    // Validate required fields
    if (!job_posting_id || !applicant_name || !applicant_email) {
      return res.status(400).json({
        success: false,
        message: 'Job posting ID, applicant name, and applicant email are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(applicant_email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Check if job posting exists and is still open
    const [jobPostingRows]: any = await pool.execute(
      'SELECT * FROM job_postings WHERE id = ? AND status = ? AND is_active = TRUE AND closing_date >= CURDATE()',
      [job_posting_id, 'open']
    );

    if (jobPostingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found, closed, or expired'
      });
    }

    const jobPosting = jobPostingRows[0];

    // Check if applicant has already applied for this job
    const [existingApplicationRows]: any = await pool.execute(
      'SELECT * FROM job_applications WHERE job_posting_id = ? AND applicant_email = ?',
      [job_posting_id, applicant_email]
    );

    if (existingApplicationRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this position'
      });
    }

    // Handle resume upload if present
    let resumeFilePath = null;
    if (req.file) {
      resumeFilePath = req.file.path;
    }

    // Create the job application
    const [result]: any = await pool.execute(
      `INSERT INTO job_applications 
       (job_posting_id, applicant_name, applicant_email, applicant_phone, resume_file_path, cover_letter, application_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        job_posting_id,
        applicant_name,
        applicant_email,
        applicant_phone || null,
        resumeFilePath,
        cover_letter || null,
        'applied'
      ]
    );

    const applicationId = result.insertId;

    // Get the created application
    const [applicationRows]: any = await pool.execute(
      `SELECT ja.*, jp.title as job_title, jp.closing_date
       FROM job_applications ja
       JOIN job_postings jp ON ja.job_posting_id = jp.id
       WHERE ja.id = ?`,
      [applicationId]
    );

    // Queue application confirmation notification
    try {
      await notificationService.queueNotification(
        0, // For external applicants, we'll use a different approach
        'job_application_confirmation',
        {
          applicant_name: applicant_name,
          job_title: jobPosting.title,
          company_name: process.env.APP_NAME || 'Our Company',
          application_reference: `APP-${applicationId.toString().padStart(6, '0')}`,
          application_date: new Date().toLocaleDateString()
        },
        {
          channel: 'email',
          priority: 'normal'
        }
      );
    } catch (notificationError) {
      console.error('Error queuing application confirmation notification:', notificationError);
      // Don't fail the application if notification fails
    }

    return res.status(201).json({
      success: true,
      message: 'Job application submitted successfully',
      data: {
        application: applicationRows[0]
      }
    });
  } catch (error) {
    console.error('Error submitting job application:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while submitting job application'
    });
  }
};

/**
 * Get application by ID (for applicants to check their application status)
 */
export const getApplicationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).currentUser;

    // Get application details
    const [rows]: any = await pool.execute(
      `SELECT ja.*, jp.title as job_title, jp.department_id, d.name as department_name
       FROM job_applications ja
       JOIN job_postings jp ON ja.job_posting_id = jp.id
       LEFT JOIN departments d ON jp.department_id = d.id
       WHERE ja.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const application = rows[0];

    // Check if the current user is authorized to view this application
    // Either the applicant themselves or an authorized HR person
    const isApplicant = application.applicant_email === currentUser?.email;
    const isAuthorizedHR = currentUser?.role_id && (currentUser.role_id === 1 || currentUser.role_id === 2); // Assuming role IDs 1 and 2 are admin/HR

    if (!isApplicant && !isAuthorizedHR) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this application'
      });
    }

    return res.json({
      success: true,
      data: {
        application
      }
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching application'
    });
  }
};

/**
 * Get applications by job posting
 */
export const getApplicationsByJobPosting = async (req: Request, res: Response) => {
  try {
    const { job_posting_id } = req.params;
    const currentUser = (req as any).currentUser;

    // Check if current user is authorized to view applications for this job
    const [jobPostingRows]: any = await pool.execute(
      'SELECT * FROM job_postings WHERE id = ?',
      [job_posting_id]
    );

    if (jobPostingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    const jobPosting = jobPostingRows[0];
    const isAuthorizedHR = currentUser?.role_id && (currentUser.role_id === 1 || currentUser.role_id === 2); // Assuming role IDs 1 and 2 are admin/HR

    if (!isAuthorizedHR) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view applications for this job posting'
      });
    }

    // Get applications for this job posting
    const [rows]: any = await pool.execute(
      `SELECT ja.*, u.full_name as reviewed_by_name
       FROM job_applications ja
       LEFT JOIN users u ON ja.reviewed_by = u.id
       WHERE ja.job_posting_id = ?
       ORDER BY ja.applied_at DESC`,
      [job_posting_id]
    );

    return res.json({
      success: true,
      data: {
        applications: rows
      }
    });
  } catch (error) {
    console.error('Error fetching applications by job posting:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching applications'
    });
  }
};

/**
 * Get applications by applicant email
 */
export const getApplicationsByApplicant = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const currentUser = (req as any).currentUser;

    // Check if the current user is authorized to view these applications
    if (currentUser?.email !== email) {
      const isAuthorizedHR = currentUser?.role_id && (currentUser.role_id === 1 || currentUser.role_id === 2); // Assuming role IDs 1 and 2 are admin/HR
      if (!isAuthorizedHR) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to view applications for this email'
        });
      }
    }

    // Get applications by applicant email
    const [rows]: any = await pool.execute(
      `SELECT ja.*, jp.title as job_title, jp.department_id, d.name as department_name
       FROM job_applications ja
       JOIN job_postings jp ON ja.job_posting_id = jp.id
       LEFT JOIN departments d ON jp.department_id = d.id
       WHERE ja.applicant_email = ?
       ORDER BY ja.applied_at DESC`,
      [email]
    );

    return res.json({
      success: true,
      data: {
        applications: rows
      }
    });
  } catch (error) {
    console.error('Error fetching applications by applicant:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching applications'
    });
  }
};