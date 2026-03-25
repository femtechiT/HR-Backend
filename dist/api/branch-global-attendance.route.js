"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const branch_global_attendance_controller_1 = require("../controllers/branch-global-attendance.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.post('/global-attendance-mode', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('branches:update'), branch_global_attendance_controller_1.updateGlobalAttendanceMode);
router.get('/global-attendance-mode', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('branches:read'), branch_global_attendance_controller_1.getGlobalAttendanceMode);
exports.default = router;
//# sourceMappingURL=branch-global-attendance.route.js.map