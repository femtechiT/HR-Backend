"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const payslip_controller_1 = require("../controllers/payslip.controller");
const payslip_email_controller_1 = require("../controllers/payslip-email.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.get('/view/:staffId/:payrollRunId', auth_middleware_1.authenticateJWT, payslip_controller_1.generatePayslip);
router.get('/download/:staffId/:payrollRunId', auth_middleware_1.authenticateJWT, payslip_controller_1.downloadPayslip);
router.post('/send/:staffId/:payrollRunId', auth_middleware_1.authenticateJWT, payslip_email_controller_1.sendPayslipByEmail);
exports.default = router;
//# sourceMappingURL=payslip.route.js.map