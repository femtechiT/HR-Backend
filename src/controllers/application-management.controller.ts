import { Request, Response } from 'express';
import { pool } from '../config/database';
import { notificationService } from '../services/notification.service';

/**
 * Update application status
 */
export const updateApplicationStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;
    const currentUser = (req as any).currentUser;

    // Validate status
    const validStatuses = ['applied', 'under_review', 'shortlisted', 'interviewed', 'offered', 'rejected', 'withdrawn'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid statuses are: ${validStatuses.join(', ')}`
      });
    }

    // Get current application
    const [currentApplicationRows]: any = await pool.execute(
      'SELECT * FROM job_applications WHERE id = ?',
      [id]
    );

    if (currentApplicationRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const currentApplication = currentApplicationRows[0];

    // Check if user is authorized to update application status
    const isAuthorizedHR = currentUser?.role_id && (currentUser.role_id === 1 || currentUser.role_id === 2); // Assuming role IDs 1 and 2 are admin/HR
    if (!isAuthorizedHR) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update application status'
      });
    }

    // Build update query
    const updateFields = [];
    const params = [];

    updateFields.push('application_status = ?');
    params.push(status);

    if (rejection_reason !== undefined) {
      updateFields.push('rejection_reason = ?');
      params.push(rejection_reason);
    }

    // Update reviewed_by and reviewed_at when status changes
    updateFields.push('reviewed_by = ?');
    params.push(currentUser.id);

    updateFields.push('reviewed_at = NOW()');

    updateFields.push('updated_at = NOW()');
    params.push(id); // For WHERE clause

    const query = `UPDATE job_applications SET ${updateFields.join(', ')} WHERE id = ?`;

    await pool.execute(query, params);

    // Get the updated application
    const [updatedApplicationRows]: any = await pool.execute(
      `SELECT ja.*, jp.title as job_title, jp.description as job_description
       FROM job_applications ja
       JOIN job_postings jp ON ja.job_posting_id = jp.id
       WHERE ja.id = ?`,
      [id]
    );

    // Queue notification based on new status
    try {
      let templateName = '';
      let templateVariables = {};

      switch (status) {
        case 'shortlisted':
          templateName = 'job_application_shortlisted';
          templateVariables = {
            applicant_name: currentApplication.applicant_name,
            job_title: updatedApplicationRows[0].job_title,
            company_name: process.env.APP_NAME || 'Our Company',
            interview_date: req.body.interview_date || 'TBD',
            interview_time: req.body.interview_time || 'TBD',
            interview_location: req.body.interview_location || 'TBD',
            contact_person: req.body.contact_person || 'HR Team'
          };
          break;

        case 'rejected':
          templateName = 'job_application_rejected';
          templateVariables = {
            applicant_name: currentApplication.applicant_name,
            job_title: updatedApplicationRows[0].job_title,
            company_name: process.env.APP_NAME || 'Our Company'
          };
          break;

        case 'offered':
          templateName = 'job_offer';
          templateVariables = {
            applicant_name: currentApplication.applicant_name,
            job_title: updatedApplicationRows[0].job_title,
            company_name: process.env.APP_NAME || 'Our Company',
            start_date: req.body.offer_start_date || 'TBD',
            salary: req.body.offer_salary || 'TBD',
            employment_type: req.body.offer_employment_type || 'TBD',
            reporting_manager: req.body.offer_reporting_manager || 'TBD',
            acceptance_deadline: req.body.offer_acceptance_deadline || 'TBD',
            offer_from_name: currentUser.full_name || 'HR Team',
            offer_from_position: 'HR Manager'
          };
          break;

        default:
          // No notification for other statuses
          break;
      }

      if (templateName) {
        // Find user ID associated with the applicant email (if they exist in the system)
        const [userRows]: any = await pool.execute(
          'SELECT id FROM users WHERE email = ?',
          [currentApplication.applicant_email]
        );

        const userId = userRows.length > 0 ? userRows[0].id : 0; // Use 0 if not found

        await notificationService.queueNotification(
          userId,
          templateName,
          templateVariables,
          {
            channel: 'email',
            priority: 'normal'
          }
        );
      }
    } catch (notificationError) {
      console.error('Error queuing status update notification:', notificationError);
      // Don't fail the status update if notification fails
    }

    return res.json({
      success: true,
      message: 'Application status updated successfully',
      data: {
        application: updatedApplicationRows[0]
      }
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating application status'
    });
  }
};

/**
 * Get all applications with filtering
 */
export const getAllApplications = async (req: Request, res: Response) => {
  try {
    const { status, job_posting_id, applicant_email, limit = 10, page = 1 } = req.query;
    const currentUser = (req as any).currentUser;

    // Check if user is authorized to view applications
    const isAuthorizedHR = currentUser?.role_id && (currentUser.role_id === 1 || currentUser.role_id === 2); // Assuming role IDs 1 and 2 are admin/HR
    if (!isAuthorizedHR) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view applications'
      });
    }

    let query = `
      SELECT ja.*, jp.title as job_title, jp.department_id, d.name as department_name, u.full_name as reviewed_by_name
      FROM job_applications ja
      JOIN job_postings jp ON ja.job_posting_id = jp.id
      LEFT JOIN departments d ON jp.department_id = d.id
      LEFT JOIN users u ON ja.reviewed_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ' AND ja.application_status = ?';
      params.push(status);
    }

    if (job_posting_id) {
      query += ' AND ja.job_posting_id = ?';
      params.push(job_posting_id);
    }

    if (applicant_email) {
      query += ' AND ja.applicant_email LIKE ?';
      params.push(`%${applicant_email}%`);
    }

    query += ' ORDER BY ja.applied_at DESC';

    // Add pagination
    const offset = (Number(page) - 1) * Number(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const [rows]: any = await pool.execute(query, params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM job_applications ja
      JOIN job_postings jp ON ja.job_posting_id = jp.id
      WHERE 1=1
    `;
    const countParams = [];

    if (status) {
      countQuery += ' AND ja.application_status = ?';
      countParams.push(status);
    }

    if (job_posting_id) {
      countQuery += ' AND ja.job_posting_id = ?';
      countParams.push(job_posting_id);
    }

    if (applicant_email) {
      countQuery += ' AND ja.applicant_email LIKE ?';
      countParams.push(`%${applicant_email}%`);
    }

    const [countRows]: any = await pool.execute(countQuery, countParams);

    return res.json({
      success: true,
      data: {
        applications: rows,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(countRows[0].total / Number(limit)),
          totalItems: countRows[0].total,
          itemsPerPage: Number(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching applications'
    });
  }
};

/**
 * Withdraw an application
 */
export const withdrawApplication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).currentUser;

    // Get current application
    const [currentApplicationRows]: any = await pool.execute(
      'SELECT * FROM job_applications WHERE id = ?',
      [id]
    );

    if (currentApplicationRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const currentApplication = currentApplicationRows[0];

    // Check if user is authorized to withdraw this application
    // Either the applicant themselves or an authorized HR person
    const isApplicant = currentApplication.applicant_email === currentUser?.email;
    const isAuthorizedHR = currentUser?.role_id && (currentUser.role_id === 1 || currentUser.role_id === 2); // Assuming role IDs 1 and 2 are admin/HR

    if (!isApplicant && !isAuthorizedHR) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to withdraw this application'
      });
    }

    // Update status to withdrawn
    await pool.execute(
      'UPDATE job_applications SET application_status = ?, updated_at = NOW() WHERE id = ?',
      ['withdrawn', id]
    );

    // Get the updated application
    const [updatedApplicationRows]: any = await pool.execute(
      `SELECT ja.*, jp.title as job_title
       FROM job_applications ja
       JOIN job_postings jp ON ja.job_posting_id = jp.id
       WHERE ja.id = ?`,
      [id]
    );

    // Queue withdrawal acknowledgment notification
    try {
      await notificationService.queueNotification(
        0, // For external applicants
        'application_withdrawn_acknowledgment',
        {
          applicant_name: currentApplication.applicant_name,
          job_title: updatedApplicationRows[0].job_title,
          company_name: process.env.APP_NAME || 'Our Company'
        },
        {
          channel: 'email',
          priority: 'normal'
        }
      );
    } catch (notificationError) {
      console.error('Error queuing withdrawal acknowledgment notification:', notificationError);
      // Don't fail the withdrawal if notification fails
    }

    return res.json({
      success: true,
      message: 'Application withdrawn successfully',
      data: {
        application: updatedApplicationRows[0]
      }
    });
  } catch (error) {
    console.error('Error withdrawing application:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while withdrawing application'
    });
  }
};

/**
 * Add comment to an application
 */
export const addCommentToApplication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const currentUser = (req as any).currentUser;

    // Validate required fields
    if (!comment) {
      return res.status(400).json({
        success: false,
        message: 'Comment is required'
      });
    }

    // Get application
    const [applicationRows]: any = await pool.execute(
      'SELECT * FROM job_applications WHERE id = ?',
      [id]
    );

    if (applicationRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if user is authorized to comment on this application
    const isAuthorizedHR = currentUser?.role_id && (currentUser.role_id === 1 || currentUser.role_id === 2); // Assuming role IDs 1 and 2 are admin/HR
    if (!isAuthorizedHR) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to comment on this application'
      });
    }

    // Insert the comment
    await pool.execute(
      'INSERT INTO application_comments (job_application_id, commented_by, comment) VALUES (?, ?, ?)',
      [id, currentUser.id, comment]
    );

    // Get the inserted comment
    const [commentRows]: any = await pool.execute(
      `SELECT ac.*, u.full_name as commented_by_name
       FROM application_comments ac
       JOIN users u ON ac.commented_by = u.id
       WHERE ac.job_application_id = ? AND ac.comment = ?
       ORDER BY ac.created_at DESC LIMIT 1`,
      [id, comment]
    );

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: {
        comment: commentRows[0]
      }
    });
  } catch (error) {
    console.error('Error adding comment to application:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while adding comment to application'
    });
  }
};

/**
 * Get comments for an application
 */
export const getCommentsForApplication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).currentUser;

    // Get application
    const [applicationRows]: any = await pool.execute(
      'SELECT * FROM job_applications WHERE id = ?',
      [id]
    );

    if (applicationRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const application = applicationRows[0];

    // Check if user is authorized to view comments for this application
    const isApplicant = application.applicant_email === currentUser?.email;
    const isAuthorizedHR = currentUser?.role_id && (currentUser.role_id === 1 || currentUser.role_id === 2); // Assuming role IDs 1 and 2 are admin/HR

    if (!isApplicant && !isAuthorizedHR) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view comments for this application'
      });
    }

    // Get comments for the application
    const [commentRows]: any = await pool.execute(
      `SELECT ac.*, u.full_name as commented_by_name
       FROM application_comments ac
       JOIN users u ON ac.commented_by = u.id
       WHERE ac.job_application_id = ?
       ORDER BY ac.created_at DESC`,
      [id]
    );

    return res.json({
      success: true,
      data: {
        comments: commentRows
      }
    });
  } catch (error) {
    console.error('Error fetching comments for application:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching comments for application'
    });
  }
};