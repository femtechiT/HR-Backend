"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const system_init_controller_1 = require("../controllers/system-init.controller");
const system_init_controller_2 = require("../controllers/system-init.controller");
const router = (0, express_1.Router)();
const requireUninitializedSystem = async (req, res, next) => {
    try {
        const systemInitialized = await (0, system_init_controller_2.isSystemInitialized)();
        if (systemInitialized) {
            return res.status(400).json({
                success: false,
                message: 'System is already initialized'
            });
        }
        next();
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error checking system status'
        });
    }
};
router.post('/initialize', requireUninitializedSystem, system_init_controller_1.initializeSystem);
router.get('/status', system_init_controller_1.checkInitializationStatus);
exports.default = router;
//# sourceMappingURL=system-init.route.js.map