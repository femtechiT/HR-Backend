"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const complete_system_init_controller_1 = require("../controllers/complete-system-init.controller");
const router = (0, express_1.Router)();
router.get('/readiness', complete_system_init_controller_1.checkSystemReadiness);
router.post('/setup-complete', complete_system_init_controller_1.initializeCompleteSystem);
exports.default = router;
//# sourceMappingURL=complete-system-init.route.js.map