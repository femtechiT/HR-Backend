"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const form_submission_controller_1 = require("../controllers/form-submission.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.get('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('form_submission:read'), form_submission_controller_1.getAllFormSubmissions);
router.get('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('form_submission:read'), form_submission_controller_1.getFormSubmissionById);
router.post('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('form.submission.create'), form_submission_controller_1.submitForm);
router.put('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('form.submission.update'), form_submission_controller_1.updateFormSubmission);
router.delete('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('form.submission.delete'), form_submission_controller_1.deleteFormSubmission);
exports.default = router;
//# sourceMappingURL=form-submission.route.js.map