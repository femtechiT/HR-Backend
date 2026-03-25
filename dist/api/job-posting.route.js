"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const job_posting_controller_1 = require("../controllers/job-posting.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('job_posting:read'), job_posting_controller_1.getAllJobPostings);
router.get('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('job_posting:read'), job_posting_controller_1.getJobPostingById);
router.use(auth_middleware_1.authenticateJWT);
router.post('/', (0, auth_middleware_1.checkPermission)('job_posting:create'), job_posting_controller_1.createJobPosting);
router.put('/:id', (0, auth_middleware_1.checkPermission)('job_posting:update'), job_posting_controller_1.updateJobPosting);
router.post('/:id/close', (0, auth_middleware_1.checkPermission)('job_posting:update'), job_posting_controller_1.closeJobPosting);
router.delete('/:id', (0, auth_middleware_1.checkPermission)('job_posting:delete'), job_posting_controller_1.deleteJobPosting);
exports.default = router;
//# sourceMappingURL=job-posting.route.js.map