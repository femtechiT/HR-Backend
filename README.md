# HR Management System

A comprehensive HR management system for companies with 200+ employees, featuring multi-branch operations, dynamic attendance tracking, leave management, payroll processing, and performance evaluation.

## Features

- **Multi-Branch Management**: Operate multiple branches with isolated data and configurations
- **Dynamic Attendance Tracking**: GPS-verified clock-in/out with flexible late/early policies
- **Leave Management**: Configurable leave types with automated approval workflows
- **Payroll Processing**: Automated salary calculations with dynamic components
- **Intelligent Appraisal System**: Comprehensive KPI-based appraisal system with automated calculations from existing data sources
- **Batch Assignment**: Assign KPIs and targets to multiple employees simultaneously
- **Self-Assessment Workflow**: Employees can evaluate themselves with manager review
- **Document Management**: Secure storage of employee documents with expiry alerts
- **Notifications**: Email and push notifications for important events

## Tech Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: MySQL
- **Authentication**: JWT with refresh tokens
- **Email Service**: Resend
- **File Uploads**: Multer

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd hr-management-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run the application:
```bash
npm run dev
```

## Environment Variables

- `DB_HOST`: Database host (default: localhost)
- `DB_PORT`: Database port (default: 3306)
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name
- `JWT_SECRET`: Secret key for JWT tokens
- `JWT_REFRESH_SECRET`: Secret key for refresh tokens
- `RESEND_API_KEY`: API key for Resend email service
- `EMAIL_FROM`: Email address to send emails from
- `PORT`: Port to run the server on (default: 3000)
- `NODE_ENV`: Environment (development/production)

## Scripts

- `npm run dev`: Start the development server with hot reload
- `npm run build`: Compile TypeScript to JavaScript
- `npm start`: Start the production server
- `npm run test`: Run tests
- `npm run lint`: Check code for linting errors
- `npm run lint:fix`: Fix linting errors automatically
- `npm run format`: Format code with Prettier

## Folder Structure

```
src/
├── api/              # API routes
├── workers/          # Background job processors
├── services/         # Business logic services
├── models/           # Database models
├── middleware/       # Express middleware
├── utils/            # Utility functions
├── config/           # Configuration files
├── index.ts          # Entry point
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.