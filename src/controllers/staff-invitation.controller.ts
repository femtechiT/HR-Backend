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

// Internal: core invitation creation logic (shared by single and bulk invite)
async function createSingleInvitation(
  firstName: string,
  lastName: string,
  personalEmail: string,
  phone: string | undefined,
  roleId: number,
  branchId: number | undefined,
  departmentId: number | undefined,
  adminId: number | undefined
): Promise<{ success: true; data: any } | { success: false; message: string; code?: string }> {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(personalEmail)) {
    return { success: false, message: `Invalid email format: ${personalEmail}`, code: 'INVALID_EMAIL' };
  }

  // Check if role exists
  const [roleRows]: any = await pool.execute('SELECT id FROM roles WHERE id = ?', [roleId]);
  if (roleRows.length === 0) {
    return { success: false, message: `Role not found: ${roleId}`, code: 'ROLE_NOT_FOUND' };
  }

  // Check if branch exists (if provided)
  if (branchId) {
    const [branchRows]: any = await pool.execute('SELECT id FROM branches WHERE id = ?', [branchId]);
    if (branchRows.length === 0) {
      return { success: false, message: `Branch not found: ${branchId}`, code: 'BRANCH_NOT_FOUND' };
    }
  }

  // Check if department exists (if provided)
  if (departmentId) {
    const [deptRows]: any = await pool.execute('SELECT id FROM departments WHERE id = ?', [departmentId]);
    if (deptRows.length === 0) {
      return { success: false, message: `Department not found: ${departmentId}`, code: 'DEPARTMENT_NOT_FOUND' };
    }
  }

  // Check if user already exists with this email
  const [existingUsers]: any = await pool.execute('SELECT id FROM users WHERE email = ?', [personalEmail]);
  if (existingUsers.length > 0) {
    return { success: false, message: `User already exists with email: ${personalEmail}`, code: 'USER_EXISTS' };
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
      return { success: false, message: `Pending invitation already exists for: ${personalEmail}`, code: 'PENDING_INVITATION' };
    }
  }

  // Generate token and temp password
  const token = generateInvitationToken();
  const temporaryPassword = generateTemporaryPassword();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Get department name
  let departmentName = null;
  if (departmentId) {
    const [deptRows]: any = await pool.execute('SELECT name FROM departments WHERE id = ?', [departmentId]);
    if (deptRows.length > 0) departmentName = deptRows[0].name;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  // Use personal email as the login email
  const loginEmail = personalEmail.trim().toLowerCase();

  // Create user
  const [userResult]: any = await pool.execute(
    `INSERT INTO users
     (email, password_hash, full_name, phone, role_id, branch_id, status, must_change_password, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'active', 1, NOW(), NOW())`,
    [loginEmail, passwordHash, `${firstName} ${lastName}`, phone ?? null, roleId, branchId ?? null]
  );
  const userId = userResult.insertId;

  // Create staff record if department provided
  if (departmentId) {
    await pool.execute(
      `INSERT INTO staff
       (user_id, employee_id, designation, department, branch_id, joining_date, employment_type, status, personal_email)
       VALUES (?, ?, ?, ?, ?, ?, 'full_time', 'active', ?)`,
      [userId, `EMP${userId.toString().padStart(4, '0')}`, 'Employee', departmentName || 'General', branchId ?? null, new Date().toISOString().split('T')[0], loginEmail]
    );
  }

  // Create invitation record
  await pool.execute(
    `INSERT INTO staff_invitations
     (email, token, first_name, last_name, phone, role_id, branch_id, department_id, user_id, expires_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [loginEmail, token, firstName, lastName, phone ?? null, roleId, branchId ?? null, departmentId ?? null, userId, expiresAt, adminId ?? null]
  );

  // Get admin name for email
  let adminName = 'an administrator';
  if (adminId) {
    const [adminRows]: any = await pool.execute('SELECT full_name FROM users WHERE id = ?', [adminId]);
    if (adminRows.length > 0 && adminRows[0].full_name) adminName = adminRows[0].full_name;
  }

  // Send invitation email
  try {
    await sendStaffInvitationEmail({
      to: loginEmail,
      fullName: `${firstName} ${lastName}`,
      loginEmail,
      temporaryPassword,
      invitationToken: token,
      fromAdmin: adminName
    });
  } catch (emailError: any) {
    const isDomainError = emailError?.message?.includes('not verified') || emailError?.message?.includes('domain');

    if (process.env.NODE_ENV !== 'production' && isDomainError) {
      // In development: log credentials to console instead of failing
      console.warn('\n' + '='.repeat(60));
      console.warn('⚠️  Email not sent (unverified Resend domain)');
      console.warn('='.repeat(60));
      console.warn(`  Invitee: ${firstName} ${lastName}`);
      console.warn(`  Personal Email: ${personalEmail}`);
      console.warn(`  Work Email:     ${workEmail}`);
      console.warn(`  Temp Password:  ${temporaryPassword}`);
      console.warn(`  Accept Token:   ${token}`);
      console.warn('='.repeat(60) + '\n');
    } else {
      console.error('Error sending invitation email:', emailError);
      // Rollback on real failures
      await pool.execute('DELETE FROM staff WHERE user_id = ?', [userId]);
      await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
      await pool.execute('DELETE FROM staff_invitations WHERE user_id = ?', [userId]);
      return { success: false, message: `Failed to send email to: ${personalEmail}`, code: 'EMAIL_FAILED' };
    }
  }

  return {
    success: true,
    data: {
      email: personalEmail,
      firstName,
      lastName,
      workEmail,
      expiresAt: expiresAt.toISOString()
    }
  };
}

// Bulk invite multiple staff members at once
export const bulkInviteStaff = async (req: Request, res: Response) => {
  try {
    const { invitations } = req.body;

    if (!Array.isArray(invitations) || invitations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invitations array is required and must not be empty'
      });
    }

    if (invitations.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 50 invitations per request'
      });
    }

    const adminId = (req as any).currentUser?.userId;
    const results: Array<{
      index: number;
      email: string;
      success: boolean;
      message?: string;
      code?: string;
      data?: any;
    }> = [];

    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < invitations.length; i++) {
      const invite = invitations[i];
      const { firstName, lastName, personalEmail, phone, roleId, branchId, departmentId } = invite;

      // Validate minimum required fields per item
      if (!firstName || !lastName || !personalEmail || !roleId) {
        results.push({
          index: i,
          email: personalEmail || 'N/A',
          success: false,
          message: 'firstName, lastName, personalEmail, and roleId are required',
          code: 'MISSING_FIELDS'
        });
        failureCount++;
        continue;
      }

      const result = await createSingleInvitation(
        firstName, lastName, personalEmail, phone, roleId, branchId, departmentId, adminId
      );

      if (result.success) {
        results.push({ index: i, email: personalEmail, success: true, data: result.data });
        successCount++;
      } else {
        results.push({ index: i, email: personalEmail, success: false, message: (result as any).message, code: (result as any).code });
        failureCount++;
      }
    }

    return res.status(successCount > 0 ? 200 : 400).json({
      success: successCount > 0,
      message: `${successCount} invitation(s) sent, ${failureCount} failed`,
      data: {
        total: invitations.length,
        successCount,
        failureCount,
        results
      }
    });
  } catch (error) {
    console.error('Bulk staff invitation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during bulk staff invitation'
    });
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

    const adminId = (req as any).currentUser?.userId;
    const result = await createSingleInvitation(firstName, lastName, personalEmail, phone, roleId, branchId, departmentId, adminId);

    if (!result.success) {
      const r = result as any;
      const statusCode = r.code === 'PENDING_INVITATION' ? 400
        : r.code === 'USER_EXISTS' ? 400
        : r.code === 'EMAIL_FAILED' ? 500 : 400;

      return res.status(statusCode).json({
        success: false,
        message: r.message,
        code: r.code
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: result.data
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
    // Dynamically determine which tracking columns exist
    const [cols]: any = await pool.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'staff_invitations'
        AND COLUMN_NAME IN ('first_login_at','first_login_ip','profile_completed','last_activity_at','declined_at')
    `);
    const availableCols = new Set(cols.map((c: any) => c.COLUMN_NAME));

    const selectFields = `
        si.id,
        si.email,
        si.first_name,
        si.last_name,
        si.phone,
        si.status,
        si.expires_at,
        si.accepted_at,
        ${availableCols.has('first_login_at') ? 'si.first_login_at,' : 'NULL AS first_login_at,'}
        ${availableCols.has('first_login_ip') ? 'si.first_login_ip,' : 'NULL AS first_login_ip,'}
        ${availableCols.has('profile_completed') ? 'si.profile_completed,' : 'FALSE AS profile_completed,'}
        ${availableCols.has('last_activity_at') ? 'si.last_activity_at,' : 'NULL AS last_activity_at,'}
        ${availableCols.has('declined_at') ? 'si.declined_at,' : 'NULL AS declined_at,'}
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
      ORDER BY si.created_at DESC`;

    const [rows]: any = await pool.execute(`SELECT${selectFields}`);

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
        message: 'Invitation accepted successfully. You can now login with your email address.',
        data: {
          email: invitation.email
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

// Accept invitation (GET — auto-accept via email link, then redirect to Staff Portal)
export const acceptInvitationLink = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const [rows]: any = await pool.execute(
      'SELECT id, user_id, status, expires_at, first_name, last_name FROM staff_invitations WHERE token = ?',
      [token]
    );

    if (rows.length === 0) {
      return res.redirect(`${process.env.STAFF_PORTAL_URL || 'https://tms.femtechaccess.com.ng'}/invite?error=invalid`);
    }

    const invitation = rows[0];

    if (invitation.status === 'accepted') {
      // Already accepted — redirect to login
      return res.redirect(`${process.env.STAFF_PORTAL_URL || 'https://tms.femtechaccess.com.ng'}/login?accepted=1&email=${encodeURIComponent(invitation.email)}`);
    }

    if (invitation.status !== 'pending') {
      return res.redirect(`${process.env.STAFF_PORTAL_URL || 'https://tms.femtechaccess.com.ng'}/invite?error=${invitation.status}`);
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return res.redirect(`${process.env.STAFF_PORTAL_URL || 'https://tms.femtechaccess.com.ng'}/invite?error=expired`);
    }

    // Mark as accepted
    await pool.execute(
      'UPDATE staff_invitations SET status = "accepted", accepted_at = NOW() WHERE id = ?',
      [invitation.id]
    );

    // Activate user
    if (invitation.user_id) {
      await pool.execute(
        `UPDATE users SET status = 'active' WHERE id = ?`,
        [invitation.user_id]
      );
    }

    // Redirect to Staff Portal
    return res.redirect(`${process.env.STAFF_PORTAL_URL || 'https://tms.femtechaccess.com.ng'}/login?accepted=1&email=${encodeURIComponent(invitation.email)}`);
  } catch (error) {
    console.error('Error accepting invitation via link:', error);
    return res.redirect(`${process.env.STAFF_PORTAL_URL || 'https://tms.femtechaccess.com.ng'}/invite?error=server`);
  }
};

// Decline invitation
export const declineInvitation = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const [rows]: any = await pool.execute(
      'SELECT id, status, expires_at FROM staff_invitations WHERE token = ?',
      [token]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invalid invitation token' });
    }

    const invitation = rows[0];
    if (invitation.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Invitation has already been ${invitation.status}` });
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: 'Invitation has expired' });
    }

    await pool.execute(
      'UPDATE staff_invitations SET status = "declined", declined_at = NOW() WHERE id = ?',
      [invitation.id]
    );

    return res.json({ success: true, message: 'Invitation declined' });
  } catch (error) {
    console.error('Error declining invitation:', error);
    return res.status(500).json({ success: false, message: 'Internal server error while declining invitation' });
  }
};

// Get invitation statistics / analytics
export const getInvitationStats = async (req: Request, res: Response) => {
  try {
    // Overall counts by status
    const [statusCounts]: any = await pool.execute(
      `SELECT status, COUNT(*) as count FROM staff_invitations GROUP BY status`
    );

    // Accepted invitations tracking
    const [acceptedTracking]: any = await pool.execute(
      `SELECT
        COUNT(*) as total_accepted,
        SUM(CASE WHEN first_login_at IS NOT NULL THEN 1 ELSE 0 END) as first_logged_in,
        SUM(CASE WHEN first_login_at IS NULL AND accepted_at IS NOT NULL THEN 1 ELSE 0 END) as accepted_not_logged_in,
        SUM(CASE WHEN profile_completed = TRUE THEN 1 ELSE 0 END) as profile_completed_count,
        SUM(CASE WHEN profile_completed = FALSE AND first_login_at IS NOT NULL THEN 1 ELSE 0 END) as logged_in_not_completed
      FROM staff_invitations
      WHERE status = 'accepted'`
    );

    // Recent invitations (last 7 days)
    const [recent]: any = await pool.execute(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' AND expires_at > NOW() THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'accepted' AND accepted_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as recently_accepted,
        SUM(CASE WHEN status = 'expired' OR (status = 'pending' AND expires_at <= NOW()) THEN 1 ELSE 0 END) as expired
      FROM staff_invitations
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );

    // Pending invitations approaching expiry (within 48 hours)
    const [expiringSoon]: any = await pool.execute(
      `SELECT COUNT(*) as count FROM staff_invitations
       WHERE status = 'pending'
         AND expires_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 48 HOUR)`
    );

    // Invitations by role
    const [byRole]: any = await pool.execute(
      `SELECT r.name as role_name, COUNT(*) as count
       FROM staff_invitations si
       LEFT JOIN roles r ON si.role_id = r.id
       GROUP BY r.name ORDER BY count DESC`
    );

    // Invitations by branch
    const [byBranch]: any = await pool.execute(
      `SELECT b.name as branch_name, COUNT(*) as count
       FROM staff_invitations si
       LEFT JOIN branches b ON si.branch_id = b.id
       GROUP BY b.name ORDER BY count DESC`
    );

    const statusMap: Record<string, number> = {};
    for (const row of statusCounts) {
      statusMap[row.status] = row.count;
    }

    return res.json({
      success: true,
      data: {
        overview: {
          total: Object.values(statusMap).reduce((a: number, b: number) => a + b, 0),
          pending: statusMap['pending'] || 0,
          accepted: statusMap['accepted'] || 0,
          expired: statusMap['expired'] || 0,
          cancelled: statusMap['cancelled'] || 0,
          declined: statusMap['declined'] || 0,
        },
        acceptedTracking: acceptedTracking[0],
        recent7Days: recent[0],
        expiringSoon: expiringSoon[0].count,
        byRole,
        byBranch
      }
    });
  } catch (error) {
    console.error('Error fetching invitation stats:', error);
    return res.status(500).json({ success: false, message: 'Internal server error while fetching invitation stats' });
  }
};