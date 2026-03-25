"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const holiday_duty_roster_controller_1 = __importDefault(require("../controllers/holiday-duty-roster.controller"));
const router = (0, express_1.Router)();
router.post('/', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('holiday-duty-roster:create'), holiday_duty_roster_controller_1.default.create);
router.post('/bulk', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('holiday-duty-roster:create'), holiday_duty_roster_controller_1.default.bulkCreate);
router.get('/', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('holiday-duty-roster:read'), holiday_duty_roster_controller_1.default.getAll);
router.get('/:holidayId', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('holiday-duty-roster:read'), holiday_duty_roster_controller_1.default.getByHolidayId);
router.get('/user/:userId', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('holiday-duty-roster:read'), holiday_duty_roster_controller_1.default.getByUserId);
router.put('/:id', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('holiday-duty-roster:update'), holiday_duty_roster_controller_1.default.update);
router.delete('/:id', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('holiday-duty-roster:delete'), holiday_duty_roster_controller_1.default.delete);
exports.default = router;
//# sourceMappingURL=holiday-duty-roster.route.js.map