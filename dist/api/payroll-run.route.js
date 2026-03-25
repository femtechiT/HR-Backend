"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const payroll_run_controller_1 = require("../controllers/payroll-run.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.get('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('payroll_run:read'), payroll_run_controller_1.getAllPayrollRuns);
router.get('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('payroll_run:read'), payroll_run_controller_1.getPayrollRunById);
router.post('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('payroll_run.create'), payroll_run_controller_1.createPayrollRun);
router.put('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('payroll_run.update'), payroll_run_controller_1.updatePayrollRun);
router.delete('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('payroll_run.delete'), payroll_run_controller_1.deletePayrollRun);
router.post('/:id/execute', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('payroll_run.execute'), payroll_run_controller_1.executePayrollRun);
exports.default = router;
//# sourceMappingURL=payroll-run.route.js.map