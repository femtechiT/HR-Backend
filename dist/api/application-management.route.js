"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const application_management_controller_1 = require("../controllers/application-management.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateJWT);
router.put('/:id/status', (0, auth_middleware_1.checkPermission)('job_application:update'), application_management_controller_1.updateApplicationStatus);
router.get('/', (0, auth_middleware_1.checkPermission)('job_application:read'), application_management_controller_1.getAllApplications);
router.put('/:id/withdraw', application_management_controller_1.withdrawApplication);
router.post('/:id/comment', (0, auth_middleware_1.checkPermission)('job_application:comment'), application_management_controller_1.addCommentToApplication);
router.get('/:id/comments', application_management_controller_1.getCommentsForApplication);
exports.default = router;
//# sourceMappingURL=application-management.route.js.map