"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const company_email_middleware_1 = require("../middleware/company-email.middleware");
const router = express_1.default.Router();
router.post('/login', company_email_middleware_1.companyEmailOnly, auth_controller_1.login);
router.post('/refresh', auth_controller_1.refreshToken);
router.post('/logout', auth_middleware_1.authenticateJWT, auth_controller_1.logout);
router.get('/permissions', auth_middleware_1.authenticateJWT, auth_controller_1.getPermissions);
exports.default = router;
//# sourceMappingURL=auth.route.js.map