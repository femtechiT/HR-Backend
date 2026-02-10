import { LeaveExpiryWorker } from './workers/leave-expiry.worker';
import { NotificationDispatcherWorker } from './workers/notification-dispatcher.worker';
import AttendanceProcessorWorker from './workers/attendance-processor.worker';

console.log('Starting background workers...');

// Start the leave expiry worker (runs daily)
// Using a shorter interval for development/testing purposes
LeaveExpiryWorker.startWorker(parseInt(process.env.LEAVE_EXPIRY_WORKER_INTERVAL || '1440')); // 1440 minutes = 24 hours

// Start the notification dispatcher worker (runs every 5 minutes by default)
NotificationDispatcherWorker.startWorker(parseInt(process.env.NOTIFICATION_DISPATCH_INTERVAL || '300')); // 300 seconds = 5 minutes

// Start the attendance processor worker (runs daily to process attendance for the previous day)
AttendanceProcessorWorker.start().catch(error => {
  console.error('Error starting attendance processor worker:', error);
});

console.log('Background workers started successfully');