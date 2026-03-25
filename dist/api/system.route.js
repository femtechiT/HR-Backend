"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const system_init_service_1 = require("../services/system-init.service");
const router = (0, express_1.Router)();
router.get('/init-data', auth_middleware_1.authenticateJWT, async (req, res) => {
    try {
        const systemData = await system_init_service_1.SystemInitService.getSystemData();
        return res.json({
            success: true,
            message: 'System initialization data retrieved successfully',
            data: systemData
        });
    }
    catch (error) {
        console.error('Get system init data error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve system data'
        });
    }
});
router.get('/init-data/stats', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('admin.access'), async (req, res) => {
    try {
        const stats = await system_init_service_1.SystemInitService.getCacheStats();
        return res.json({
            success: true,
            message: 'Cache statistics retrieved successfully',
            data: stats
        });
    }
    catch (error) {
        console.error('Get cache stats error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve cache statistics'
        });
    }
});
router.post('/init-data/refresh', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('admin.access'), async (req, res) => {
    try {
        await system_init_service_1.SystemInitService.refreshAll();
        return res.json({
            success: true,
            message: 'System cache refreshed successfully'
        });
    }
    catch (error) {
        console.error('Refresh system cache error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to refresh system cache'
        });
    }
});
router.post('/init-data/refresh/:type', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('admin.access'), async (req, res) => {
    try {
        const typeParam = req.params.type;
        const type = Array.isArray(typeParam) ? typeParam[0] : typeParam;
        const validTypes = ['roles', 'permissions', 'branches', 'departments', 'leaveTypes', 'holidays'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: `Invalid type. Must be one of: ${validTypes.join(', ')}`
            });
        }
        await system_init_service_1.SystemInitService.refresh(type);
        return res.json({
            success: true,
            message: `${type} cache refreshed successfully`
        });
    }
    catch (error) {
        console.error('Refresh specific cache error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to refresh cache'
        });
    }
});
exports.default = router;
//# sourceMappingURL=system.route.js.map