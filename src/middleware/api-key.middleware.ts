import { Request, Response, NextFunction } from 'express';
import ApiKeyModel from '../models/api-key.model';

// Extend the Express Request type to include API key information
declare global {
  namespace Express {
    interface Request {
      apiKey?: any; // API key information when authenticated via API key
      apiKeyUser?: any; // User information associated with the API key
    }
  }
}

/**
 * Middleware to authenticate requests using API key
 * Checks for API key in the Authorization header as "Bearer <api_key>"
 */
export const authenticateApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;

    // Check if the header exists and starts with "Bearer "
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // If no API key provided, continue to next middleware (could be JWT auth)
      return next();
    }

    // Extract the API key from the header
    const apiKeyValue = authHeader.substring(7).trim(); // Remove "Bearer " prefix

    // Find the API key in the database
    const apiKey = await ApiKeyModel.findByKey(apiKeyValue);

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired API key'
      });
    }

    // Attach API key information to the request object
    req.apiKey = apiKey;

    // Optionally, we could also attach user information associated with the API key
    // This would require a join with the users table or a separate query
    // For now, we'll just attach the API key info

    return next();
  } catch (error) {
    console.error('API key authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during API key authentication'
    });
  }
};

/**
 * Higher-order function to create permission check middleware for API keys
 * This checks if the authenticated API key has the required permission
 */
export const checkApiKeyPermission = (requiredPermission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // If no API key was authenticated, continue (might be JWT auth)
      if (!req.apiKey) {
        return next();
      }

      // Check if the API key has the required permission
      const hasPermission = await ApiKeyModel.hasPermission(req.apiKey.id, requiredPermission);

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Insufficient permissions. API key lacks required permission: ${requiredPermission}`
        });
      }

      return next();
    } catch (error) {
      console.error('API key permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during API key permission check'
      });
    }
  };
};

/**
 * Middleware to require API key authentication (will reject requests without valid API key)
 */
export const requireApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;

    // Check if the header exists and starts with "Bearer "
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'API key is required. Use Authorization: Bearer <api_key>'
      });
    }

    // Extract the API key from the header
    const apiKeyValue = authHeader.substring(7).trim(); // Remove "Bearer " prefix

    // Find the API key in the database
    const apiKey = await ApiKeyModel.findByKey(apiKeyValue);

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired API key'
      });
    }

    // Attach API key information to the request object
    req.apiKey = apiKey;

    return next();
  } catch (error) {
    console.error('Required API key authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during API key authentication'
    });
  }
};