"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const payroll_record_controller_1 = require("../controllers/payroll-record.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.get('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('payroll_record:read'), payroll_record_controller_1.getAllPayrollRecords);
router.get('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('payroll_record:read'), payroll_record_controller_1.getPayrollRecordById);
router.put('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('payroll_record.update'), payroll_record_controller_1.updatePayrollRecord);
router.delete('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('payroll_record.delete'), payroll_record_controller_1.deletePayrollRecord);
router.get('/staff/:id/history', auth_middleware_1.authenticateJWT, payroll_record_controller_1.getStaffPayrollHistory);
exports.default = router;
//# sourceMappingURL=payroll-record.route.js.map