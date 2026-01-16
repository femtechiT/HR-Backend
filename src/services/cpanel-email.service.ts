import axios from 'axios';
import * as https from 'https';
import dotenv from 'dotenv';

dotenv.config();

interface CpanelResponse {
  status: number;
  data?: any;
  errors?: string[];
  metadata?: any;
}

class CpanelEmailService {
  private baseUrl: string;
  private username: string;
  private token: string;
  private domain: string;
  private quota: number;

  constructor() {
    this.baseUrl = `https://${process.env.CPANEL_HOST}:2083/execute/`;
    this.username = process.env.CPANEL_USERNAME || '';
    this.token = process.env.CPANEL_API_TOKEN || '';
    this.domain = process.env.CPANEL_DOMAIN || 'example.com'; // Use configurable domain
    this.quota = parseInt(process.env.CPANEL_EMAIL_QUOTA || '500'); // Default 500MB

    if (!this.username || !this.token) {
      throw new Error('cPanel credentials are not properly configured in environment variables');
    }
  }

  private async makeRequest(endpoint: string, params: any = {}): Promise<CpanelResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        params,
        headers: {
          'Authorization': `cpanel ${this.username}:${this.token}`
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false // Only for testing, remove in production
        })
      });

      return response.data;
    } catch (error: any) {
      console.error('cPanel API Error:', error.response?.data || error.message);
      return {
        status: 0,
        errors: [error.response?.data?.errors?.[0] || error.message || 'Unknown error']
      };
    }
  }

  /**
   * Creates a new email account in cPanel
   * @param emailPrefix - The prefix for the email (e.g., 'john.doe' for 'john.doe@tripa.com.ng')
   * @param password - The password for the email account
   * @returns Success status and email address
   */
  async createEmailAccount(emailPrefix: string, password: string): Promise<{success: boolean, email?: string, error?: string}> {
    try {
      const params = {
        email: emailPrefix,
        domain: this.domain,
        password: password,
        quota: this.quota
      };

      const response = await this.makeRequest('Email/add_pop', params);

      if (response.status === 1) {
        return {
          success: true,
          email: `${emailPrefix}@${this.domain}`
        };
      } else {
        return {
          success: false,
          error: response.errors?.[0] || 'Failed to create email account'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error creating email account'
      };
    }
  }

  /**
   * Deletes an email account from cPanel
   * @param emailPrefix - The prefix of the email to delete
   * @returns Success status
   */
  async deleteEmailAccount(emailPrefix: string): Promise<{success: boolean, error?: string}> {
    try {
      const params = {
        email: emailPrefix,
        domain: this.domain
      };

      const response = await this.makeRequest('Email/delete_pop', params);

      if (response.status === 1) {
        return { success: true };
      } else {
        return {
          success: false,
          error: response.errors?.[0] || 'Failed to delete email account'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error deleting email account'
      };
    }
  }

  /**
   * Lists all email accounts for the domain
   * @returns List of email accounts
   */
  async listEmailAccounts(): Promise<{success: boolean, emails?: string[], error?: string}> {
    try {
      const params = {
        domain: this.domain
      };

      const response = await this.makeRequest('Email/list_pops', params);

      if (response.status === 1 && response.data) {
        const emails = response.data.pops.map((pop: any) => pop.email);
        return {
          success: true,
          emails: emails
        };
      } else {
        return {
          success: false,
          error: response.errors?.[0] || 'Failed to list email accounts'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error listing email accounts'
      };
    }
  }

  /**
   * Changes the password for an existing email account
   * @param emailPrefix - The prefix of the email account
   * @param newPassword - The new password
   * @returns Success status
   */
  async changeEmailPassword(emailPrefix: string, newPassword: string): Promise<{success: boolean, error?: string}> {
    try {
      const params = {
        email: emailPrefix,
        domain: this.domain,
        password: newPassword
      };

      const response = await this.makeRequest('Email/passwd_pop', params);

      if (response.status === 1) {
        return { success: true };
      } else {
        return {
          success: false,
          error: response.errors?.[0] || 'Failed to change password'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error changing password'
      };
    }
  }
}

export default CpanelEmailService;