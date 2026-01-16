import { Request, Response } from 'express';
import { pool } from '../config/database';
import { notificationService } from '../services/notification.service';

/**
 * Get user's notifications
 */
export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).currentUser.id;
    const { page = 1, limit = 10, type, status } = req.query;

    // Build query with filters
    let query = `
      SELECT nl.*, u.full_name as recipient_name
      FROM notification_logs nl
      LEFT JOIN users u ON nl.recipient_user_id = u.id
      WHERE nl.recipient_user_id = ?
    `;
    const params: any[] = [userId];

    if (type) {
      query += ' AND nl.notification_type = ?';
      params.push(type);
    }

    if (status) {
      query += ' AND nl.delivery_status = ?';
      params.push(status);
    }

    query += ' ORDER BY nl.created_at DESC';

    // Add pagination
    const offset = (Number(page) - 1) * Number(limit);
    query += ' LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const [rows]: any = await pool.execute(query, params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM notification_logs nl
      WHERE nl.recipient_user_id = ?
    `;
    const countParams = [userId];

    if (type) {
      countQuery += ' AND nl.notification_type = ?';
      countParams.push(type);
    }

    if (status) {
      countQuery += ' AND nl.delivery_status = ?';
      countParams.push(status);
    }

    const [countRows]: any = await pool.execute(countQuery, countParams);

    return res.json({
      success: true,
      data: {
        notifications: rows,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(countRows[0].total / Number(limit)),
          totalItems: countRows[0].total,
          itemsPerPage: Number(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching notifications'
    });
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).currentUser.id;
    const { id } = req.params;

    // Update the notification log to mark as opened
    const [result]: any = await pool.execute(
      'UPDATE notification_logs SET opened_at = NOW() WHERE id = ? AND recipient_user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or does not belong to user'
      });
    }

    return res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while marking notification as read'
    });
  }
};

/**
 * Get user's notification preferences
 */
export const getNotificationPreferences = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).currentUser.id;

    const [rows]: any = await pool.execute(
      'SELECT * FROM user_notification_preferences WHERE user_id = ?',
      [userId]
    );

    return res.json({
      success: true,
      data: {
        preferences: rows
      }
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching notification preferences'
    });
  }
};

/**
 * Update user's notification preferences
 */
export const updateUserNotificationPreferences = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).currentUser.id;
    const { notificationType, channels, enabled } = req.body;

    if (!notificationType || !Array.isArray(channels)) {
      return res.status(400).json({
        success: false,
        message: 'Notification type and channels array are required'
      });
    }

    // Validate channels
    const validChannels = ['email', 'push', 'in_app', 'sms'];
    const invalidChannels = channels.filter((ch: string) => !validChannels.includes(ch));
    
    if (invalidChannels.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid channels: ${invalidChannels.join(', ')}. Valid channels are: ${validChannels.join(', ')}`
      });
    }

    // Update or insert the preference
    const [result]: any = await pool.execute(`
      INSERT INTO user_notification_preferences 
      (user_id, notification_type, channels, enabled) 
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      channels = VALUES(channels),
      enabled = VALUES(enabled),
      updated_at = NOW()
    `, [userId, notificationType, JSON.stringify(channels), enabled !== undefined ? enabled : true]);

    return res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: {
        userId,
        notificationType,
        channels,
        enabled: enabled !== undefined ? enabled : true
      }
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while updating notification preferences'
    });
  }
};

/**
 * Register device for push notifications
 */
export const registerDevice = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).currentUser.id;
    const { deviceToken, deviceType, platform, appVersion, osVersion } = req.body;

    if (!deviceToken || !platform) {
      return res.status(400).json({
        success: false,
        message: 'Device token and platform are required'
      });
    }

    // Validate platform
    const validPlatforms = ['ios', 'android', 'web'];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({
        success: false,
        message: `Invalid platform: ${platform}. Valid platforms are: ${validPlatforms.join(', ')}`
      });
    }

    // Validate device type
    const validDeviceTypes = ['mobile', 'tablet', 'desktop'];
    if (deviceType && !validDeviceTypes.includes(deviceType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid device type: ${deviceType}. Valid types are: ${validDeviceTypes.join(', ')}`
      });
    }

    // Register the device
    const success = await notificationService.registerDevice(
      userId,
      deviceToken,
      deviceType || 'mobile',
      platform,
      appVersion,
      osVersion
    );

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to register device'
      });
    }

    return res.json({
      success: true,
      message: 'Device registered successfully'
    });
  } catch (error) {
    console.error('Error registering device:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while registering device'
    });
  }
};

/**
 * Unregister device for push notifications
 */
export const unregisterDevice = async (req: Request, res: Response) => {
  try {
    const { deviceToken } = req.body;

    if (!deviceToken) {
      return res.status(400).json({
        success: false,
        message: 'Device token is required'
      });
    }

    // Unregister the device
    const success = await notificationService.unregisterDevice(deviceToken);

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to unregister device'
      });
    }

    return res.json({
      success: true,
      message: 'Device unregistered successfully'
    });
  } catch (error) {
    console.error('Error unregistering device:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while unregistering device'
    });
  }
};