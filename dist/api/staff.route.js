"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const staff_controller_1 = require("../controllers/staff.controller");
const staff_photo_controller_1 = require("../controllers/staff-photo.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
const validateNumericId = (req, res, next) => {
    const id = req.params.id || req.params.userId || req.params.staffId;
    const idString = Array.isArray(id) ? id[0] : id;
    const numericId = parseInt(idString);
    console.log('[Backend Route] validateNumericId called');
    console.log('[Backend Route] req.params:', req.params);
    console.log('[Backend Route] Extracted id param:', id);
    console.log('[Backend Route] idString:', idString);
    console.log('[Backend Route] Parsed numericId:', numericId);
    console.log('[Backend Route] isNaN(numericId):', isNaN(numericId));
    if (isNaN(numericId)) {
        console.log('[Backend Route] ❌ Invalid numeric ID');
        return res.status(400).json({
            success: false,
            message: 'Invalid staff ID. Expected a numeric ID.'
        });
    }
    console.log('[Backend Route] ✅ Valid numeric ID, setting req.numericId:', numericId);
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
router.put('/:userId', auth_middleware_1.authenticateJWT, validateNumericId, async (req, res) => {
    console.log('========================================');
    console.log('[Backend Route] PUT /staff/:userId handler called');
    console.log('[Backend Route] req.params.userId:', req.params.userId);
    console.log('[Backend Route] req.numericId:', req.numericId);
    console.log('[Backend Route] req.currentUser.id:', req.currentUser?.id);
    console.log('========================================');
    const requestedUserId = req.numericId;
    if (req.currentUser?.id !== requestedUserId) {
        console.log('[Backend Route] User trying to update another user\'s record');
        console.log('[Backend Route] currentUser.id:', req.currentUser?.id);
        console.log('[Backend Route] requestedUserId:', requestedUserId);
        return (0, auth_middleware_1.checkPermission)('staff.update')(req, res, () => {
            Promise.resolve().then(() => __importStar(require('../controllers/staff.controller'))).then(({ updateStaff }) => {
                return updateStaff(req, res);
            });
        });
    }
    console.log('[Backend Route] User updating their own record');
    Promise.resolve().then(() => __importStar(require('../controllers/staff.controller'))).then(({ updateStaff }) => {
        return updateStaff(req, res);
    });
});
router.delete('/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('staff.delete'), validateNumericId, staff_controller_1.deleteStaff);
router.patch('/:id/terminate', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('staff.terminate'), validateNumericId, staff_controller_1.terminateStaff);
router.get('/department/:department', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('staff:read'), staff_controller_1.getStaffByDepartment);
router.get('/dynamic-fields', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('staff:read'), staff_controller_1.getDynamicFields);
router.post('/dynamic-fields', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('staff.create'), staff_controller_1.createDynamicField);
router.put('/dynamic-fields/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('staff.update'), validateNumericIdParam('id'), staff_controller_1.updateDynamicField);
router.delete('/dynamic-fields/:id', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('staff.delete'), validateNumericIdParam('id'), staff_controller_1.deleteDynamicField);
router.get('/dynamic-values/:staffId', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('staff:read'), validateNumericIdParam('staffId'), staff_controller_1.getStaffDynamicValues);
router.post('/dynamic-values/:staffId', auth_middleware_1.authenticateJWT, (0, auth_middleware_1.checkPermission)('staff.update'), validateNumericIdParam('staffId'), staff_controller_1.setStaffDynamicValues);
router.post('/:id/upload-photo', auth_middleware_1.authenticateJWT, staff_photo_controller_1.upload.single('profile_picture'), staff_photo_controller_1.uploadProfilePhoto);
exports.default = router;
//# sourceMappingURL=staff.route.js.map