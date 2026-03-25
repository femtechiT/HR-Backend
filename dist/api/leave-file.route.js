"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const leave_file_controller_1 = require("../controllers/leave-file.controller");
const router = (0, express_1.Router)();
router.get('/uploads/leave-requests/:filename', leave_file_controller_1.serveLeaveFile);
router.get('/uploads/attachments/:filename', leave_file_controller_1.serveLeaveFile);
router.use(auth_middleware_1.authenticateJWT);
router.post('/upload', (0, auth_middleware_1.checkPermission)('leave:create'), upload_middleware_1.upload.array('files', 5), upload_middleware_1.handleMulterError, leave_file_controller_1.uploadLeaveFiles);
router.get('/:id/files', leave_file_controller_1.getLeaveRequestFiles);
router.delete('/:id/files/:fileIndex', (0, auth_middleware_1.checkPermission)('leave:update'), leave_file_controller_1.deleteLeaveRequestFile);
exports.default = router;
//# sourceMappingURL=leave-file.route.js.map