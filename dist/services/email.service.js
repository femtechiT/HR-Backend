"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPayrollReady = exports.sendStaffInvitationEmail = exports.sendWelcomeEmail = void 0;
const resend_1 = require("resend");
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
const sendWelcomeEmail = async ({ to, fullName }) => {
    try {
        const { error } = await resend.emails.send({
            from: process.env.FROM_EMAIL || 'onboarding@tripa.com.ng',
            to: to,
            subject: 'Welcome to Tripa HR Management System!',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2c3e50;">Welcome, ${fullName}!</h1>

          <p>Congratulations on initializing your Tripa HR Management System. You've successfully set up your Super Admin account.</p>

          <h2 style="color: #3498db;">Getting Started:</h2>
          <ol>
            <li><strong>Build Your Organization:</strong> Create departments and branches that match your company structure.</li>
            <li><strong>Set Up Roles:</strong> Define custom roles with specific permissions for your team.</li>
            <li><strong>Invite Team Members:</strong> Use our automated invitation system to provision professional email addresses for your staff.</li>
          </ol>

          <h2 style="color: #3498db;">Security Tips:</h2>
          <ul>
            <li>Keep your login credentials secure</li>
            <li>Regularly review user permissions</li>
            <li>Enable two-factor authentication when available</li>
          </ul>

          <p>If you have any questions or need assistance, please reach out to our support team.</p>

          <p>Best regards,<br/>
          The Tripa HR Management Team</p>

          <hr style="margin-top: 30px; border: none; height: 1px; background-color: #ecf0f1;" />
          <p style="font-size: 12px; color: #7f8c8d;">
            This email was sent to ${to} because you registered as a Super Admin for Tripa HR Management System.
          </p>
        </div>
      `
        });
        if (error) {
            console.error('Error sending welcome email:', error);
            throw new Error(`Failed to send welcome email: ${error.message}`);
        }
        console.log(`Welcome email sent successfully to ${to}`);
    }
    catch (error) {
        console.error('Unexpected error sending welcome email:', error);
        throw error;
    }
};
exports.sendWelcomeEmail = sendWelcomeEmail;
const sendStaffInvitationEmail = async ({ to, fullName, workEmail, temporaryPassword, invitationToken, fromAdmin }) => {
    try {
        const { error } = await resend.emails.send({
            from: process.env.FROM_EMAIL || 'invitations@tripa.com.ng',
            to: to,
            subject: 'Welcome to Tripa! Your Work Account Credentials',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2c3e50;">Welcome to Tripa, ${fullName}!</h1>

          <p>You've been invited by ${fromAdmin} to join Tripa HR Management System.</p>

          <h2 style="color: #3498db;">Your Work Account Credentials:</h2>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #3498db; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Work Email:</strong> <span style="color: #2c3e50; font-family: monospace; font-size: 14px;">${workEmail}</span></p>
            <p style="margin: 10px 0;"><strong>Temporary Password:</strong> <span style="color: #2c3e50; font-family: monospace; font-size: 14px;">${temporaryPassword}</span></p>
          </div>

          <h2 style="color: #3498db; margin-top: 30px;">Access Your Account:</h2>
          
          <p style="margin: 20px 0;">You can access your account through our Staff Portal:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="https://fempwa.vercel.app"
               style="background-color: #27ae60; color: white; padding: 14px 35px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Open Staff Portal
            </a>
          </p>

          <p style="margin: 20px 0;"><strong>Important Security Notes:</strong></p>
          <ul style="line-height: 1.8;">
            <li>Please change your temporary password immediately after logging in</li>
            <li>Keep your work email and password secure</li>
            <li>Do not share your credentials with anyone</li>
            <li>This temporary password will expire after first use</li>
          </ul>

          <p style="margin: 20px 0;"><strong>Need Help?</strong></p>
          <p>If you have any questions or need assistance, please contact your administrator.</p>

          <p>Welcome aboard!<br/>
          The Tripa HR Management Team</p>

          <hr style="margin-top: 30px; border: none; height: 1px; background-color: #ecf0f1;" />
          <p style="font-size: 12px; color: #7f8c8d;">
            This email was sent to ${to} because ${fromAdmin} invited you to join Tripa HR Management System.
          </p>
        </div>
      `
        });
        if (error) {
            console.error('Error sending staff invitation email:', error);
            throw new Error(`Failed to send staff invitation email: ${error.message}`);
        }
        console.log(`Staff invitation email sent successfully to ${to}`);
    }
    catch (error) {
        console.error('Unexpected error sending staff invitation email:', error);
        throw error;
    }
};
exports.sendStaffInvitationEmail = sendStaffInvitationEmail;
const sendPayrollReady = async ({ to, month, year }) => {
    try {
        const { error } = await resend.emails.send({
            from: process.env.FROM_EMAIL || 'payroll@tripa.com.ng',
            to: to,
            subject: `Your ${month} ${year} Payslip is Ready`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2c3e50;">Your Payslip is Ready</h1>

          <p>Hello,</p>

          <p>Your payslip for ${month} ${year} is now available in the system.</p>

          <p>Please log in to the HR Management System to view and download your payslip.</p>

          <p>If you have any questions about your payslip, please contact your HR department.</p>

          <p>Best regards,<br/>
          The Tripa HR Management Team</p>

          <hr style="margin-top: 30px; border: none; height: 1px; background-color: #ecf0f1;" />
          <p style="font-size: 12px; color: #7f8c8d;">
            This email was sent to ${to} because your ${month} ${year} payslip is ready for viewing.
          </p>
        </div>
      `
        });
        if (error) {
            console.error('Error sending payroll ready email:', error);
            return { success: false, error: error.message };
        }
        console.log(`Payroll ready email sent successfully to ${to}`);
        return { success: true };
    }
    catch (error) {
        console.error('Unexpected error sending payroll ready email:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
};
exports.sendPayrollReady = sendPayrollReady;
//# sourceMappingURL=email.service.js.map