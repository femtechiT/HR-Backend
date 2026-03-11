import { Request, Response } from 'express';
import HolidayDutyRosterModel, { HolidayDutyRosterInput } from '../models/holiday-duty-roster.model';
import HolidayModel from '../models/holiday.model';
import StaffModel from '../models/staff.model';

class HolidayDutyRosterController {
  /**
   * Add a staff member to holiday duty roster
   * POST /api/holiday-duty-roster
   */
  static async create(req: Request, res: Response) {
    try {
      const { holiday_id, user_id, shift_start_time, shift_end_time, notes } = req.body;

      // Validate required fields
      if (!holiday_id || !user_id || !shift_start_time || !shift_end_time) {
        return res.status(400).json({
          success: false,
          message: 'holiday_id, user_id, shift_start_time, and shift_end_time are required'
        });
      }

      // Verify holiday exists
      const holiday = await HolidayModel.findById(holiday_id);
      if (!holiday) {
        return res.status(404).json({
          success: false,
          message: 'Holiday not found'
        });
      }

      // Verify user exists and has staff record
      const staff = await StaffModel.findByUserId(user_id);
      if (!staff) {
        return res.status(404).json({
          success: false,
          message: 'User not found or does not have a staff record'
        });
      }

      // Check if user is already assigned to this holiday
      const existingAssignment = await HolidayDutyRosterModel.findByHolidayAndUser(holiday_id, user_id);
      if (existingAssignment) {
        return res.status(409).json({
          success: false,
          message: 'User is already assigned to this holiday duty roster'
        });
      }

      // Create the roster entry
      const rosterData: HolidayDutyRosterInput = {
        holiday_id,
        user_id,
        shift_start_time,
        shift_end_time,
        notes: notes || null
      };

      const newRoster = await HolidayDutyRosterModel.create(rosterData);

      return res.status(201).json({
        success: true,
        message: 'Staff member added to holiday duty roster successfully',
        data: { roster: newRoster }
      });
    } catch (error) {
      console.error('Create holiday duty roster error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get all staff assigned to a specific holiday
   * GET /api/holiday-duty-roster/:holidayId
   */
  static async getByHolidayId(req: Request, res: Response) {
    try {
      const holidayId = parseInt(req.params.holidayId as string);

      const roster = await HolidayDutyRosterModel.findByHolidayId(holidayId);

      // Get staff details for each roster entry
      const rosterWithDetails = await Promise.all(
        roster.map(async (entry) => {
          const staff = await StaffModel.findByUserId(entry.user_id);
          return {
            ...entry,
            staff: staff || null
          };
        })
      );

      return res.status(200).json({
        success: true,
        data: { roster: rosterWithDetails }
      });
    } catch (error) {
      console.error('Get holiday duty roster error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get all holiday assignments for a specific user
   * GET /api/holiday-duty-roster/user/:userId
   */
  static async getByUserId(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId as string);

      const roster = await HolidayDutyRosterModel.findByUserId(userId);

      // Get holiday details for each roster entry
      const rosterWithDetails = await Promise.all(
        roster.map(async (entry) => {
          const holiday = await HolidayModel.findById(entry.holiday_id);
          return {
            ...entry,
            holiday: holiday || null
          };
        })
      );

      return res.status(200).json({
        success: true,
        data: { roster: rosterWithDetails }
      });
    } catch (error) {
      console.error('Get user holiday duty roster error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update a holiday duty roster entry
   * PUT /api/holiday-duty-roster/:id
   */
  static async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      const { shift_start_time, shift_end_time, notes } = req.body;

      // Verify roster entry exists
      const existingRoster = await HolidayDutyRosterModel.findById(id);
      if (!existingRoster) {
        return res.status(404).json({
          success: false,
          message: 'Holiday duty roster entry not found'
        });
      }

      // Update the roster entry
      const updateData = {
        ...(shift_start_time && { shift_start_time }),
        ...(shift_end_time && { shift_end_time }),
        ...(notes !== undefined && { notes })
      };

      const updatedRoster = await HolidayDutyRosterModel.update(id, updateData);

      return res.status(200).json({
        success: true,
        message: 'Holiday duty roster updated successfully',
        data: { roster: updatedRoster }
      });
    } catch (error) {
      console.error('Update holiday duty roster error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Remove a staff member from holiday duty roster
   * DELETE /api/holiday-duty-roster/:id
   */
  static async delete(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);

      // Verify roster entry exists
      const existingRoster = await HolidayDutyRosterModel.findById(id);
      if (!existingRoster) {
        return res.status(404).json({
          success: false,
          message: 'Holiday duty roster entry not found'
        });
      }

      // Delete the roster entry
      await HolidayDutyRosterModel.delete(id);

      return res.status(200).json({
        success: true,
        message: 'Staff member removed from holiday duty roster successfully'
      });
    } catch (error) {
      console.error('Delete holiday duty roster error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Bulk add multiple staff members to holiday duty roster
   * POST /api/holiday-duty-roster/bulk
   */
  static async bulkCreate(req: Request, res: Response) {
    try {
      const { holiday_id, assignments } = req.body;

      // Validate required fields
      if (!holiday_id || !assignments || !Array.isArray(assignments)) {
        return res.status(400).json({
          success: false,
          message: 'holiday_id and assignments array are required'
        });
      }

      // Verify holiday exists
      const holiday = await HolidayModel.findById(holiday_id);
      if (!holiday) {
        return res.status(404).json({
          success: false,
          message: 'Holiday not found'
        });
      }

      // Validate each assignment
      for (const assignment of assignments) {
        if (!assignment.user_id || !assignment.shift_start_time || !assignment.shift_end_time) {
          return res.status(400).json({
            success: false,
            message: 'Each assignment must have user_id, shift_start_time, and shift_end_time'
          });
        }

        // Verify user exists and has staff record
        const staff = await StaffModel.findByUserId(assignment.user_id);
        if (!staff) {
          return res.status(404).json({
            success: false,
            message: `User ${assignment.user_id} not found or does not have a staff record`
          });
        }
      }

      // Create roster entries
      const rosterDataArray: HolidayDutyRosterInput[] = assignments.map((assignment: any) => ({
        holiday_id,
        user_id: assignment.user_id,
        shift_start_time: assignment.shift_start_time,
        shift_end_time: assignment.shift_end_time,
        notes: assignment.notes || null
      }));

      const createdRosters = await HolidayDutyRosterModel.bulkCreate(rosterDataArray);

      return res.status(201).json({
        success: true,
        message: `Successfully added ${createdRosters.length} staff member(s) to holiday duty roster`,
        data: { rosters: createdRosters }
      });
    } catch (error) {
      console.error('Bulk create holiday duty roster error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get all holiday duty rosters
   * GET /api/holiday-duty-roster
   */
  static async getAll(req: Request, res: Response) {
    try {
      const roster = await HolidayDutyRosterModel.findAll();

      // Get holiday and staff details for each roster entry
      const rosterWithDetails = await Promise.all(
        roster.map(async (entry) => {
          const [holiday, staff] = await Promise.all([
            HolidayModel.findById(entry.holiday_id),
            StaffModel.findByUserId(entry.user_id)
          ]);
          return {
            ...entry,
            holiday: holiday || null,
            staff: staff || null
          };
        })
      );

      return res.status(200).json({
        success: true,
        data: { roster: rosterWithDetails }
      });
    } catch (error) {
      console.error('Get all holiday duty rosters error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

export default HolidayDutyRosterController;
