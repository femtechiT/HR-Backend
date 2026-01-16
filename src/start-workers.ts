import { LeaveExpiryWorker } from './workers/leave-expiry.worker';
import { NotificationDispatcherWorker } from './workers/notification-dispatcher.worker';

console.log('Starting background workers...');

// Start the leave expiry worker (runs daily)
// Using a shorter interval for development/testing purposes
LeaveExpiryWorker.startWorker(parseInt(process.env.LEAVE_EXPIRY_WORKER_INTERVAL || '1440')); // 1440 minutes = 24 hours

// Start the notification dispatcher worker (runs every 5 minutes by default)
NotificationDispatcherWorker.startWorker(parseInt(process.env.NOTIFICATION_DISPATCH_INTERVAL || '300')); // 300 seconds = 5 minutes

console.log('Background workers started successfully');