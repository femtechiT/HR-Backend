import { Router } from 'express';
import {
  getAllShiftTemplates,
  getShiftTemplateById,
  createShiftTemplate,
  updateShiftTemplate,
  deleteShiftTemplate,
  getAllEmployeeShiftAssignments,
  getEmployeeShiftAssignmentById,
  assignShiftToEmployee,
  updateEmployeeShiftAssignment,
  bulkAssignShifts
} from '../controllers/shift-management.controller';
import {
  getAllScheduleRequests,
  getScheduleRequestById,
  createScheduleRequest,
  updateScheduleRequest,
  cancelScheduleRequest,
  approveScheduleRequest,
  rejectScheduleRequest,
  getTimeOffBankBalance,
  getAllTimeOffBanks,
  createTimeOffBank
} from '../controllers/schedule-request.controller';
import { authenticateJWT, checkPermission } from '../middleware/auth.middleware';

const router = Router();

// Shift Templates Routes
router.get('/shift-templates', authenticateJWT, checkPermission('shift_template:read'), getAllShiftTemplates);
router.get('/shift-templates/:id', authenticateJWT, checkPermission('shift_template:read'), getShiftTemplateById);
router.post('/shift-templates', authenticateJWT, checkPermission('shift_template:create'), createShiftTemplate);
router.put('/shift-templates/:id', authenticateJWT, checkPermission('shift_template:update'), updateShiftTemplate);
router.delete('/shift-templates/:id', authenticateJWT, checkPermission('shift_template:delete'), deleteShiftTemplate);

// Employee Shift Assignments Routes
router.get('/employee-shift-assignments', authenticateJWT, checkPermission('employee_shift_assignment:read'), getAllEmployeeShiftAssignments);
router.get('/employee-shift-assignments/:id', authenticateJWT, checkPermission('employee_shift_assignment:read'), getEmployeeShiftAssignmentById);
router.post('/employee-shift-assignments', authenticateJWT, checkPermission('employee_shift_assignment:create'), assignShiftToEmployee);
router.put('/employee-shift-assignments/:id', authenticateJWT, checkPermission('employee_shift_assignment:update'), updateEmployeeShiftAssignment);
router.post('/employee-shift-assignments/bulk', authenticateJWT, checkPermission('employee_shift_assignment:create'), bulkAssignShifts);

// Schedule Requests Routes
router.get('/schedule-requests', authenticateJWT, getAllScheduleRequests);
router.get('/schedule-requests/:id', authenticateJWT, getScheduleRequestById);
router.post('/schedule-requests', authenticateJWT, createScheduleRequest);
router.put('/schedule-requests/:id', authenticateJWT, updateScheduleRequest);
router.put('/schedule-requests/:id/cancel', authenticateJWT, cancelScheduleRequest);
router.put('/schedule-requests/:id/approve', authenticateJWT, checkPermission('schedule_request:approve'), approveScheduleRequest);
router.put('/schedule-requests/:id/reject', authenticateJWT, checkPermission('schedule_request:reject'), rejectScheduleRequest);

// Time Off Banks Routes are now in their own dedicated route file at /api/time-off-banks
// See /api/time-off-banks for all time off bank functionality

export default router;