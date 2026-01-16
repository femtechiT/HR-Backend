import UserModel, { UserInput } from '../models/user.model';
import CpanelEmailService from './cpanel-email.service';
import EmailService from './email.service';
import crypto from 'crypto';

interface NewStaffDetails {
  firstName: string;
  lastName: string;
  personalEmail: string;  // The personal email to send the welcome message to
  roleId: number;
  branchId?: number;
}

interface InvitationResult {
  success: boolean;
  workEmail?: string;
  error?: string;
}

class StaffInvitationService {
  private cpanelService: CpanelEmailService;

  constructor() {
    this.cpanelService = new CpanelEmailService();
  }

  /**
   * Generates a strong random password
   * @returns A strong password with mixed case, numbers, and symbols
   */
  private generateStrongPassword(): string {
    // Create a base string with guaranteed character types
    const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowerCase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    // Ensure at least one character from each category
    let password = '';
    password += upperCase[Math.floor(Math.random() * upperCase.length)];
    password += lowerCase[Math.floor(Math.random() * lowerCase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly
    const allChars = upperCase + lowerCase + numbers + symbols;
    for (let i = 4; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password to randomize positions
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  }

  /**
   * Creates a work email in cPanel and sends invitation to personal email
   * @param staffDetails Details of the new staff member
   * @returns Result of the invitation process
   */
  async inviteNewStaff(staffDetails: NewStaffDetails): Promise<InvitationResult> {
    try {
      // Generate email prefix and password
      const emailPrefix = `${staffDetails.firstName.toLowerCase()}.${staffDetails.lastName.toLowerCase()}`;
      const tempPassword = this.generateStrongPassword();
      
      // Create email account in cPanel
      const emailCreationResult = await this.cpanelService.createEmailAccount(emailPrefix, tempPassword);
      
      if (!emailCreationResult.success) {
        console.error('Failed to create email account in cPanel:', emailCreationResult.error);
        return {
          success: false,
          error: `Failed to create work email: ${emailCreationResult.error}`
        };
      }
      
      const workEmail = emailCreationResult.email!;
      
      // Create user in our database
      const userInput: UserInput = {
        email: workEmail,
        password: tempPassword,
        full_name: `${staffDetails.firstName} ${staffDetails.lastName}`,
        role_id: staffDetails.roleId,
        branch_id: staffDetails.branchId || null,  // Handle potential undefined value
        must_change_password: true  // Force password change on first login
      };
      
      const user = await UserModel.create(userInput);
      
      // Send welcome email to personal email with work credentials
      const emailResult = await this.sendWelcomeEmail(
        staffDetails.personalEmail,
        workEmail,
        tempPassword,
        staffDetails.firstName
      );
      
      if (!emailResult.success) {
        console.warn('Failed to send welcome email, but user and email account were created:', emailResult.error);
      }
      
      return {
        success: true,
        workEmail: workEmail
      };
    } catch (error: any) {
      console.error('Error in inviteNewStaff:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred during staff invitation'
      };
    }
  }

  /**
   * Sends a welcome email to the new staff member with their work credentials
   * @param personalEmail The personal email to send the welcome message to
   * @param workEmail The work email that was created
   * @param password The temporary password
   * @param firstName The first name of the staff member
   * @returns Result of the email sending process
   */
  private async sendWelcomeEmail(
    personalEmail: string,
    workEmail: string,
    password: string,
    firstName: string
  ): Promise<{success: boolean, error?: string}> {
    try {
      const companyDomain = process.env.CPANEL_DOMAIN || 'example.com';
      const subject = `Welcome to ${companyDomain}, ${firstName}! Your Work Account is Ready`;
      const html = `
        <h2>Welcome to ${companyDomain}, ${firstName}!</h2>
        <p>We're excited to have you join our team.</p>
        
        <h3>Your Work Account Details:</h3>
        <p><strong>Email:</strong> ${workEmail}</p>
        <p><strong>Password:</strong> ${password}</p>
        
        <p><strong>Important:</strong> Please change your password after your first login.</p>
        
        <h3>Getting Started:</h3>
        <ol>
          <li>Download our company app from the Play Store</li>
          <li>Log in using the credentials above</li>
          <li>Change your password immediately</li>
        </ol>
        
        <p>If you have any questions, please reach out to HR.</p>
        
        <p>Welcome aboard!</p>
      `;

      const result = await EmailService.sendEmail({
        to: personalEmail,
        subject,
        html
      });

      if (result.success) {
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      console.error('Error sending welcome email:', error);
      return { success: false, error: error.message || 'Failed to send welcome email' };
    }
  }

  /**
   * Deactivates a staff member's account and optionally removes their email from cPanel
   * @param userId The ID of the user to deactivate
   * @param removeEmail Whether to also remove the email account from cPanel
   * @returns Result of the deactivation process
   */
  async deactivateStaff(userId: number, removeEmail: boolean = false): Promise<{success: boolean, error?: string}> {
    try {
      // Update user status to terminated in our database
      const updatedUser = await UserModel.update(userId, { status: 'terminated' });
      
      if (!updatedUser) {
        return { success: false, error: 'User not found' };
      }
      
      // Optionally remove email from cPanel
      if (removeEmail) {
        // Extract email prefix from the user's email
        const emailParts = updatedUser.email.split('@');
        if (emailParts.length === 2) {
          const domain = emailParts[1];
          const companyDomain = process.env.CPANEL_DOMAIN || 'example.com';
          
          // Only remove if it belongs to our domain
          if (domain === companyDomain) {
            const emailPrefix = emailParts[0];
            const deletionResult = await this.cpanelService.deleteEmailAccount(emailPrefix);
            
            if (!deletionResult.success) {
              console.error('Failed to delete email account from cPanel:', deletionResult.error);
              // Don't fail the entire operation if email deletion fails
            }
          }
        }
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Error deactivating staff:', error);
      return { success: false, error: error.message || 'An unexpected error occurred during staff deactivation' };
    }
  }
}

export default StaffInvitationService;