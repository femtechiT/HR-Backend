import { pool } from '../config/database';
import { notificationService } from './notification.service';

export class RecruitmentNotificationService {
  /**
   * Send application status update notification
   */
  static async sendApplicationStatusUpdate(
    applicantEmail: string,
    applicantName: string,
    jobTitle: string,
    newStatus: string,
    additionalData: Record<string, any> = {}
  ): Promise<boolean> {
    try {
      // Determine the appropriate template based on the new status
      let templateName = '';
      let templateVariables: Record<string, any> = {
        applicant_name: applicantName,
        job_title: jobTitle,
        company_name: process.env.APP_NAME || 'Our Company',
        ...additionalData
      };

      switch (newStatus) {
        case 'shortlisted':
          templateName = 'job_application_shortlisted';
          templateVariables = {
            ...templateVariables,
            interview_date: additionalData.interview_date || 'TBD',
            interview_time: additionalData.interview_time || 'TBD',
            interview_location: additionalData.interview_location || 'TBD',
            contact_person: additionalData.contact_person || 'HR Team'
          };
          break;

        case 'rejected':
          templateName = 'job_application_rejected';
          break;

        case 'offered':
          templateName = 'job_offer';
          templateVariables = {
            ...templateVariables,
            start_date: additionalData.offer_start_date || 'TBD',
            salary: additionalData.offer_salary || 'TBD',
            employment_type: additionalData.offer_employment_type || 'TBD',
            reporting_manager: additionalData.offer_reporting_manager || 'TBD',
            acceptance_deadline: additionalData.offer_acceptance_deadline || 'TBD',
            offer_from_name: additionalData.offer_from_name || 'HR Team',
            offer_from_position: additionalData.offer_from_position || 'HR Manager'
          };
          break;

        case 'interviewed':
          templateName = 'interview_reminder'; // Could be a different template
          templateVariables = {
            ...templateVariables,
            interview_date: additionalData.interview_date || 'TBD',
            interview_time: additionalData.interview_time || 'TBD',
            interview_location: additionalData.interview_location || 'TBD',
            contact_person: additionalData.contact_person || 'HR Team'
          };
          break;

        case 'applied':
          templateName = 'job_application_confirmation';
          templateVariables = {
            ...templateVariables,
            application_reference: additionalData.application_reference || 'TBD',
            application_date: additionalData.application_date || new Date().toLocaleDateString()
          };
          break;

        default:
          // For other statuses, we might not send a notification
          console.log(`No notification template for status: ${newStatus}`);
          return true; // Consider it successful if no notification is needed
      }

      if (!templateName) {
        console.log(`No notification template defined for status: ${newStatus}`);
        return true;
      }

      // Find user ID associated with the applicant email (if they exist in the system)
      const [userRows]: any = await pool.execute(
        'SELECT id FROM users WHERE email = ?',
        [applicantEmail]
      );

      const userId = userRows.length > 0 ? userRows[0].id : 0; // Use 0 if not found

      // Queue the notification
      await notificationService.queueNotification(
        userId,
        templateName,
        templateVariables,
        {
          channel: 'email',
          priority: 'normal'
        }
      );

      return true;
    } catch (error) {
      console.error('Error sending application status update notification:', error);
      return false;
    }
  }

  /**
   * Send job posting notification to subscribers
   */
  static async sendJobPostedNotification(
    jobPostingId: number,
    jobTitle: string,
    jobLocation: string,
    closingDate: string
  ): Promise<boolean> {
    try {
      // This would typically notify users who have subscribed to job alerts
      // For now, we'll just log that this functionality exists
      console.log(`Job posted notification would be sent for job: ${jobTitle}`);
      
      // In a real implementation, we would:
      // 1. Find users who have subscribed to job alerts for this department/location
      // 2. Queue notifications for each subscriber
      // 3. Use a template like 'new_job_opening_alert'
      
      return true;
    } catch (error) {
      console.error('Error sending job posted notification:', error);
      return false;
    }
  }

  /**
   * Send interview reminder notification
   */
  static async sendInterviewReminder(
    applicantEmail: string,
    applicantName: string,
    jobTitle: string,
    interviewDate: string,
    interviewTime: string,
    interviewLocation: string
  ): Promise<boolean> {
    try {
      const [userRows]: any = await pool.execute(
        'SELECT id FROM users WHERE email = ?',
        [applicantEmail]
      );

      const userId = userRows.length > 0 ? userRows[0].id : 0;

      await notificationService.queueNotification(
        userId,
        'interview_reminder',
        {
          applicant_name: applicantName,
          job_title: jobTitle,
          interview_date: interviewDate,
          interview_time: interviewTime,
          interview_location: interviewLocation,
          contact_person: 'HR Team',
          company_name: process.env.APP_NAME || 'Our Company'
        },
        {
          channel: 'email',
          priority: 'high'
        }
      );

      return true;
    } catch (error) {
      console.error('Error sending interview reminder notification:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const recruitmentNotificationService = new RecruitmentNotificationService();