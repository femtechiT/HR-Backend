"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const leave_type_route_1 = __importDefault(require("./leave-type.route"));
const leave_request_route_1 = __importDefault(require("./leave-request.route"));
const leave_allocation_route_1 = __importDefault(require("./leave-allocation.route"));
const leave_file_route_1 = __importDefault(require("./leave-file.route"));
const router = (0, express_1.Router)();
router.use('/', leave_file_route_1.default);
router.use('/types', leave_type_route_1.default);
router.use('/allocations', leave_allocation_route_1.default);
router.use('/', leave_request_route_1.default);
exports.default = router;
//# sourceMappingURL=leave.route.js.map