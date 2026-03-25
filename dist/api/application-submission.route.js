"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const application_submission_controller_1 = require("../controllers/application-submission.controller");
const application_submission_controller_2 = require("../controllers/application-submission.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post('/', application_submission_controller_2.upload.single('resume'), application_submission_controller_1.submitJobApplication);
router.use(auth_middleware_1.authenticateJWT);
router.get('/my-applications/:email', application_submission_controller_1.getApplicationsByApplicant);
router.get('/:id', application_submission_controller_1.getApplicationById);
router.get('/by-job/:job_posting_id', application_submission_controller_1.getApplicationsByJobPosting);
exports.default = router;
//# sourceMappingURL=application-submission.route.js.map