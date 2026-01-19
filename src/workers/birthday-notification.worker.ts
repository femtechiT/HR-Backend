import { pool } from '../config/database';
import { NotificationService } from '../services/notification.service';

/**
 * Birthday Notification Worker
 * This worker runs daily to check for upcoming birthdays and send notifications to HR
 */

export class BirthdayNotificationWorker {
  /**
   * Process birthday notifications
   * This method checks for birthdays happening tomorrow and sends notifications to HR personnel
   */
  static async processBirthdayNotifications(): Promise<void> {
    console.log('Starting birthday notification processing...');

    try {
      // Get the date for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Format the date to extract month and day (ignoring the year)
      const month = String(tomorrow.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
      const day = String(tomorrow.getDate()).padStart(2, '0');

      // Query to find employees with birthdays tomorrow
      const query = `
        SELECT
          s.id as staff_id,
          s.employee_id,
          u.full_name,
          u.email,
          s.designation,
          s.department as department_name,
          b.name as branch_name,
          u.date_of_birth
        FROM staff s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN branches b ON s.branch_id = b.id
        WHERE
          DATE_FORMAT(u.date_of_birth, '%m-%d') = ?
          AND s.status = 'active'
      `;

      const [birthdayEmployees]: any = await pool.execute(query, [`${month}-${day}`]);

      console.log(`Found ${birthdayEmployees.length} employees with birthdays tomorrow`);

      if (birthdayEmployees.length > 0) {
        // Get HR personnel to notify
        const [hrPersonnel]: any = await pool.execute(
          `SELECT u.id, u.full_name, u.email
           FROM users u
           JOIN user_roles ur ON u.id = ur.user_id
           JOIN roles r ON ur.role_id = r.id
           WHERE r.name IN ('HR Manager', 'HR Administrator', 'Administrator', 'Super Admin')
             AND u.status = 'active'`
        );

        console.log(`Found ${hrPersonnel.length} HR personnel to notify`);

        // Send birthday notifications to HR personnel
        for (const hr of hrPersonnel) {
          for (const employee of birthdayEmployees) {
            try {
              // Queue birthday notification
              const { NotificationService } = await import('../services/notification.service');
              const notificationService = new NotificationService();
              await notificationService.queueNotification(
                hr.id,  // HR personnel receives the notification
                'birthday_reminder',  // Template name
                {
                  employee_name: employee.full_name,
                  employee_id: employee.employee_id,
                  designation: employee.designation,
                  department: employee.department_name || 'N/A',
                  branch: employee.branch_name || 'N/A',
                  date_of_birth: employee.date_of_birth ? new Date(employee.date_of_birth).toLocaleDateString() : 'N/A',
                  company_name: (process.env.COMPANY_NAME && process.env.COMPANY_NAME !== 'undefined') ? process.env.COMPANY_NAME : 'Our Company',
                  tomorrow_date: tomorrow.toLocaleDateString()
                },
                {
                  channel: 'email',
                  priority: 'normal'
                }
              );

              console.log(`Birthday notification queued for HR: ${hr.full_name}, Employee: ${employee.full_name}`);
            } catch (notificationError) {
              console.error(`Error queuing birthday notification for ${employee.full_name} to ${hr.full_name}:`, notificationError);
            }
          }
        }

        // Also send a consolidated notification with all birthdays
        if (hrPersonnel.length > 0) {
          const birthdayList = birthdayEmployees.map((emp: any) => ({
            name: emp.full_name,
            id: emp.employee_id,
            designation: emp.designation,
            department: emp.department_name || 'N/A'
          }));

          for (const hr of hrPersonnel) {
            try {
              const { NotificationService } = await import('../services/notification.service');
              const notificationService = new NotificationService();
              await notificationService.queueNotification(
                hr.id,
                'birthday_summary',
                {
                  birthday_list: birthdayList,
                  date: tomorrow.toLocaleDateString(),
                  company_name: (process.env.COMPANY_NAME && process.env.COMPANY_NAME !== 'undefined') ? process.env.COMPANY_NAME : 'Our Company'
                },
                {
                  channel: 'email',
                  priority: 'normal'
                }
              );

              console.log(`Birthday summary notification queued for HR: ${hr.full_name}`);
            } catch (summaryError) {
              console.error(`Error queuing birthday summary notification for ${hr.full_name}:`, summaryError);
            }
          }
        }
      } else {
        console.log('No birthdays found for tomorrow');
      }

      console.log('Birthday notification processing completed successfully');
    } catch (error) {
      console.error('Error in birthday notification worker:', error);
      throw error;
    }
  }

  /**
   * Start the birthday notification worker
   * This runs daily at a specified time (default 6:00 AM)
   */
  static startWorker(): void {
    console.log('Starting birthday notification worker...');

    // Run immediately on startup to catch any missed notifications
    this.processBirthdayNotifications().catch(error => {
      console.error('Error running birthday notification worker on startup:', error);
    });

    // Then run every 24 hours
    setInterval(() => {
      this.processBirthdayNotifications().catch(error => {
        console.error('Error running birthday notification worker:', error);
      });
    }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
  }
}

// If this file is run directly, start the worker
// Using a more reliable approach for ES modules
if (typeof require !== 'undefined' && require.main === module) {
  // CommonJS context
  BirthdayNotificationWorker.startWorker();
} else if (import.meta.url && process.argv[1]) {
  // ES module context - check if this file is the main module
  import('url').then(urlModule => {
    const __filename = urlModule.fileURLToPath(import.meta.url);
    if (process.argv[1] && __filename) {
      const filenameParts = __filename.split('/');
      const filename = filenameParts[filenameParts.length - 1];
      if (process.argv[1].endsWith(filename)) {
        BirthdayNotificationWorker.startWorker();
      }
    }
  }).catch(err => {
    console.error('Error importing URL module:', err);
  });
}