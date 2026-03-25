"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const staff_payment_structure_controller_1 = require("../controllers/staff-payment-structure.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.get('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('staff_payment_structure:read'), staff_payment_structure_controller_1.getStaffPaymentStructure);
router.post('/:id/payment', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('staff_payment_structure.create'), staff_payment_structure_controller_1.addPaymentToStaff);
router.put('/:staffId/payment/:paymentId', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('staff_payment_structure.update'), staff_payment_structure_controller_1.updateStaffPayment);
router.delete('/:staffId/payment/:paymentId', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('staff_payment_structure.delete'), staff_payment_structure_controller_1.removePaymentFromStaff);
exports.default = router;
//# sourceMappingURL=staff-payment-structure.route.js.map