"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const holiday_duty_roster_model_1 = __importDefault(require("../models/holiday-duty-roster.model"));
const holiday_model_1 = __importDefault(require("../models/holiday.model"));
const staff_model_1 = __importDefault(require("../models/staff.model"));
class HolidayDutyRosterController {
    static async create(req, res) {
        try {
            const { holiday_id, user_id, shift_start_time, shift_end_time, notes } = req.body;
            if (!holiday_id || !user_id || !shift_start_time || !shift_end_time) {
                return res.status(400).json({
                    success: false,
                    message: 'holiday_id, user_id, shift_start_time, and shift_end_time are required'
                });
            }
            const holiday = await holiday_model_1.default.findById(holiday_id);
            if (!holiday) {
                return res.status(404).json({
                    success: false,
                    message: 'Holiday not found'
                });
            }
            const staff = await staff_model_1.default.findByUserId(user_id);
            if (!staff) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found or does not have a staff record'
                });
            }
            const existingAssignment = await holiday_duty_roster_model_1.default.findByHolidayAndUser(holiday_id, user_id);
            if (existingAssignment) {
                return res.status(409).json({
                    success: false,
                    message: 'User is already assigned to this holiday duty roster'
                });
            }
            const rosterData = {
                holiday_id,
                user_id,
                shift_start_time,
                shift_end_time,
                notes: notes || null
            };
            const newRoster = await holiday_duty_roster_model_1.default.create(rosterData);
            return res.status(201).json({
                success: true,
                message: 'Staff member added to holiday duty roster successfully',
                data: { roster: newRoster }
            });
        }
        catch (error) {
            console.error('Create holiday duty roster error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    static async getByHolidayId(req, res) {
        try {
            const holidayId = parseInt(req.params.holidayId);
            const roster = await holiday_duty_roster_model_1.default.findByHolidayId(holidayId);
            const rosterWithDetails = await Promise.all(roster.map(async (entry) => {
                const staff = await staff_model_1.default.findByUserId(entry.user_id);
                return {
                    ...entry,
                    staff: staff || null
                };
            }));
            return res.status(200).json({
                success: true,
                data: { roster: rosterWithDetails }
            });
        }
        catch (error) {
            console.error('Get holiday duty roster error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    static async getByUserId(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const roster = await holiday_duty_roster_model_1.default.findByUserId(userId);
            const rosterWithDetails = await Promise.all(roster.map(async (entry) => {
                const holiday = await holiday_model_1.default.findById(entry.holiday_id);
                return {
                    ...entry,
                    holiday: holiday || null
                };
            }));
            return res.status(200).json({
                success: true,
                data: { roster: rosterWithDetails }
            });
        }
        catch (error) {
            console.error('Get user holiday duty roster error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    static async update(req, res) {
        try {
            const id = parseInt(req.params.id);
            const { shift_start_time, shift_end_time, notes } = req.body;
            const existingRoster = await holiday_duty_roster_model_1.default.findById(id);
            if (!existingRoster) {
                return res.status(404).json({
                    success: false,
                    message: 'Holiday duty roster entry not found'
                });
            }
            const updateData = {
                ...(shift_start_time && { shift_start_time }),
                ...(shift_end_time && { shift_end_time }),
                ...(notes !== undefined && { notes })
            };
            const updatedRoster = await holiday_duty_roster_model_1.default.update(id, updateData);
            return res.status(200).json({
                success: true,
                message: 'Holiday duty roster updated successfully',
                data: { roster: updatedRoster }
            });
        }
        catch (error) {
            console.error('Update holiday duty roster error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    static async delete(req, res) {
        try {
            const id = parseInt(req.params.id);
            const existingRoster = await holiday_duty_roster_model_1.default.findById(id);
            if (!existingRoster) {
                return res.status(404).json({
                    success: false,
                    message: 'Holiday duty roster entry not found'
                });
            }
            await holiday_duty_roster_model_1.default.delete(id);
            return res.status(200).json({
                success: true,
                message: 'Staff member removed from holiday duty roster successfully'
            });
        }
        catch (error) {
            console.error('Delete holiday duty roster error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    static async bulkCreate(req, res) {
        try {
            const { holiday_id, assignments } = req.body;
            if (!holiday_id || !assignments || !Array.isArray(assignments)) {
                return res.status(400).json({
                    success: false,
                    message: 'holiday_id and assignments array are required'
                });
            }
            const holiday = await holiday_model_1.default.findById(holiday_id);
            if (!holiday) {
                return res.status(404).json({
                    success: false,
                    message: 'Holiday not found'
                });
            }
            for (const assignment of assignments) {
                if (!assignment.user_id || !assignment.shift_start_time || !assignment.shift_end_time) {
                    return res.status(400).json({
                        success: false,
                        message: 'Each assignment must have user_id, shift_start_time, and shift_end_time'
                    });
                }
                const staff = await staff_model_1.default.findByUserId(assignment.user_id);
                if (!staff) {
                    return res.status(404).json({
                        success: false,
                        message: `User ${assignment.user_id} not found or does not have a staff record`
                    });
                }
            }
            const rosterDataArray = assignments.map((assignment) => ({
                holiday_id,
                user_id: assignment.user_id,
                shift_start_time: assignment.shift_start_time,
                shift_end_time: assignment.shift_end_time,
                notes: assignment.notes || null
            }));
            const createdRosters = await holiday_duty_roster_model_1.default.bulkCreate(rosterDataArray);
            return res.status(201).json({
                success: true,
                message: `Successfully added ${createdRosters.length} staff member(s) to holiday duty roster`,
                data: { rosters: createdRosters }
            });
        }
        catch (error) {
            console.error('Bulk create holiday duty roster error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    static async getAll(req, res) {
        try {
            const roster = await holiday_duty_roster_model_1.default.findAll();
            const rosterWithDetails = await Promise.all(roster.map(async (entry) => {
                const [holiday, staff] = await Promise.all([
                    holiday_model_1.default.findById(entry.holiday_id),
                    staff_model_1.default.findByUserId(entry.user_id)
                ]);
                return {
                    ...entry,
                    holiday: holiday || null,
                    staff: staff || null
                };
            }));
            return res.status(200).json({
                success: true,
                data: { roster: rosterWithDetails }
            });
        }
        catch (error) {
            console.error('Get all holiday duty rosters error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}
exports.default = HolidayDutyRosterController;
//# sourceMappingURL=holiday-duty-roster.controller.js.map