import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import axios from 'axios';
import { pool } from '../config/database';
import { sendStaffInvitationEmail } from '../services/email.service';
import { authenticateJWT } from '../middleware/auth.middleware';
import { checkPermission } from '../middleware/auth.middleware';

// Function to generate invitation token
const generateInvitationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Function to generate a temporary password
const generateTemporaryPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Function to create an email via cPanel API
const createCpanelEmail = async (email: string, password: string): Promise<boolean> => {
  try {
    // Check if cPanel credentials are configured
    if (!process.env.CPANEL_HOST || !process.env.CPANEL_USERNAME || !process.env.CPANEL_PASSWORD) {
      console.warn('cPanel credentials not configured. Skipping email creation.');
      return true; // Return true to continue with the invitation process
    }

    // Extract username and domain from email
    const [username, domain] = email.split('@');

    // cPanel API parameters
    const cpanelParams = {
      cpanel_jsonapi_module: 'Email',
      cpanel_jsonapi_func: 'add_pop',
      cpanel_jsonapi_apiversion: 2,
      domain: domain,
      email: username,
      password: password,
      quota: 1000 // Quota in MB, adjust as needed
    };

    // Import https module properly for ES modules
    const https = await import('https');

    // Make request to cPanel API
    const response = await axios.post(
      `https://${process.env.CPANEL_HOST}:2083/json-api/cpanel`,
      new URLSearchParams(cpanelParams as any),
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.CPANEL_USERNAME}:${process.env.CPANEL_PASSWORD}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }) // Note: In production, properly configure SSL
      }
    );

    // Check if the request was successful
    if (response.data && response.data.cpanelresult && response.data.cpanelresult.error) {
      console.error('cPanel API error:', response.data.cpanelresult.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error creating cPanel email:', error);
    return false;
  }
};

// Invite a new staff member
export const inviteStaffMember = async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      personalEmail,
      phone,
      roleId,
      branchId,
      departmentId
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !personalEmail || !roleId) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, personal email, and role ID are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(personalEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid personal email format'
      });
    }

    // Check if role exists
    const [roleRows]: any = await pool.execute(
      'SELECT id FROM roles WHERE id = ?',
      [roleId]
    );

    if (roleRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Check if branch exists (if provided)
    if (branchId) {
      const [branchRows]: any = await pool.execute(
        'SELECT id FROM branches WHERE id = ?',
        [branchId]
      );

      if (branchRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Branch not found'
        });
      }
    }

    // Check if department exists (if provided)
    if (departmentId) {
      const [deptRows]: any = await pool.execute(
        'SELECT id FROM departments WHERE id = ?',
        [departmentId]
      );

      if (deptRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }
    }

    // Check if user already exists with this email
    const [existingUsers]: any = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [personalEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'A user account already exists with this email address'
      });
    }

    // Check for existing pending invitation
    const [existingInvitations]: any = await pool.execute(
      'SELECT id, status, expires_at FROM staff_invitations WHERE email = ? AND status = "pending"',
      [personalEmail]
    );

    if (existingInvitations.length > 0) {
      const invitation = existingInvitations[0];
      const isExpired = new Date(invitation.expires_at) < new Date();
      
      if (!isExpired) {
        return res.status(400).json({
          success: false,
          message: 'An invitation has already been sent to this email address. Please ask the recipient to check their spam folder.',
          data: {
            existingInvitation: true,
            status: invitation.status,
            expiresAt: invitation.expires_at
          }
        });
      }
      // If expired, we could allow resending - continue with insertion
    }

    // Generate invitation token and temporary password
    const token = generateInvitationToken();
    const temporaryPassword = generateTemporaryPassword();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Get department name if departmentId provided
    let departmentName = null;
    if (departmentId) {
      const [deptRows]: any = await pool.execute('SELECT name FROM departments WHERE id = ?', [departmentId]);
      if (deptRows.length > 0) {
        departmentName = deptRows[0].name;
      }
    }

    // Get current user (who is sending invitation)
    const adminId = (req as any).currentUser?.userId;

    // Hash the temporary password for storage
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    // Generate work email (remove spaces from names to avoid malformed emails)
    const sanitizedFirstName = firstName.trim().replace(/\s+/g, '').toLowerCase();
    const sanitizedLastName = lastName.trim().replace(/\s+/g, '').toLowerCase();
    const workEmail = `${sanitizedFirstName}.${sanitizedLastName}@femtechaccess.com.ng`;

    // Create user account immediately with temporary password
    // Note: Use 'active' status since ENUM doesn't include 'pending'
    const [userResult]: any = await pool.execute(
      `INSERT INTO users
       (email, password_hash, full_name, phone, role_id, branch_id, status, must_change_password, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'active', 1, NOW(), NOW())`,
      [
        workEmail,
        passwordHash,
        `${firstName} ${lastName}`,
        phone ?? null,
        roleId ?? null,
        branchId ?? null
      ]
    );

    const userId = userResult.insertId;

    // Create staff record if department exists
    // Note: Use 'active' status since ENUM doesn't include 'pending'
    if (departmentId) {
      await pool.execute(
        `INSERT INTO staff
         (user_id, employee_id, designation, department, branch_id, joining_date, employment_type, status)
         VALUES (?, ?, ?, ?, ?, ?, 'full_time', 'active')`,
        [
          userId,
          `EMP${userId.toString().padStart(4, '0')}`,
          'Employee',
          departmentName || 'General',
          branchId ?? null,
          new Date().toISOString().split('T')[0]
        ]
      );
    }

    // Create invitation record - ensure no undefined values
    await pool.execute(
      `INSERT INTO staff_invitations
       (email, token, first_name, last_name, phone, role_id, branch_id, department_id, user_id, expires_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        personalEmail,
        token,
        firstName,
        lastName,
        phone ?? null,
        roleId ?? null,
        branchId ?? null,
        departmentId ?? null,
        userId,
        expiresAt,
        adminId ?? null
      ]
    );

    // Get admin name for email
    let adminName = 'an administrator';
    if (adminId) {
      const [adminRows]: any = await pool.execute('SELECT full_name FROM users WHERE id = ?', [adminId]);
      if (adminRows.length > 0 && adminRows[0].full_name) {
        adminName = adminRows[0].full_name;
      }
    }

    // Send invitation email with work email and temporary password
    try {
      await sendStaffInvitationEmail({
        to: personalEmail,
        fullName: `${firstName} ${lastName}`,
        workEmail: workEmail,
        temporaryPassword: temporaryPassword,
        invitationToken: token,
        fromAdmin: adminName
      });
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError);
      // Rollback: Delete created user and staff records
      await pool.execute('DELETE FROM staff WHERE user_id = ?', [userId]);
      await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
      await pool.execute('DELETE FROM staff_invitations WHERE user_id = ?', [userId]);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send invitation email. Please try again.'
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: {
        email: personalEmail,
        invitationSent: true,
        expiresAt: expiresAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Staff invitation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during staff invitation'
    });
  }
};

// Get all available roles for assignment
export const getAvailableRoles = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.execute(
      'SELECT id, name, description FROM roles ORDER BY name'
    );

    return res.json({
      success: true,
      data: {
        roles: rows
      }
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching roles'
    });
  }
};

// Get all branches for assignment
export const getAvailableBranches = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.execute(
      'SELECT id, name, CONCAT(address, ", ", city, ", ", state, ", ", country) as location FROM branches ORDER BY name'
    );

    return res.json({
      success: true,
      data: {
        branches: rows
      }
    });
  } catch (error) {
    console.error('Error fetching branches:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching branches'
    });
  }
};

// Get all departments for assignment
export const getAvailableDepartments = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.execute(
      'SELECT id, name, description FROM departments ORDER BY name'
    );

    return res.json({
      success: true,
      data: {
        departments: rows
      }
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching departments'
    });
  }
};

// Get all invitations
export const getAllInvitations = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.execute(
      `SELECT 
        si.id,
        si.email,
        si.first_name,
        si.last_name,
        si.phone,
        si.status,
        si.expires_at,
        si.accepted_at,
        si.created_at,
        r.name as role_name,
        b.name as branch_name,
        d.name as department_name,
        u.full_name as invited_by_name
      FROM staff_invitations si
      LEFT JOIN roles r ON si.role_id = r.id
      LEFT JOIN branches b ON si.branch_id = b.id
      LEFT JOIN departments d ON si.department_id = d.id
      LEFT JOIN users u ON si.created_by = u.id
      ORDER BY si.created_at DESC`
    );

    return res.json({
      success: true,
      data: {
        invitations: rows
      }
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching invitations'
    });
  }
};

// Get pending invitations
export const getPendingInvitations = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.execute(
      `SELECT 
        si.id,
        si.email,
        si.first_name,
        si.last_name,
        si.phone,
        si.status,
        si.expires_at,
        si.created_at,
        r.name as role_name,
        b.name as branch_name,
        d.name as department_name
      FROM staff_invitations si
      LEFT JOIN roles r ON si.role_id = r.id
      LEFT JOIN branches b ON si.branch_id = b.id
      LEFT JOIN departments d ON si.department_id = d.id
      WHERE si.status = 'pending' AND si.expires_at > NOW()
      ORDER BY si.created_at DESC`
    );

    return res.json({
      success: true,
      data: {
        invitations: rows
      }
    });
  } catch (error) {
    console.error('Error fetching pending invitations:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching pending invitations'
    });
  }
};

// Resend invitation
export const resendInvitation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get invitation details
    const [rows]: any = await pool.execute(
      'SELECT * FROM staff_invitations WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    const invitation = rows[0];

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot resend invitation. Status is ${invitation.status}`
      });
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Invitation has expired'
      });
    }

    // Generate new token, new temporary password, and extend expiry
    const newToken = generateInvitationToken();
    const newTemporaryPassword = generateTemporaryPassword();
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    // Hash the new temporary password and update user account
    const userId = invitation.user_id;
    if (userId) {
      const newPasswordHash = await bcrypt.hash(newTemporaryPassword, 10);
      await pool.execute(
        `UPDATE users SET password_hash = ?, must_change_password = 1, updated_at = NOW() WHERE id = ?`,
        [newPasswordHash, userId]
      );
    }

    // Update invitation with new token
    await pool.execute(
      'UPDATE staff_invitations SET token = ?, expires_at = ? WHERE id = ?',
      [newToken, newExpiresAt, id]
    );

    // Send invitation email with new credentials
    const emailDomain = process.env.EMAIL_DOMAIN || process.env.CPANEL_DOMAIN || 'femtechaccess.com.ng';
    const workEmail = `${invitation.first_name.toLowerCase()}.${invitation.last_name.toLowerCase()}@${emailDomain}`;

    try {
      await sendStaffInvitationEmail({
        to: invitation.email,
        fullName: `${invitation.first_name} ${invitation.last_name}`,
        workEmail: workEmail,
        temporaryPassword: newTemporaryPassword,
        invitationToken: newToken,
        fromAdmin: 'HR Team'
      });
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to resend invitation email'
      });
    }

    return res.json({
      success: true,
      message: 'Invitation resent successfully with new credentials',
      data: {
        email: invitation.email,
        expiresAt: newExpiresAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Error resending invitation:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while resending invitation'
    });
  }
};

// Cancel invitation
export const cancelInvitation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [result]: any = await pool.execute(
      'UPDATE staff_invitations SET status = "cancelled" WHERE id = ? AND status = "pending"',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or already processed'
      });
    }

    return res.json({
      success: true,
      message: 'Invitation cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while cancelling invitation'
    });
  }
};

// Accept invitation
export const acceptInvitation = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    // Get invitation details
    const [rows]: any = await pool.execute(
      'SELECT * FROM staff_invitations WHERE token = ?',
      [token]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invalid invitation token'
      });
    }

    const invitation = rows[0];

    // Check status
    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Invitation has already been ${invitation.status}`
      });
    }

    // Check expiry
    if (new Date(invitation.expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Invitation has expired'
      });
    }

    // Get the user ID from invitation
    const userId = invitation.user_id;
    
    if (!userId) {
      return res.status(500).json({
        success: false,
        message: 'Invalid invitation: no user account found'
      });
    }

    // Generate work email
    const emailDomain = process.env.EMAIL_DOMAIN || process.env.CPANEL_DOMAIN || 'femtechaccess.com.ng';
    const workEmail = `${invitation.first_name.toLowerCase()}.${invitation.last_name.toLowerCase()}@${emailDomain}`;

    // Hash the new password
    const newPasswordHash = await bcrypt.hash(password, 10);

    // Update user account: activate and set new password
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Update user status to active and set new password
      await connection.execute(
        `UPDATE users 
         SET status = 'active', password_hash = ?, must_change_password = 0, updated_at = NOW()
         WHERE id = ?`,
        [newPasswordHash, userId]
      );

      // Update staff status to active
      await connection.execute(
        `UPDATE staff SET status = 'active' WHERE user_id = ?`,
        [userId]
      );

      // Update invitation status
      await connection.execute(
        'UPDATE staff_invitations SET status = "accepted", accepted_at = NOW() WHERE id = ?',
        [invitation.id]
      );

      await connection.commit();

      return res.json({
        success: true,
        message: 'Invitation accepted successfully. You can now login with your work email.',
        data: {
          email: workEmail
        }
      });
    } catch (transactionError) {
      await connection.rollback();
      throw transactionError;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while accepting invitation'
    });
  }
};