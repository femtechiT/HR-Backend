"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const role_controller_1 = require("../controllers/role.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.get('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('roles:read'), role_controller_1.getAllRoles);
router.get('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('roles:read'), role_controller_1.getRoleById);
router.post('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('role.create'), role_controller_1.createRole);
router.put('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('role.update'), role_controller_1.updateRole);
router.delete('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('role.delete'), role_controller_1.deleteRole);
router.get('/:id/permissions', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('role.permissions.view'), role_controller_1.getRolePermissions);
router.post('/:id/permissions', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('role.permissions.manage'), role_controller_1.addRolePermission);
router.delete('/:id/permissions/:permission', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('role.permissions.manage'), role_controller_1.removeRolePermission);
exports.default = router;
//# sourceMappingURL=role.route.js.map