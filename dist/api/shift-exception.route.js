"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const permission_middleware_1 = require("../middleware/permission.middleware");
const shift_exception_controller_1 = require("../controllers/shift-exception.controller");
const router = (0, express_1.Router)();
router.get('/my', auth_middleware_1.authenticateJWT, shift_exception_controller_1.getMyShiftExceptions);
router.post('/', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('shift_exception:create'), shift_exception_controller_1.createShiftException);
router.get('/', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('shift_exception:read'), shift_exception_controller_1.getAllShiftExceptions);
router.get('/:id', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('shift_exception:read'), shift_exception_controller_1.getShiftExceptionById);
router.put('/:id', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('shift_exception:update'), shift_exception_controller_1.updateShiftException);
router.delete('/:id', auth_middleware_1.authenticateJWT, (0, permission_middleware_1.checkPermission)('shift_exception:delete'), shift_exception_controller_1.deleteShiftException);
exports.default = router;
//# sourceMappingURL=shift-exception.route.js.map