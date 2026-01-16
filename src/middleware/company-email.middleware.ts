import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to ensure only company domain emails can be used for login
 * This enforces that only emails ending with the configured company domain can be used
 */
export const companyEmailOnly: (req: Request, res: Response, next: NextFunction) => void = (req, res, next) => {
  // For login endpoint specifically
  if (req.path === '/api/auth/login' && req.method === 'POST') {
    const { email } = req.body;

    if (email && typeof email === 'string') {
      // Check if email ends with the company domain
      const companyDomain = process.env.CPANEL_DOMAIN || 'example.com';
      const fullCompanyDomain = `@${companyDomain}`;

      if (!email.toLowerCase().endsWith(fullCompanyDomain)) {
        res.status(400).json({
          success: false,
          message: `Only @${companyDomain} email addresses are allowed for login`
        });
        return; // Explicitly return to satisfy TypeScript
      }
    }
  }

  next();
};