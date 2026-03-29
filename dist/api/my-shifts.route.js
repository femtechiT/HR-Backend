"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const my_shifts_controller_1 = require("../controllers/my-shifts.controller");
const router = (0, express_1.Router)();
router.get('/today', auth_middleware_1.authenticateJWT, my_shifts_controller_1.getMyTodayShift);
router.get('/', auth_middleware_1.authenticateJWT, my_shifts_controller_1.getMyShifts);
router.get('/upcoming', auth_middleware_1.authenticateJWT, my_shifts_controller_1.getMyUpcomingShifts);
router.get('/team', auth_middleware_1.authenticateJWT, my_shifts_controller_1.getTeamShifts);
exports.default = router;
//# sourceMappingURL=my-shifts.route.js.map