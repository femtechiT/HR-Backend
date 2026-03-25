"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const role_management_controller_1 = require("../controllers/role-management.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateJWT);
router.get('/permissions', role_management_controller_1.getAvailablePermissions);
router.get('/', role_management_controller_1.getAllRoles);
router.post('/', (0, auth_middleware_1.checkPermission)('roles:create'), role_management_controller_1.createRole);
router.put('/:id', (0, auth_middleware_1.checkPermission)('roles:update'), role_management_controller_1.updateRole);
router.delete('/:id', (0, auth_middleware_1.checkPermission)('roles:delete'), role_management_controller_1.deleteRole);
exports.default = router;
//# sourceMappingURL=role-management.route.js.map