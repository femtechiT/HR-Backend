"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const form_controller_1 = require("../controllers/form.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.get('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('forms:read'), form_controller_1.getAllForms);
router.get('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('forms:read'), form_controller_1.getFormById);
router.post('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('form.create'), form_controller_1.createForm);
router.put('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('form.update'), form_controller_1.updateForm);
router.delete('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('form.delete'), form_controller_1.deleteForm);
router.get('/:id/fields', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('forms:read'), form_controller_1.getFormFields);
exports.default = router;
//# sourceMappingURL=form.route.js.map