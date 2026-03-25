"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const exception_type_controller_1 = require("../controllers/exception-type.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateJWT);
router.get('/', (0, auth_middleware_1.checkPermission)('shift_exception_type:read'), exception_type_controller_1.getAllExceptionTypes);
router.get('/:id', (0, auth_middleware_1.checkPermission)('shift_exception_type:read'), exception_type_controller_1.getExceptionTypeById);
router.post('/', (0, auth_middleware_1.checkPermission)('shift_exception_type:create'), exception_type_controller_1.createExceptionType);
router.put('/:id', (0, auth_middleware_1.checkPermission)('shift_exception_type:update'), exception_type_controller_1.updateExceptionType);
router.delete('/:id', (0, auth_middleware_1.checkPermission)('shift_exception_type:delete'), exception_type_controller_1.deleteExceptionType);
router.patch('/:id/toggle', (0, auth_middleware_1.checkPermission)('shift_exception_type:update'), exception_type_controller_1.toggleExceptionTypeActive);
exports.default = router;
//# sourceMappingURL=shift-exception-type.route.js.map