"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const branch_management_controller_1 = require("../controllers/branch-management.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateJWT);
router.get('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('branches:read'), branch_management_controller_1.getAllBranches);
router.get('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('branches:read'), branch_management_controller_1.getBranchById);
router.post('/', (0, auth_middleware_1.checkPermission)('branches:create'), branch_management_controller_1.createBranch);
router.put('/:id', (0, auth_middleware_1.checkPermission)('branches:update'), branch_management_controller_1.updateBranch);
router.delete('/:id', (0, auth_middleware_1.checkPermission)('branches:delete'), branch_management_controller_1.deleteBranch);
exports.default = router;
//# sourceMappingURL=branch-management.route.js.map