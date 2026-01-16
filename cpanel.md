# cPanel Integration Guide for HR Management System

## Overview
This document outlines the setup and configuration required to integrate cPanel with your HR Management System for automated email account creation and management.

## Prerequisites
- Active cPanel hosting account
- Administrative access to cPanel
- Domain name properly configured
- Resend API already configured for email delivery

## 1. API Token Generation

### Steps to Create API Token
1. Log in to your **cPanel**.
2. In the search bar, type **"API Tokens"** (usually under the **Security** section).
3. Click **+ Create**.
4. **Token Name:** Give it a name like `HR_Management_System`.
5. **Permissions:** Ensure the following privileges are checked:
   - Email → Full Access
   - Accounts → Read Access (minimum)
6. **Save the Token:** Copy the long string immediately. You will not be able to see it again once you close the window.

### Environment Variables
Store your cPanel credentials in your `.env` file:
```
CPANEL_HOST=yourdomain.com
CPANEL_USERNAME=your_cpanel_username
CPANEL_API_TOKEN=your_generated_token
CPANEL_EMAIL_QUOTA=500  # in MB, 0 for unlimited
```

## 2. Email Deliverability Configuration

### SPF Record Setup
Since you're using both cPanel for email hosting and Resend for welcome emails, you need a combined SPF record:

1. In cPanel, go to **Email Deliverability**.
2. Find your domain and click **Manage**.
3. **DKIM & SPF:** Ensure both are valid. If not, click **Install the suggested record**.
4. **Combined SPF Record:** You can only have **one** SPF record. Combine them like this:
   ```
   v=spf1 +a +mx include:emailsrvr.com include:resend.com ~all
   ```
   This tells receiving servers that both your cPanel server and Resend are authorized to send mail for your domain.

### DKIM and DMARC
- Ensure DKIM is properly configured for your domain
- Set up DMARC policy for email authentication reporting

## 3. Email Quota Management

### Setting Default Quota
1. Go to **Email Accounts** in cPanel.
2. Look for **Settings** or **Default Quota** option.
3. Set a reasonable limit (e.g., 500MB) to prevent individual accounts from consuming all disk space.
4. Note: Your application will enforce this limit programmatically as well.

## 4. Catch-All Email Configuration (Optional)

### Setup
1. Go to **Default Address** in cPanel.
2. Select **Forward to Email Address**.
3. Enter your HR/Admin email address.
4. This captures any emails sent to non-existent addresses on your domain.

## 5. Email Server Configuration

### Technical Specifications
| Protocol | Server | Port | Encryption |
|----------|--------|------|------------|
| IMAP | mail.yourdomain.com | 993 | SSL/TLS |
| POP3 | mail.yourdomain.com | 995 | SSL/TLS |
| SMTP | mail.yourdomain.com | 465 | SSL/TLS |

### Alternative Ports
- Non-SSL IMAP: 143
- Non-SSL SMTP: 587 or 25
- Note: SSL connections are strongly recommended for security

## 6. API Integration

### cPanel UAPI Endpoint
The primary endpoint for email account management is:
```
https://yourdomain.com:2083/execute/Email/add_pop
```

### Example API Call
```javascript
const createEmailAccount = async (email, password) => {
  const [username, domain] = email.split('@');
  
  const response = await fetch(`https://${process.env.CPANEL_HOST}:2083/execute/Email/add_pop`, {
    method: 'POST',
    headers: {
      'Authorization': `cpanel ${process.env.CPANEL_USERNAME}:${process.env.CPANEL_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      'email': username,
      'domain': domain,
      'password': password,
      'quota': process.env.CPANEL_EMAIL_QUOTA || 500
    })
  });
  
  return response.json();
};
```

### Common API Endpoints
- **List Email Accounts**: `/execute/Email/list_pops`
- **Add Email Account**: `/execute/Email/add_pop`
- **Delete Email Account**: `/execute/Email/delete_pop`
- **Change Password**: `/execute/Email/passwd_pop`

## 7. Testing the Setup

### Basic Connectivity Test
Use curl to verify your API token works:
```bash
curl -H "Authorization: cpanel YOUR_USERNAME:YOUR_API_TOKEN" \
"https://YOUR_DOMAIN:2083/execute/Email/list_pops?domain=yourdomain.com"
```

If this returns a JSON list of your email accounts, your cPanel is properly configured for API access.

### Node.js Test Script
```javascript
// test-cpanel-connection.js
require('dotenv').config();
const axios = require('axios');

const testConnection = async () => {
  try {
    const response = await axios.get(
      `https://${process.env.CPANEL_HOST}:2083/execute/Email/list_pops`,
      {
        params: {
          domain: process.env.CPANEL_HOST
        },
        headers: {
          'Authorization': `cpanel ${process.env.CPANEL_USERNAME}:${process.env.CPANEL_API_TOKEN}`
        },
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: false // Only for testing, remove in production
        })
      }
    );
    
    console.log('Connection successful:', response.data);
  } catch (error) {
    console.error('Connection failed:', error.response?.data || error.message);
  }
};

testConnection();
```

## 8. Security Best Practices

### Token Security
- Never commit API tokens to version control
- Rotate tokens periodically
- Use least-privilege principle for API permissions
- Monitor API usage for unusual activity

### Password Security
- Generate strong passwords (minimum 12 characters with mixed case, numbers, symbols)
- Encrypt passwords in transit and at rest
- Implement secure password reset mechanisms

## 9. Troubleshooting

### Common Issues
- **401 Unauthorized**: Check API token validity and permissions
- **403 Forbidden**: Verify API token has required permissions
- **SSL Certificate Errors**: Ensure proper certificate configuration
- **Rate Limiting**: Implement appropriate delays between API calls

### Debugging Tips
- Enable cPanel API logging for troubleshooting
- Check cPanel error logs: `/usr/local/cpanel/logs/error_log`
- Verify network connectivity to cPanel server

## 10. Maintenance

### Regular Tasks
- Monitor email storage quotas
- Review API usage statistics
- Update API tokens periodically
- Check email deliverability metrics

### Monitoring
- Set up alerts for API failures
- Monitor email bounce rates
- Track successful email account creations
- Watch for unusual API usage patterns

---

**Note**: This integration enables your HR Management System to automatically provision professional email accounts for new employees, streamlining the onboarding process while maintaining security and reliability.