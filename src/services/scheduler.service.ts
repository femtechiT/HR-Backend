import { BirthdayNotificationWorker } from '../workers/birthday-notification.worker';

/**
 * Scheduler Service
 * Manages all scheduled tasks and workers in the system
 */

export class SchedulerService {
  private static workers: Array<{name: string, start: () => void}> = [];

  /**
   * Initialize all scheduled workers
   */
  static initializeWorkers(): void {
    console.log('Initializing scheduled workers...');

    // Add birthday notification worker
    this.workers.push({
      name: 'Birthday Notification Worker',
      start: () => BirthdayNotificationWorker.startWorker()
    });

    // Start all workers
    this.startAllWorkers();
  }

  /**
   * Start all registered workers
   */
  static startAllWorkers(): void {
    console.log(`Starting ${this.workers.length} scheduled workers...`);

    for (const worker of this.workers) {
      try {
        console.log(`Starting worker: ${worker.name}`);
        worker.start();
        console.log(`✓ Worker started successfully: ${worker.name}`);
      } catch (error) {
        console.error(`✗ Error starting worker ${worker.name}:`, error);
      }
    }

    console.log('All scheduled workers initialized');
  }

  /**
   * Get status of all workers
   */
  static getWorkerStatus(): Array<{name: string, status: string}> {
    // In a real implementation, we would track the actual status of each worker
    // For now, we'll return a simple status
    return this.workers.map(worker => ({
      name: worker.name,
      status: 'running'
    }));
  }
}