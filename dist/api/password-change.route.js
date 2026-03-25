"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const password_change_controller_1 = require("../controllers/password-change.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.post('/change', auth_middleware_1.authenticateJWT, password_change_controller_1.changePasswordAfterFirstLogin);
router.patch('/force/:id', auth_middleware_1.authenticateJWT, password_change_controller_1.forcePasswordChange);
exports.default = router;
//# sourceMappingURL=password-change.route.js.map