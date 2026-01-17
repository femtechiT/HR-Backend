import { Request, Response } from 'express';
import { pool } from '../config/database';
import { notificationService } from '../services/notification.service';

/**
 * Get all job postings
 */
export const getAllJobPostings = async (req: Request, res: Response) => {
  try {
    const { departmentId, status, location, limit = 10, page = 1 } = req.query;

    let query = `
      SELECT jp.*, d.name as department_name, u.full_name as posted_by_name
      FROM job_postings jp
      LEFT JOIN departments d ON jp.department_id = d.id
      LEFT JOIN users u ON jp.posted_by = u.id
      WHERE jp.is_active = TRUE
    `;
    const params: any[] = [];

    if (departmentId) {
      query += ' AND jp.department_id = ?';
      params.push(departmentId);
    }

    if (status) {
      query += ' AND jp.status = ?';
      params.push(status);
    }

    if (location) {
      query += ' AND jp.location LIKE ?';
      params.push(`%${location}%`);
    }

    // Check if job posting has expired
    query += ' AND jp.closing_date >= CURDATE()';

    query += ' ORDER BY jp.posted_at DESC';

    // Add pagination
    const offset = (Number(page) - 1) * Number(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const [rows]: any = await pool.execute(query, params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM job_postings jp
      WHERE jp.is_active = TRUE
    `;
    const countParams = [];

    if (departmentId) {
      countQuery += ' AND jp.department_id = ?';
      countParams.push(departmentId);
    }

    if (status) {
      countQuery += ' AND jp.status = ?';
      countParams.push(status);
    }

    if (location) {
      countQuery += ' AND jp.location LIKE ?';
      countParams.push(`%${location}%`);
    }

    countQuery += ' AND jp.closing_date >= CURDATE()';

    const [countRows]: any = await pool.execute(countQuery, countParams);

    return res.json({
      success: true,
      data: {
        jobPostings: rows,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(countRows[0].total / Number(limit)),
          totalItems: countRows[0].total,
          itemsPerPage: Number(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching job postings:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching job postings'
    });
  }
};

/**
 * Get job posting by ID
 */
export const getJobPostingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [rows]: any = await pool.execute(
      `SELECT jp.*, d.name as department_name, u.full_name as posted_by_name
       FROM job_postings jp
       LEFT JOIN departments d ON jp.department_id = d.id
       LEFT JOIN users u ON jp.posted_by = u.id
       WHERE jp.id = ? AND jp.is_active = TRUE`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    const jobPosting = rows[0];

    // Check if the job posting has expired
    const currentDate = new Date().toISOString().split('T')[0];
    if (jobPosting.closing_date < currentDate) {
      jobPosting.is_expired = true;
    } else {
      jobPosting.is_expired = false;
    }

    return res.json({
      success: true,
      data: {
        jobPosting
      }
    });
  } catch (error) {
    console.error('Error fetching job posting:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching job posting'
    });
  }
};

/**
 * Create a new job posting
 */
export const createJobPosting = async (req: Request, res: Response) => {
  try {
    const { 
      title, 
      description, 
      department_id, 
      location, 
      salary_range_min, 
      salary_range_max, 
      employment_type, 
      experience_level, 
      closing_date, 
      start_date, 
      application_deadline 
    } = req.body;

    const postedBy = (req as any).currentUser.id;

    // Validate required fields
    if (!title || !description || !closing_date || !application_deadline) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, closing date, and application deadline are required'
      });
    }

    // Validate dates
    const closingDate = new Date(closing_date);
    const applicationDeadline = new Date(application_deadline);
    const today = new Date();

    if (closingDate < today || applicationDeadline < today) {
      return res.status(400).json({
        success: false,
        message: 'Closing date and application deadline must be in the future'
      });
    }

    if (applicationDeadline > closingDate) {
      return res.status(400).json({
        success: false,
        message: 'Application deadline must be on or before the closing date'
      });
    }

    // Create the job posting
    const [result]: any = await pool.execute(
      `INSERT INTO job_postings 
       (title, description, department_id, location, salary_range_min, salary_range_max, 
        employment_type, experience_level, posted_by, closing_date, start_date, 
        application_deadline, status, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        department_id || null,
        location || null,
        salary_range_min || null,
        salary_range_max || null,
        employment_type || 'full_time',
        experience_level || null,
        postedBy,
        closing_date,
        start_date || null,
        application_deadline,
        'open', // Default to open status
        true
      ]
    );

    const jobId = result.insertId;

    // Get the created job posting
    const [jobRows]: any = await pool.execute(
      `SELECT jp.*, d.name as department_name, u.full_name as posted_by_name
       FROM job_postings jp
       LEFT JOIN departments d ON jp.department_id = d.id
       LEFT JOIN users u ON jp.posted_by = u.id
       WHERE jp.id = ?`,
      [jobId]
    );

    return res.status(201).json({
      success: true,
      message: 'Job posting created successfully',
      data: {
        jobPosting: jobRows[0]
      }
    });
  } catch (error) {
    console.error('Error creating job posting:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while creating job posting'
    });
  }
};

/**
 * Update a job posting
 */
export const updateJobPosting = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      department_id, 
      location, 
      salary_range_min, 
      salary_range_max, 
      employment_type, 
      experience_level, 
      closing_date, 
      start_date, 
      application_deadline,
      status 
    } = req.body;

    // Check if job posting exists
    const [existingRows]: any = await pool.execute(
      'SELECT * FROM job_postings WHERE id = ?',
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    const existingJob = existingRows[0];

    // Validate dates if provided
    if (closing_date) {
      const closingDate = new Date(closing_date);
      const today = new Date();

      if (closingDate < today) {
        return res.status(400).json({
          success: false,
          message: 'Closing date must be in the future'
        });
      }
    }

    if (application_deadline) {
      const applicationDeadline = new Date(application_deadline);
      const today = new Date();

      if (applicationDeadline < today) {
        return res.status(400).json({
          success: false,
          message: 'Application deadline must be in the future'
        });
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const params = [];

    if (title !== undefined) {
      updateFields.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      params.push(description);
    }
    if (department_id !== undefined) {
      updateFields.push('department_id = ?');
      params.push(department_id);
    }
    if (location !== undefined) {
      updateFields.push('location = ?');
      params.push(location);
    }
    if (salary_range_min !== undefined) {
      updateFields.push('salary_range_min = ?');
      params.push(salary_range_min);
    }
    if (salary_range_max !== undefined) {
      updateFields.push('salary_range_max = ?');
      params.push(salary_range_max);
    }
    if (employment_type !== undefined) {
      updateFields.push('employment_type = ?');
      params.push(employment_type);
    }
    if (experience_level !== undefined) {
      updateFields.push('experience_level = ?');
      params.push(experience_level);
    }
    if (closing_date !== undefined) {
      updateFields.push('closing_date = ?');
      params.push(closing_date);
    }
    if (start_date !== undefined) {
      updateFields.push('start_date = ?');
      params.push(start_date);
    }
    if (application_deadline !== undefined) {
      updateFields.push('application_deadline = ?');
      params.push(application_deadline);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      params.push(status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    // Add updated_at field
    updateFields.push('updated_at = NOW()');
    params.push(id); // For WHERE clause

    const query = `UPDATE job_postings SET ${updateFields.join(', ')} WHERE id = ?`;

    await pool.execute(query, params);

    // Get the updated job posting
    const [updatedRows]: any = await pool.execute(
      `SELECT jp.*, d.name as department_name, u.full_name as posted_by_name
       FROM job_postings jp
       LEFT JOIN departments d ON jp.department_id = d.id
       LEFT JOIN users u ON jp.posted_by = u.id
       WHERE jp.id = ?`,
      [id]
    );

    return res.json({
      success: true,
      message: 'Job posting updated successfully',
      data: {
        jobPosting: updatedRows[0]
      }
    });
  } catch (error) {
    console.error('Error updating job posting:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating job posting'
    });
  }
};

/**
 * Close a job posting
 */
export const closeJobPosting = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if job posting exists
    const [existingRows]: any = await pool.execute(
      'SELECT * FROM job_postings WHERE id = ?',
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    // Update status to closed
    await pool.execute(
      'UPDATE job_postings SET status = ?, updated_at = NOW() WHERE id = ?',
      ['closed', id]
    );

    return res.json({
      success: true,
      message: 'Job posting closed successfully'
    });
  } catch (error) {
    console.error('Error closing job posting:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while closing job posting'
    });
  }
};

/**
 * Delete (deactivate) a job posting
 */
export const deleteJobPosting = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if job posting exists
    const [existingRows]: any = await pool.execute(
      'SELECT * FROM job_postings WHERE id = ?',
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    // Instead of hard deleting, deactivate the posting
    await pool.execute(
      'UPDATE job_postings SET is_active = FALSE, updated_at = NOW() WHERE id = ?',
      [id]
    );

    return res.json({
      success: true,
      message: 'Job posting deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating job posting:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while deactivating job posting'
    });
  }
};