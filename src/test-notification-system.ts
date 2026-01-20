import { notificationService } from './services/notification.service';

async function testNotificationSystem() {
  console.log('Testing notification system...');

  try {
    // Test queuing a notification
    console.log('Attempting to queue a test notification...');
    
    // Using a placeholder user ID - in a real scenario, you'd use an actual user ID
    const userId = 1; // Assuming admin user
    
    const result = await notificationService.queueNotification(
      userId,
      'welcome_email',  // Using an existing template
      {
        staff_name: 'Test User',
        company_name: 'Tripa HR System',
        work_email: 'test@example.com'
      }
    );

    console.log('✅ Notification queued successfully!');
    console.log('Result:', result);

    // Test processing the notification queue
    console.log('\nProcessing notification queue...');
    const processed = await notificationService.processNotificationQueue(10);
    console.log(`✅ Processed ${processed} notifications from queue`);
    
  } catch (error) {
    console.error('❌ Error testing notification system:', error);
  }
}

// Run the test
testNotificationSystem();