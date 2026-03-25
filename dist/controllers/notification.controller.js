"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unregisterDevice = exports.registerDevice = exports.updateUserNotificationPreferences = exports.getNotificationPreferences = exports.markNotificationAsRead = exports.getUserNotifications = void 0;
const database_1 = require("../config/database");
const notification_service_1 = require("../services/notification.service");
const getUserNotifications = async (req, res) => {
    try {
        const userId = req.currentUser.id;
        const { page = 1, limit = 10, type, status } = req.query;
        let query = `
      SELECT nl.*, u.full_name as recipient_name
      FROM notification_logs nl
      LEFT JOIN users u ON nl.recipient_user_id = u.id
      WHERE nl.recipient_user_id = ?
    `;
        const params = [userId];
        if (type) {
            query += ' AND nl.notification_type = ?';
            params.push(type);
        }
        if (status) {
            query += ' AND nl.delivery_status = ?';
            params.push(status);
        }
        query += ' ORDER BY nl.created_at DESC';
        const offset = (Number(page) - 1) * Number(limit);
        query += ' LIMIT ? OFFSET ?';
        params.push(Number(limit), offset);
        const [rows] = await database_1.pool.execute(query, params);
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
        const [countRows] = await database_1.pool.execute(countQuery, countParams);
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
    }
    catch (error) {
        console.error('Error fetching user notifications:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching notifications'
        });
    }
};
exports.getUserNotifications = getUserNotifications;
const markNotificationAsRead = async (req, res) => {
    try {
        const userId = req.currentUser.id;
        const { id } = req.params;
        const [result] = await database_1.pool.execute('UPDATE notification_logs SET opened_at = NOW() WHERE id = ? AND recipient_user_id = ?', [id, userId]);
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
    }
    catch (error) {
        console.error('Error marking notification as read:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while marking notification as read'
        });
    }
};
exports.markNotificationAsRead = markNotificationAsRead;
const getNotificationPreferences = async (req, res) => {
    try {
        const userId = req.currentUser.id;
        const [rows] = await database_1.pool.execute('SELECT * FROM user_notification_preferences WHERE user_id = ?', [userId]);
        return res.json({
            success: true,
            data: {
                preferences: rows
            }
        });
    }
    catch (error) {
        console.error('Error fetching notification preferences:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching notification preferences'
        });
    }
};
exports.getNotificationPreferences = getNotificationPreferences;
const updateUserNotificationPreferences = async (req, res) => {
    try {
        const userId = req.currentUser.id;
        const { notificationType, channels, enabled } = req.body;
        if (!notificationType || !Array.isArray(channels)) {
            return res.status(400).json({
                success: false,
                message: 'Notification type and channels array are required'
            });
        }
        const validChannels = ['email', 'push', 'in_app', 'sms'];
        const invalidChannels = channels.filter((ch) => !validChannels.includes(ch));
        if (invalidChannels.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Invalid channels: ${invalidChannels.join(', ')}. Valid channels are: ${validChannels.join(', ')}`
            });
        }
        const [result] = await database_1.pool.execute(`
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
    }
    catch (error) {
        console.error('Error updating notification preferences:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while updating notification preferences'
        });
    }
};
exports.updateUserNotificationPreferences = updateUserNotificationPreferences;
const registerDevice = async (req, res) => {
    try {
        const userId = req.currentUser.id;
        const { deviceToken, deviceType, platform, appVersion, osVersion } = req.body;
        if (!deviceToken || !platform) {
            return res.status(400).json({
                success: false,
                message: 'Device token and platform are required'
            });
        }
        const validPlatforms = ['ios', 'android', 'web'];
        if (!validPlatforms.includes(platform)) {
            return res.status(400).json({
                success: false,
                message: `Invalid platform: ${platform}. Valid platforms are: ${validPlatforms.join(', ')}`
            });
        }
        const validDeviceTypes = ['mobile', 'tablet', 'desktop'];
        if (deviceType && !validDeviceTypes.includes(deviceType)) {
            return res.status(400).json({
                success: false,
                message: `Invalid device type: ${deviceType}. Valid types are: ${validDeviceTypes.join(', ')}`
            });
        }
        const success = await notification_service_1.notificationService.registerDevice(userId, deviceToken, deviceType || 'mobile', platform, appVersion, osVersion);
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
    }
    catch (error) {
        console.error('Error registering device:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while registering device'
        });
    }
};
exports.registerDevice = registerDevice;
const unregisterDevice = async (req, res) => {
    try {
        const { deviceToken } = req.body;
        if (!deviceToken) {
            return res.status(400).json({
                success: false,
                message: 'Device token is required'
            });
        }
        const success = await notification_service_1.notificationService.unregisterDevice(deviceToken);
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
    }
    catch (error) {
        console.error('Error unregistering device:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while unregistering device'
        });
    }
};
exports.unregisterDevice = unregisterDevice;
//# sourceMappingURL=notification.controller.js.map