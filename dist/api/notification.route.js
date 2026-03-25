"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("../controllers/notification.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateJWT);
router.get('/my-notifications', notification_controller_1.getUserNotifications);
router.patch('/notifications/:id/read', notification_controller_1.markNotificationAsRead);
router.get('/preferences', notification_controller_1.getNotificationPreferences);
router.put('/preferences', notification_controller_1.updateUserNotificationPreferences);
router.post('/devices/register', notification_controller_1.registerDevice);
router.delete('/devices/unregister', notification_controller_1.unregisterDevice);
exports.default = router;
//# sourceMappingURL=notification.route.js.map