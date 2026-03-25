"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const department_management_controller_1 = require("../controllers/department-management.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateJWT);
router.get('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('departments:read'), department_management_controller_1.getAllDepartments);
router.get('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('departments:read'), department_management_controller_1.getDepartmentById);
router.post('/', (0, auth_middleware_1.checkPermission)('departments:create'), department_management_controller_1.createDepartment);
router.put('/:id', (0, auth_middleware_1.checkPermission)('departments:update'), department_management_controller_1.updateDepartment);
router.delete('/:id', (0, auth_middleware_1.checkPermission)('departments:delete'), department_management_controller_1.deleteDepartment);
exports.default = router;
//# sourceMappingURL=department-management.route.js.map