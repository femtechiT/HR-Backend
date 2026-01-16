import axios from 'axios';

// Test the staff invitation endpoint
const testStaffInvitation = async () => {
  try {
    // First, we need to authenticate as an admin to get a token
    // For this test, I'll assume we have an admin account
    console.log('Attempting to invite a new staff member...');
    
    // Login as admin first to get token
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@company.com',  // Default admin email from seed
      password: 'admin123'         // Default admin password from seed
    });
    
    console.log('Login response:', loginResponse.data);
    
    if (!loginResponse.data.success) {
      console.error('Login failed:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.data.tokens.accessToken;
    console.log('Access token received');
    
    // Now invite a new staff member
    const inviteResponse = await axios.post('http://localhost:3000/api/staff-invitation/invite', {
      firstName: 'Oluwarotimi',
      lastName: 'Adewumi',
      personalEmail: 'oluwarotimiadewumi@gmail.com',
      roleId: 1,  // Assuming role ID 1 is admin or basic user
      branchId: 1 // Assuming branch ID 1 exists
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Invite response:', inviteResponse.data);
    
  } catch (error) {
    if (error.response) {
      console.error('Error response:', error.response.data);
      console.error('Status:', error.response.status);
    } else {
      console.error('General error:', error.message);
    }
  }
};

testStaffInvitation();