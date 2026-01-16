import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface WelcomeEmailProps {
  to: string;
  fullName: string;
}

export const sendWelcomeEmail = async ({ to, fullName }: WelcomeEmailProps): Promise<void> => {
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
  } catch (error) {
    console.error('Unexpected error sending welcome email:', error);
    throw error;
  }
};

interface StaffInvitationEmailProps {
  to: string;
  fullName: string;
  workEmail: string;
  temporaryPassword: string;
  fromAdmin: string;
}

export const sendStaffInvitationEmail = async ({
  to,
  fullName,
  workEmail,
  temporaryPassword,
  fromAdmin
}: StaffInvitationEmailProps): Promise<void> => {
  try {
    const { error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'invitations@tripa.com.ng',
      to: to,
      subject: 'Welcome to Tripa! Your New Work Account Awaits',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2c3e50;">Welcome to Tripa, ${fullName}!</h1>

          <p>You've been invited by ${fromAdmin} to join Tripa HR Management System.</p>

          <h2 style="color: #3498db;">Your New Work Identity:</h2>
          <p><strong>Email:</strong> ${workEmail}</p>
          <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>

          <p>Please download our mobile application and log in with these credentials. On your first login, you will be required to set a new password for security.</p>

          <p>Once logged in, you'll be able to access your dashboard, track your KPIs, request time off, and more.</p>

          <p>If you have any questions, please contact your administrator.</p>

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
  } catch (error) {
    console.error('Unexpected error sending staff invitation email:', error);
    throw error;
  }
};

interface PayrollReadyEmailProps {
  to: string;
  month: string;
  year: number;
}

export const sendPayrollReady = async ({ to, month, year }: PayrollReadyEmailProps): Promise<{success: boolean, error?: string}> => {
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
  } catch (error) {
    console.error('Unexpected error sending payroll ready email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};