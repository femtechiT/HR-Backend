"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const staff_controller_1 = require("../controllers/staff.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
const validateNumericId = (req, res, next) => {
    const id = req.params.id;
    const idString = Array.isArray(id) ? id[0] : id;
    const numericId = parseInt(idString);
    if (isNaN(numericId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid staff ID. Expected a numeric ID.'
        });
    }
    req.numericId = numericId;
    return next();
};
const validateNumericIdParam = (paramName) => {
    return (req, res, next) => {
        const id = req.params[paramName];
        const idString = Array.isArray(id) ? id[0] : id;
        const numericId = parseInt(idString);
        if (isNaN(numericId)) {
            return res.status(400).json({
                success: false,
                message: `Invalid ${paramName}. Expected a numeric ID.`
            });
        }
        req.numericId = numericId;
        return next();
    };
};
router.get('/me', auth_middleware_1.authenticateJWT, staff_controller_1.getCurrentUserStaffDetails);
router.get('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('staff:read'), staff_controller_1.getAllStaff);
router.get('/:id', auth_middleware_1.authenticateJWT, validateNumericId, (req, res, next) => {
    if (req.currentUser?.id === req.numericId) {
        return next();
    }
    return (0, auth_middleware_1.checkPermission)('staff:read')(req, res, next);
}, staff_controller_1.getStaffById);
router.post('/', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('staff.create'), staff_controller_1.createStaff);
router.put('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('staff.update'), validateNumericId, staff_controller_1.updateStaff);
router.delete('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('staff.delete'), validateNumericId, staff_controller_1.deleteStaff);
router.patch('/:id/terminate', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('staff.terminate'), validateNumericId, staff_controller_1.terminateStaff);
router.get('/department/:department', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('staff:read'), staff_controller_1.getStaffByDepartment);
router.get('/dynamic-fields', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('staff:read'), staff_controller_1.getDynamicFields);
router.post('/dynamic-fields', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('staff.create'), staff_controller_1.createDynamicField);
router.put('/dynamic-fields/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('staff.update'), validateNumericIdParam('id'), staff_controller_1.updateDynamicField);
router.delete('/dynamic-fields/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('staff.delete'), validateNumericIdParam('id'), staff_controller_1.deleteDynamicField);
router.get('/dynamic-values/:staffId', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('staff:read'), validateNumericIdParam('staffId'), staff_controller_1.getStaffDynamicValues);
router.post('/dynamic-values/:staffId', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('staff.update'), validateNumericIdParam('staffId'), staff_controller_1.setStaffDynamicValues);
exports.default = router;
//# sourceMappingURL=staff.route.js.map