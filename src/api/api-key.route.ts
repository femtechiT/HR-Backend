import { Router, Request, Response } from 'express';
import { authenticateJWT, checkPermission } from '../middleware/auth.middleware';
import { authenticateApiKey, checkApiKeyPermission, requireApiKey } from '../middleware/api-key.middleware';
import ApiKeyModel from '../models/api-key.model';
import UserModel from '../models/user.model';

const router = Router();

/**
 * GET /api/api-keys - Get all API keys for the authenticated user
 */
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const userId = req.currentUser?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const apiKeys = await ApiKeyModel.findByUser(userId);

    return res.json({
      success: true,
      message: 'API keys retrieved successfully',
      data: { apiKeys }
    });
  } catch (error) {
    console.error('Get API keys error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/api-keys - Create a new API key
 */
router.post('/', authenticateJWT, checkPermission('api_key:create'), async (req: Request, res: Response) => {
  try {
    const { name, permissions, expires_at } = req.body;
    const userId = req.currentUser?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Validate required fields
    if (!name || !permissions) {
      return res.status(400).json({
        success: false,
        message: 'Name and permissions are required'
      });
    }

    // Validate permissions format
    if (!Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: 'Permissions must be an array of strings'
      });
    }

    // Create the API key
    const { apiKey, plainTextKey } = await ApiKeyModel.create({
      name,
      user_id: userId,
      permissions,
      expires_at: expires_at ? new Date(expires_at) : null
    });

    // Return the API key (include plain text key only on creation)
    return res.status(201).json({
      success: true,
      message: 'API key created successfully',
      data: {
        apiKey: {
          id: apiKey.id,
          name: apiKey.name,
          user_id: apiKey.user_id,
          permissions: apiKey.permissions,
          is_active: apiKey.is_active,
          expires_at: apiKey.expires_at,
          created_at: apiKey.created_at
        },
        plainTextKey // Important: Only return this on creation
      }
    });
  } catch (error) {
    console.error('Create API key error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * PUT /api/api-keys/:id - Update an API key
 */
router.put('/:id', authenticateJWT, checkPermission('api_key:update'), async (req: Request, res: Response) => {
  try {
    const apiKeyId = parseInt(req.params.id as string);
    const { name, permissions, is_active, expires_at } = req.body;
    const userId = req.currentUser?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (isNaN(apiKeyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid API key ID'
      });
    }

    // Check if the API key belongs to the current user
    const existingKey = await ApiKeyModel.findById(apiKeyId);
    if (!existingKey || existingKey.user_id !== userId) {
      return res.status(404).json({
        success: false,
        message: 'API key not found or does not belong to current user'
      });
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (expires_at !== undefined) updateData.expires_at = expires_at;

    const updatedApiKey = await ApiKeyModel.update(apiKeyId, updateData);

    if (!updatedApiKey) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    return res.json({
      success: true,
      message: 'API key updated successfully',
      data: { apiKey: updatedApiKey }
    });
  } catch (error) {
    console.error('Update API key error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/api-keys/:id - Delete (deactivate) an API key
 */
router.delete('/:id', authenticateJWT, checkPermission('api_key:delete'), async (req: Request, res: Response) => {
  try {
    const apiKeyId = parseInt(req.params.id as string);
    const userId = req.currentUser?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (isNaN(apiKeyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid API key ID'
      });
    }

    // Check if the API key belongs to the current user
    const existingKey = await ApiKeyModel.findById(apiKeyId);
    if (!existingKey || existingKey.user_id !== userId) {
      return res.status(404).json({
        success: false,
        message: 'API key not found or does not belong to current user'
      });
    }

    const success = await ApiKeyModel.delete(apiKeyId);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'API key not found'
      });
    }

    return res.json({
      success: true,
      message: 'API key deactivated successfully'
    });
  } catch (error) {
    console.error('Delete API key error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;