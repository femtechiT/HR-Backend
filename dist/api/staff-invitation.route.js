"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const staff_invitation_controller_1 = require("../controllers/staff-invitation.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post('/accept/:token', staff_invitation_controller_1.acceptInvitation);
router.use(auth_middleware_1.authenticateJWT);
router.post('/', (0, auth_middleware_1.checkPermission)('staff:create'), staff_invitation_controller_1.inviteStaffMember);
router.get('/roles', staff_invitation_controller_1.getAvailableRoles);
router.get('/branches', staff_invitation_controller_1.getAvailableBranches);
router.get('/departments', staff_invitation_controller_1.getAvailableDepartments);
router.get('/invitations', (0, auth_middleware_1.checkPermission)('staff:read'), staff_invitation_controller_1.getAllInvitations);
router.get('/invitations/pending', (0, auth_middleware_1.checkPermission)('staff:read'), staff_invitation_controller_1.getPendingInvitations);
router.post('/invitations/:id/resend', (0, auth_middleware_1.checkPermission)('staff:create'), staff_invitation_controller_1.resendInvitation);
router.delete('/invitations/:id', (0, auth_middleware_1.checkPermission)('staff:delete'), staff_invitation_controller_1.cancelInvitation);
exports.default = router;
//# sourceMappingURL=staff-invitation.route.js.map