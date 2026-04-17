import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to ensure only company domain emails can be used for login
 * (DEPRECATED: Now allowing all email domains)
 */
export const companyEmailOnly: (req: Request, res: Response, next: NextFunction) => void = (req, res, next) => {
  // Company domain restriction removed - allowing all email domains for login
  next();
};