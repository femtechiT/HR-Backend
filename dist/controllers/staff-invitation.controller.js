"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.acceptInvitation = exports.cancelInvitation = exports.resendInvitation = exports.getPendingInvitations = exports.getAllInvitations = exports.getAvailableDepartments = exports.getAvailableBranches = exports.getAvailableRoles = exports.inviteStaffMember = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
const database_1 = require("../config/database");
const email_service_1 = require("../services/email.service");
const generateInvitationToken = () => {
    return crypto_1.default.randomBytes(32).toString('hex');
};
const generateTemporaryPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
};
const createCpanelEmail = async (email, password) => {
    try {
        if (!process.env.CPANEL_HOST || !process.env.CPANEL_USERNAME || !process.env.CPANEL_PASSWORD) {
            console.warn('cPanel credentials not configured. Skipping email creation.');
            return true;
        }
        const [username, domain] = email.split('@');
        const cpanelParams = {
            cpanel_jsonapi_module: 'Email',
            cpanel_jsonapi_func: 'add_pop',
            cpanel_jsonapi_apiversion: 2,
            domain: domain,
            email: username,
            password: password,
            quota: 1000
        };
        const https = await Promise.resolve().then(() => __importStar(require('https')));
        const response = await axios_1.default.post(`https://${process.env.CPANEL_HOST}:2083/json-api/cpanel`, new URLSearchParams(cpanelParams), {
            headers: {
                'Authorization': `Basic ${Buffer.from(`${process.env.CPANEL_USERNAME}:${process.env.CPANEL_PASSWORD}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
        });
        if (response.data && response.data.cpanelresult && response.data.cpanelresult.error) {
            console.error('cPanel API error:', response.data.cpanelresult.error);
            return false;
        }
        return true;
    }
    catch (error) {
        console.error('Error creating cPanel email:', error);
        return false;
    }
};
const inviteStaffMember = async (req, res) => {
    try {
        const { firstName, lastName, personalEmail, phone, roleId, branchId, departmentId } = req.body;
        if (!firstName || !lastName || !personalEmail || !roleId) {
            return res.status(400).json({
                success: false,
                message: 'First name, last name, personal email, and role ID are required'
            });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(personalEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid personal email format'
            });
        }
        const [roleRows] = await database_1.pool.execute('SELECT id FROM roles WHERE id = ?', [roleId]);
        if (roleRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }
        if (branchId) {
            const [branchRows] = await database_1.pool.execute('SELECT id FROM branches WHERE id = ?', [branchId]);
            if (branchRows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Branch not found'
                });
            }
        }
        if (departmentId) {
            const [deptRows] = await database_1.pool.execute('SELECT id FROM departments WHERE id = ?', [departmentId]);
            if (deptRows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Department not found'
                });
            }
        }
        const [existingUsers] = await database_1.pool.execute('SELECT id FROM users WHERE email = ?', [personalEmail]);
        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'A user account already exists with this email address'
            });
        }
        const [existingInvitations] = await database_1.pool.execute('SELECT id, status, expires_at FROM staff_invitations WHERE email = ? AND status = "pending"', [personalEmail]);
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
        }
        const token = generateInvitationToken();
        const temporaryPassword = generateTemporaryPassword();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        let departmentName = null;
        if (departmentId) {
            const [deptRows] = await database_1.pool.execute('SELECT name FROM departments WHERE id = ?', [departmentId]);
            if (deptRows.length > 0) {
                departmentName = deptRows[0].name;
            }
        }
        const adminId = req.currentUser?.userId;
        const passwordHash = await bcryptjs_1.default.hash(temporaryPassword, 10);
        const workEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@tripa.com.ng`;
        const [userResult] = await database_1.pool.execute(`INSERT INTO users
       (email, password_hash, full_name, phone, role_id, branch_id, status, must_change_password, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'active', 1, NOW(), NOW())`, [
            workEmail,
            passwordHash,
            `${firstName} ${lastName}`,
            phone ?? null,
            roleId ?? null,
            branchId ?? null
        ]);
        const userId = userResult.insertId;
        if (departmentId) {
            await database_1.pool.execute(`INSERT INTO staff
         (user_id, employee_id, designation, department, branch_id, joining_date, employment_type, status)
         VALUES (?, ?, ?, ?, ?, ?, 'full_time', 'active')`, [
                userId,
                `EMP${userId.toString().padStart(4, '0')}`,
                'Employee',
                departmentName || 'General',
                branchId ?? null,
                new Date().toISOString().split('T')[0]
            ]);
        }
        await database_1.pool.execute(`INSERT INTO staff_invitations
       (email, token, first_name, last_name, phone, role_id, branch_id, department_id, user_id, expires_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
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
        ]);
        let adminName = 'an administrator';
        if (adminId) {
            const [adminRows] = await database_1.pool.execute('SELECT full_name FROM users WHERE id = ?', [adminId]);
            if (adminRows.length > 0 && adminRows[0].full_name) {
                adminName = adminRows[0].full_name;
            }
        }
        try {
            await (0, email_service_1.sendStaffInvitationEmail)({
                to: personalEmail,
                fullName: `${firstName} ${lastName}`,
                workEmail: workEmail,
                temporaryPassword: temporaryPassword,
                invitationToken: token,
                fromAdmin: adminName
            });
        }
        catch (emailError) {
            console.error('Error sending invitation email:', emailError);
            await database_1.pool.execute('DELETE FROM staff WHERE user_id = ?', [userId]);
            await database_1.pool.execute('DELETE FROM users WHERE id = ?', [userId]);
            await database_1.pool.execute('DELETE FROM staff_invitations WHERE user_id = ?', [userId]);
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
    }
    catch (error) {
        console.error('Staff invitation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during staff invitation'
        });
    }
};
exports.inviteStaffMember = inviteStaffMember;
const getAvailableRoles = async (req, res) => {
    try {
        const [rows] = await database_1.pool.execute('SELECT id, name, description FROM roles ORDER BY name');
        return res.json({
            success: true,
            data: {
                roles: rows
            }
        });
    }
    catch (error) {
        console.error('Error fetching roles:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching roles'
        });
    }
};
exports.getAvailableRoles = getAvailableRoles;
const getAvailableBranches = async (req, res) => {
    try {
        const [rows] = await database_1.pool.execute('SELECT id, name, CONCAT(address, ", ", city, ", ", state, ", ", country) as location FROM branches ORDER BY name');
        return res.json({
            success: true,
            data: {
                branches: rows
            }
        });
    }
    catch (error) {
        console.error('Error fetching branches:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching branches'
        });
    }
};
exports.getAvailableBranches = getAvailableBranches;
const getAvailableDepartments = async (req, res) => {
    try {
        const [rows] = await database_1.pool.execute('SELECT id, name, description FROM departments ORDER BY name');
        return res.json({
            success: true,
            data: {
                departments: rows
            }
        });
    }
    catch (error) {
        console.error('Error fetching departments:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching departments'
        });
    }
};
exports.getAvailableDepartments = getAvailableDepartments;
const getAllInvitations = async (req, res) => {
    try {
        const [rows] = await database_1.pool.execute(`SELECT 
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
      ORDER BY si.created_at DESC`);
        return res.json({
            success: true,
            data: {
                invitations: rows
            }
        });
    }
    catch (error) {
        console.error('Error fetching invitations:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching invitations'
        });
    }
};
exports.getAllInvitations = getAllInvitations;
const getPendingInvitations = async (req, res) => {
    try {
        const [rows] = await database_1.pool.execute(`SELECT 
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
      ORDER BY si.created_at DESC`);
        return res.json({
            success: true,
            data: {
                invitations: rows
            }
        });
    }
    catch (error) {
        console.error('Error fetching pending invitations:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching pending invitations'
        });
    }
};
exports.getPendingInvitations = getPendingInvitations;
const resendInvitation = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await database_1.pool.execute('SELECT * FROM staff_invitations WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Invitation not found'
            });
        }
        const invitation = rows[0];
        if (invitation.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Cannot resend invitation. Status is ${invitation.status}`
            });
        }
        if (new Date(invitation.expires_at) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Invitation has expired'
            });
        }
        const newToken = generateInvitationToken();
        const newTemporaryPassword = generateTemporaryPassword();
        const newExpiresAt = new Date();
        newExpiresAt.setDate(newExpiresAt.getDate() + 7);
        const userId = invitation.user_id;
        if (userId) {
            const newPasswordHash = await bcryptjs_1.default.hash(newTemporaryPassword, 10);
            await database_1.pool.execute(`UPDATE users SET password_hash = ?, must_change_password = 1, updated_at = NOW() WHERE id = ?`, [newPasswordHash, userId]);
        }
        await database_1.pool.execute('UPDATE staff_invitations SET token = ?, expires_at = ? WHERE id = ?', [newToken, newExpiresAt, id]);
        const workEmail = `${invitation.first_name.toLowerCase()}.${invitation.last_name.toLowerCase()}@tripa.com.ng`;
        try {
            await (0, email_service_1.sendStaffInvitationEmail)({
                to: invitation.email,
                fullName: `${invitation.first_name} ${invitation.last_name}`,
                workEmail: workEmail,
                temporaryPassword: newTemporaryPassword,
                invitationToken: newToken,
                fromAdmin: 'HR Team'
            });
        }
        catch (emailError) {
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
    }
    catch (error) {
        console.error('Error resending invitation:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while resending invitation'
        });
    }
};
exports.resendInvitation = resendInvitation;
const cancelInvitation = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await database_1.pool.execute('UPDATE staff_invitations SET status = "cancelled" WHERE id = ? AND status = "pending"', [id]);
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
    }
    catch (error) {
        console.error('Error cancelling invitation:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while cancelling invitation'
        });
    }
};
exports.cancelInvitation = cancelInvitation;
const acceptInvitation = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        if (!password || password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters'
            });
        }
        const [rows] = await database_1.pool.execute('SELECT * FROM staff_invitations WHERE token = ?', [token]);
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Invalid invitation token'
            });
        }
        const invitation = rows[0];
        if (invitation.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Invitation has already been ${invitation.status}`
            });
        }
        if (new Date(invitation.expires_at) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Invitation has expired'
            });
        }
        const userId = invitation.user_id;
        if (!userId) {
            return res.status(500).json({
                success: false,
                message: 'Invalid invitation: no user account found'
            });
        }
        const workEmail = `${invitation.first_name.toLowerCase()}.${invitation.last_name.toLowerCase()}@tripa.com.ng`;
        const newPasswordHash = await bcryptjs_1.default.hash(password, 10);
        const connection = await database_1.pool.getConnection();
        try {
            await connection.beginTransaction();
            await connection.execute(`UPDATE users 
         SET status = 'active', password_hash = ?, must_change_password = 0, updated_at = NOW()
         WHERE id = ?`, [newPasswordHash, userId]);
            await connection.execute(`UPDATE staff SET status = 'active' WHERE user_id = ?`, [userId]);
            await connection.execute('UPDATE staff_invitations SET status = "accepted", accepted_at = NOW() WHERE id = ?', [invitation.id]);
            await connection.commit();
            return res.json({
                success: true,
                message: 'Invitation accepted successfully. You can now login with your work email.',
                data: {
                    email: workEmail
                }
            });
        }
        catch (transactionError) {
            await connection.rollback();
            throw transactionError;
        }
        finally {
            connection.release();
        }
    }
    catch (error) {
        console.error('Error accepting invitation:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while accepting invitation'
        });
    }
};
exports.acceptInvitation = acceptInvitation;
//# sourceMappingURL=staff-invitation.controller.js.map