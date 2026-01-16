import { notificationService } from '../services/notification.service';

/**
 * Notification Dispatcher Worker
 * This worker runs at regular intervals to process pending notifications in the queue
 */

export class NotificationDispatcherWorker {
  private static isRunning = false;

  /**
   * Process pending notifications in the queue
   */
  static async processNotificationQueue(): Promise<void> {
    if (this.isRunning) {
      console.log('Notification dispatcher is already running, skipping this cycle');
      return;
    }

    this.isRunning = true;
    console.log('Starting notification queue processing...');

    try {
      // Process up to 50 notifications per cycle
      const processedCount = await notificationService.processNotificationQueue(50);
      
      console.log(`Notification queue processing completed. Processed ${processedCount} notifications`);
    } catch (error) {
      console.error('Error in notification dispatcher worker:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Start the worker interval
   */
  static startWorker(intervalSeconds: number = 300): void { // Default to every 5 minutes
    console.log(`Starting notification dispatcher worker with ${intervalSeconds}-second intervals...`);
    
    // Run immediately on startup
    this.processNotificationQueue().catch(error => {
      console.error('Error running notification dispatcher on startup:', error);
    });
    
    // Then run at specified intervals
    setInterval(() => {
      this.processNotificationQueue().catch(error => {
        console.error('Error running notification dispatcher:', error);
      });
    }, intervalSeconds * 1000); // Convert seconds to milliseconds
  }
}

// If this file is run directly, start the worker
if (require.main === module) {
  // Use environment variable or default to 300 seconds (5 minutes)
  const intervalSeconds = parseInt(process.env.NOTIFICATION_DISPATCH_INTERVAL || '300');
  NotificationDispatcherWorker.startWorker(intervalSeconds);
}