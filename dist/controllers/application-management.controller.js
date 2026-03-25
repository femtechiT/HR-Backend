"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommentsForApplication = exports.addCommentToApplication = exports.withdrawApplication = exports.getAllApplications = exports.updateApplicationStatus = void 0;
const database_1 = require("../config/database");
const notification_service_1 = require("../services/notification.service");
const updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejection_reason } = req.body;
        const currentUser = req.currentUser;
        const validStatuses = ['applied', 'under_review', 'shortlisted', 'interviewed', 'offered', 'rejected', 'withdrawn'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Valid statuses are: ${validStatuses.join(', ')}`
            });
        }
        const [currentApplicationRows] = await database_1.pool.execute('SELECT * FROM job_applications WHERE id = ?', [id]);
        if (currentApplicationRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }
        const currentApplication = currentApplicationRows[0];
        const isAuthorizedHR = currentUser?.role_id && (currentUser.role_id === 1 || currentUser.role_id === 2);
        if (!isAuthorizedHR) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to update application status'
            });
        }
        const updateFields = [];
        const params = [];
        updateFields.push('application_status = ?');
        params.push(status);
        if (rejection_reason !== undefined) {
            updateFields.push('rejection_reason = ?');
            params.push(rejection_reason);
        }
        updateFields.push('reviewed_by = ?');
        params.push(currentUser.id);
        updateFields.push('reviewed_at = NOW()');
        updateFields.push('updated_at = NOW()');
        params.push(id);
        const query = `UPDATE job_applications SET ${updateFields.join(', ')} WHERE id = ?`;
        await database_1.pool.execute(query, params);
        const [updatedApplicationRows] = await database_1.pool.execute(`SELECT ja.*, jp.title as job_title, jp.description as job_description
       FROM job_applications ja
       JOIN job_postings jp ON ja.job_posting_id = jp.id
       WHERE ja.id = ?`, [id]);
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
                    break;
            }
            if (templateName) {
                const [userRows] = await database_1.pool.execute('SELECT id FROM users WHERE email = ?', [currentApplication.applicant_email]);
                const userId = userRows.length > 0 ? userRows[0].id : 0;
                await notification_service_1.notificationService.queueNotification(userId, templateName, templateVariables, {
                    channel: 'email',
                    priority: 'normal'
                });
            }
        }
        catch (notificationError) {
            console.error('Error queuing status update notification:', notificationError);
        }
        return res.json({
            success: true,
            message: 'Application status updated successfully',
            data: {
                application: updatedApplicationRows[0]
            }
        });
    }
    catch (error) {
        console.error('Error updating application status:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while updating application status'
        });
    }
};
exports.updateApplicationStatus = updateApplicationStatus;
const getAllApplications = async (req, res) => {
    try {
        const { status, job_posting_id, applicant_email, limit = 10, page = 1 } = req.query;
        const currentUser = req.currentUser;
        const isAuthorizedHR = currentUser?.role_id && (currentUser.role_id === 1 || currentUser.role_id === 2);
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
        const params = [];
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
        const offset = (Number(page) - 1) * Number(limit);
        query += ' LIMIT ? OFFSET ?';
        params.push(Number(limit), offset);
        const [rows] = await database_1.pool.execute(query, params);
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
        const [countRows] = await database_1.pool.execute(countQuery, countParams);
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
    }
    catch (error) {
        console.error('Error fetching applications:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching applications'
        });
    }
};
exports.getAllApplications = getAllApplications;
const withdrawApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = req.currentUser;
        const [currentApplicationRows] = await database_1.pool.execute('SELECT * FROM job_applications WHERE id = ?', [id]);
        if (currentApplicationRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }
        const currentApplication = currentApplicationRows[0];
        const isApplicant = currentApplication.applicant_email === currentUser?.email;
        const isAuthorizedHR = currentUser?.role_id && (currentUser.role_id === 1 || currentUser.role_id === 2);
        if (!isApplicant && !isAuthorizedHR) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to withdraw this application'
            });
        }
        await database_1.pool.execute('UPDATE job_applications SET application_status = ?, updated_at = NOW() WHERE id = ?', ['withdrawn', id]);
        const [updatedApplicationRows] = await database_1.pool.execute(`SELECT ja.*, jp.title as job_title
       FROM job_applications ja
       JOIN job_postings jp ON ja.job_posting_id = jp.id
       WHERE ja.id = ?`, [id]);
        try {
            await notification_service_1.notificationService.queueNotification(0, 'application_withdrawn_acknowledgment', {
                applicant_name: currentApplication.applicant_name,
                job_title: updatedApplicationRows[0].job_title,
                company_name: process.env.APP_NAME || 'Our Company'
            }, {
                channel: 'email',
                priority: 'normal'
            });
        }
        catch (notificationError) {
            console.error('Error queuing withdrawal acknowledgment notification:', notificationError);
        }
        return res.json({
            success: true,
            message: 'Application withdrawn successfully',
            data: {
                application: updatedApplicationRows[0]
            }
        });
    }
    catch (error) {
        console.error('Error withdrawing application:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while withdrawing application'
        });
    }
};
exports.withdrawApplication = withdrawApplication;
const addCommentToApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const { comment } = req.body;
        const currentUser = req.currentUser;
        if (!comment) {
            return res.status(400).json({
                success: false,
                message: 'Comment is required'
            });
        }
        const [applicationRows] = await database_1.pool.execute('SELECT * FROM job_applications WHERE id = ?', [id]);
        if (applicationRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }
        const isAuthorizedHR = currentUser?.role_id && (currentUser.role_id === 1 || currentUser.role_id === 2);
        if (!isAuthorizedHR) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to comment on this application'
            });
        }
        await database_1.pool.execute('INSERT INTO application_comments (job_application_id, commented_by, comment) VALUES (?, ?, ?)', [id, currentUser.id, comment]);
        const [commentRows] = await database_1.pool.execute(`SELECT ac.*, u.full_name as commented_by_name
       FROM application_comments ac
       JOIN users u ON ac.commented_by = u.id
       WHERE ac.job_application_id = ? AND ac.comment = ?
       ORDER BY ac.created_at DESC LIMIT 1`, [id, comment]);
        return res.status(201).json({
            success: true,
            message: 'Comment added successfully',
            data: {
                comment: commentRows[0]
            }
        });
    }
    catch (error) {
        console.error('Error adding comment to application:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while adding comment to application'
        });
    }
};
exports.addCommentToApplication = addCommentToApplication;
const getCommentsForApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = req.currentUser;
        const [applicationRows] = await database_1.pool.execute('SELECT * FROM job_applications WHERE id = ?', [id]);
        if (applicationRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }
        const application = applicationRows[0];
        const isApplicant = application.applicant_email === currentUser?.email;
        const isAuthorizedHR = currentUser?.role_id && (currentUser.role_id === 1 || currentUser.role_id === 2);
        if (!isApplicant && !isAuthorizedHR) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to view comments for this application'
            });
        }
        const [commentRows] = await database_1.pool.execute(`SELECT ac.*, u.full_name as commented_by_name
       FROM application_comments ac
       JOIN users u ON ac.commented_by = u.id
       WHERE ac.job_application_id = ?
       ORDER BY ac.created_at DESC`, [id]);
        return res.json({
            success: true,
            data: {
                comments: commentRows
            }
        });
    }
    catch (error) {
        console.error('Error fetching comments for application:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching comments for application'
        });
    }
};
exports.getCommentsForApplication = getCommentsForApplication;
//# sourceMappingURL=application-management.controller.js.map