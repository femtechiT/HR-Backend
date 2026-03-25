"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const payment_type_controller_1 = require("../controllers/payment-type.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.get('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('payment_type:read'), payment_type_controller_1.getAllPaymentTypes);
router.get('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('payment_type:read'), payment_type_controller_1.getPaymentTypeById);
router.post('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('payment_type.create'), payment_type_controller_1.createPaymentType);
router.put('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('payment_type.update'), payment_type_controller_1.updatePaymentType);
router.delete('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('payment_type.delete'), payment_type_controller_1.deletePaymentType);
router.patch('/:id/activate', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('payment_type.update'), payment_type_controller_1.activatePaymentType);
exports.default = router;
//# sourceMappingURL=payment-type.route.js.map