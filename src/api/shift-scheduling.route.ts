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
  deleteEmployeeShiftAssignment,
  bulkAssignShifts,
  bulkAssignRecurringShifts,
  bulkAssignRecurringShiftsByBranch,
  getRecurringShifts,
  updateRecurringShift,
  deleteRecurringShift,
  getMyShiftAssignments  // ✅ Add import
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
import {
  getAllShiftExceptions,
  getMyShiftExceptions,
  getShiftExceptionById,
  createShiftException,
  updateShiftException,
  deleteShiftException
} from '../controllers/shift-exception.controller';
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
router.get('/employee-shift-assignments/my', authenticateJWT, getMyShiftAssignments);  // ✅ Add my endpoint
router.get('/employee-shift-assignments/:id', authenticateJWT, checkPermission('employee_shift_assignment:read'), getEmployeeShiftAssignmentById);
router.post('/employee-shift-assignments', authenticateJWT, checkPermission('employee_shift_assignment:create'), assignShiftToEmployee);
router.put('/employee-shift-assignments/:id', authenticateJWT, checkPermission('employee_shift_assignment:update'), updateEmployeeShiftAssignment);
router.delete('/employee-shift-assignments/:id', authenticateJWT, checkPermission('employee_shift_assignment:update'), deleteEmployeeShiftAssignment);
router.post('/employee-shift-assignments/bulk', authenticateJWT, checkPermission('employee_shift_assignment:create'), bulkAssignShifts);

// Recurring Shift Assignments Routes (for Resume Late / Close Early use cases)
router.get('/recurring-shifts', authenticateJWT, checkPermission('employee_shift_assignment:read'), getRecurringShifts);
router.post('/recurring-shifts/bulk', authenticateJWT, checkPermission('employee_shift_assignment:create'), bulkAssignRecurringShifts);
router.post('/recurring-shifts/bulk-assign-branch', authenticateJWT, checkPermission('employee_shift_assignment:create'), bulkAssignRecurringShiftsByBranch);
router.put('/recurring-shifts/:id', authenticateJWT, checkPermission('employee_shift_assignment:update'), updateRecurringShift);
router.delete('/recurring-shifts/:id', authenticateJWT, checkPermission('employee_shift_assignment:update'), deleteRecurringShift);

// Schedule Requests Routes
router.get('/schedule-requests', authenticateJWT, getAllScheduleRequests);
router.get('/schedule-requests/:id', authenticateJWT, getScheduleRequestById);
router.post('/schedule-requests', authenticateJWT, createScheduleRequest);
router.put('/schedule-requests/:id', authenticateJWT, updateScheduleRequest);
router.put('/schedule-requests/:id/cancel', authenticateJWT, cancelScheduleRequest);
router.put('/schedule-requests/:id/approve', authenticateJWT, checkPermission('schedule_request:approve'), approveScheduleRequest);
router.put('/schedule-requests/:id/reject', authenticateJWT, checkPermission('schedule_request:reject'), rejectScheduleRequest);

// Shift Exceptions Routes
router.get('/exceptions', authenticateJWT, checkPermission('shift_exception:read'), getAllShiftExceptions);
router.get('/exceptions/my', authenticateJWT, getMyShiftExceptions);
router.get('/exceptions/:id', authenticateJWT, checkPermission('shift_exception:read'), getShiftExceptionById);
router.post('/exceptions', authenticateJWT, checkPermission('shift_exception:create'), createShiftException);
router.put('/exceptions/:id', authenticateJWT, checkPermission('shift_exception:update'), updateShiftException);
router.delete('/exceptions/:id', authenticateJWT, checkPermission('shift_exception:delete'), deleteShiftException);

// Time Off Banks Routes are now in their own dedicated route file at /api/time-off-banks
// See /api/time-off-banks for all time off bank functionality

export default router;
