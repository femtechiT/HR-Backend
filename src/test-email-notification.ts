import EmailService from './services/email.service';

async function testEmailFunctionality() {
  console.log('Testing email functionality...');

  try {
    // Test the sendPayrollReady function
    const result = await EmailService.sendPayrollReady(
      'oluwarotimiadewumi@gmail.com',
      'January',
      2026
    );

    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log('Response:', result);
    } else {
      console.log('❌ Failed to send email:');
      console.log('Error:', result.error);
    }
  } catch (error) {
    console.error('❌ Error calling email service:', error);
  }
}

// Run the test
testEmailFunctionality();