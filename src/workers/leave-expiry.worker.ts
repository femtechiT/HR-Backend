import { pool } from '../config/database';
import { notificationService } from '../services/notification.service';

/**
 * Leave Expiry Worker
 * This worker runs daily to check for leaves approaching expiry and process expired leaves
 */

export class LeaveExpiryWorker {
  /**
   * Process leave expiry notifications and actions
   */
  static async processLeaveExpiries(): Promise<void> {
    console.log('Starting leave expiry processing...');
    
    try {
      // First, process warning notifications for leaves approaching expiry
      await this.processLeaveExpiryWarnings();
      
      // Then, process actual expired leaves
      await this.processExpiredLeaves();
      
      console.log('Leave expiry processing completed successfully');
    } catch (error) {
      console.error('Error in leave expiry worker:', error);
      throw error;
    }
  }

  /**
   * Process warning notifications for leaves approaching expiry
   */
  private static async processLeaveExpiryWarnings(): Promise<void> {
    console.log('Processing leave expiry warnings...');
    
    try {
      // Find leave allocations that are approaching expiry
      // We'll look for leaves that will expire within the next 7 days
      const daysBeforeExpiry = 7;
      
      const query = `
        SELECT 
          la.id as allocation_id,
          la.user_id,
          la.leave_type_id,
          lt.name as leave_type_name,
          la.cycle_end_date,
          la.allocated_days,
          la.used_days,
          (la.allocated_days - la.used_days) as remaining_days
        FROM leave_allocations la
        JOIN leave_types lt ON la.leave_type_id = lt.id
        WHERE 
          la.cycle_end_date BETWEEN DATE_ADD(CURDATE(), INTERVAL 1 DAY) AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
          AND la.allocated_days > la.used_days  -- Only process allocations with remaining days
          AND lt.is_active = 1
      `;
      
      const [rows]: any = await pool.execute(query, [daysBeforeExpiry]);
      
      console.log(`Found ${rows.length} leave allocations approaching expiry`);
      
      for (const allocation of rows) {
        try {
          // Get user details
          const [userRows]: any = await pool.execute(
            'SELECT full_name, email FROM users WHERE id = ?',
            [allocation.user_id]
          );
          
          if (userRows.length === 0) {
            console.warn(`User with ID ${allocation.user_id} not found for leave expiry warning`);
            continue;
          }
          
          const user = userRows[0];
          
          // Queue expiry warning notification
          await notificationService.queueNotification(
            allocation.user_id,
            'leave_expiry_warning',
            {
              staff_name: user.full_name,
              days_remaining: allocation.remaining_days,
              leave_type: allocation.leave_type_name,
              expiry_date: allocation.cycle_end_date,
              company_name: process.env.APP_NAME || 'Our Company'
            }
          );
          
          console.log(`Queued expiry warning for user ${allocation.user_id} (${user.full_name}) for ${allocation.leave_type_name} leave expiring on ${allocation.cycle_end_date}`);
        } catch (error) {
          console.error(`Error processing expiry warning for allocation ${allocation.allocation_id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error processing leave expiry warnings:', error);
      throw error;
    }
  }

  /**
   * Process expired leaves according to company policy
   */
  private static async processExpiredLeaves(): Promise<void> {
    console.log('Processing expired leaves...');
    
    try {
      // Find leave allocations that expired yesterday or earlier
      const query = `
        SELECT 
          la.id as allocation_id,
          la.user_id,
          la.leave_type_id,
          lt.name as leave_type_name,
          lt.allow_carryover,
          lt.carryover_limit,
          la.cycle_end_date,
          la.allocated_days,
          la.used_days,
          la.carried_over_days,
          la.expiry_rule_id,
          ler.name as expiry_rule_name,
          ler.expire_after_days,
          ler.trigger_notification_days,
          ler.auto_expire_action
        FROM leave_allocations la
        JOIN leave_types lt ON la.leave_type_id = lt.id
        LEFT JOIN leave_expiry_rules ler ON la.expiry_rule_id = ler.id
        WHERE 
          la.cycle_end_date < CURDATE()
          AND la.allocated_days > la.used_days  -- Only process allocations with remaining days
          AND lt.is_active = 1
          AND la.processed_for_expiry IS NULL  -- Only process unprocessed expired allocations
      `;
      
      const [rows]: any = await pool.execute(query);
      
      console.log(`Found ${rows.length} expired leave allocations to process`);
      
      for (const allocation of rows) {
        try {
          // Determine the action based on expiry rule or default behavior
          let action = allocation.auto_expire_action || 'expire'; // Default to expiring unused leave
          
          // Process the expired leave based on the action
          switch (action) {
            case 'expire':
              await this.handleExpireAction(allocation);
              break;
              
            case 'carryover':
              await this.handleCarryoverAction(allocation);
              break;
              
            case 'convert_to_cash':
              await this.handleConvertToCashAction(allocation);
              break;
              
            default:
              console.warn(`Unknown expiry action '${action}' for allocation ${allocation.allocation_id}, defaulting to expire`);
              await this.handleExpireAction(allocation);
          }
          
          // Mark the allocation as processed
          await pool.execute(
            'UPDATE leave_allocations SET processed_for_expiry = NOW() WHERE id = ?',
            [allocation.allocation_id]
          );
          
          console.log(`Processed expired leave allocation ${allocation.allocation_id} with action: ${action}`);
        } catch (error) {
          console.error(`Error processing expired leave allocation ${allocation.allocation_id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error processing expired leaves:', error);
      throw error;
    }
  }

  /**
   * Handle expiry action - mark remaining days as used (expired)
   */
  private static async handleExpireAction(allocation: any): Promise<void> {
    // Get user details
    const [userRows]: any = await pool.execute(
      'SELECT id, full_name, email FROM users WHERE id = ?',
      [allocation.user_id]
    );
    
    if (userRows.length === 0) {
      console.warn(`User with ID ${allocation.user_id} not found for expiry action`);
      return;
    }
    
    const user = userRows[0];
    
    // Calculate how many days are expiring
    const expiringDays = allocation.allocated_days - allocation.used_days;
    
    // Update the allocation to mark days as used (expired)
    await pool.execute(
      `UPDATE leave_allocations 
       SET used_days = allocated_days, 
           updated_at = NOW() 
       WHERE id = ?`,
      [allocation.allocation_id]
    );
    
    // Log the expiry in leave history
    await pool.execute(
      `INSERT INTO leave_history 
       (user_id, leave_type_id, start_date, end_date, days_taken, reason, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        allocation.user_id,
        allocation.leave_type_id,
        allocation.cycle_end_date, // Use expiry date as start date
        allocation.cycle_end_date, // Use expiry date as end date
        expiringDays,
        `Annual leave expired (policy: ${allocation.expiry_rule_name || 'default'})`,
        'expired'
      ]
    );
    
    console.log(`Expired ${expiringDays} days of ${allocation.leave_type_name} for user ${user.full_name}`);
  }

  /**
   * Handle carryover action - carry unused days to next cycle
   */
  private static async handleCarryoverAction(allocation: any): Promise<void> {
    // Get user details
    const [userRows]: any = await pool.execute(
      'SELECT id, full_name, email FROM users WHERE id = ?',
      [allocation.user_id]
    );
    
    if (userRows.length === 0) {
      console.warn(`User with ID ${allocation.user_id} not found for carryover action`);
      return;
    }
    
    const user = userRows[0];
    
    // Calculate how many days can be carried over
    const remainingDays = allocation.allocated_days - allocation.used_days;
    const maxCarryover = allocation.carryover_limit || 0;
    const daysToCarryover = Math.min(remainingDays, maxCarryover);
    
    if (daysToCarryover <= 0) {
      // If no days can be carried over, expire the rest
      await this.handleExpireAction(allocation);
      return;
    }
    
    // Update the current allocation to mark excess days as used
    const daysToExpire = remainingDays - daysToCarryover;
    if (daysToExpire > 0) {
      await pool.execute(
        `UPDATE leave_allocations 
         SET used_days = used_days + ? 
         WHERE id = ?`,
        [daysToExpire, allocation.allocation_id]
      );
      
      // Log the expired days in leave history
      await pool.execute(
        `INSERT INTO leave_history 
         (user_id, leave_type_id, start_date, end_date, days_taken, reason, status, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          allocation.user_id,
          allocation.leave_type_id,
          allocation.cycle_end_date, // Use expiry date as start date
          allocation.cycle_end_date, // Use expiry date as end date
          daysToExpire,
          `Annual leave expired (exceeds carryover limit)`,
          'expired'
        ]
      );
    }
    
    // Create a new allocation for the carried-over days
    const nextCycleStart = new Date(allocation.cycle_end_date);
    nextCycleStart.setFullYear(nextCycleStart.getFullYear() + 1);
    
    const nextCycleEnd = new Date(nextCycleStart);
    nextCycleEnd.setDate(nextCycleEnd.getDate() + 364); // Approximately one year
    
    await pool.execute(
      `INSERT INTO leave_allocations 
       (user_id, leave_type_id, cycle_start_date, cycle_end_date, allocated_days, used_days, carried_over_days, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        allocation.user_id,
        allocation.leave_type_id,
        nextCycleStart.toISOString().split('T')[0],
        nextCycleEnd.toISOString().split('T')[0],
        daysToCarryover,
        0, // No days used yet
        daysToCarryover // Mark as carried over
      ]
    );
    
    console.log(`Carried over ${daysToCarryover} days of ${allocation.leave_type_name} for user ${user.full_name}`);
  }

  /**
   * Handle convert to cash action - create payroll adjustment for unused leave
   */
  private static async handleConvertToCashAction(allocation: any): Promise<void> {
    // Get user details
    const [userRows]: any = await pool.execute(
      'SELECT id, full_name, email FROM users WHERE id = ?',
      [allocation.user_id]
    );
    
    if (userRows.length === 0) {
      console.warn(`User with ID ${allocation.user_id} not found for convert to cash action`);
      return;
    }
    
    const user = userRows[0];
    
    // Calculate how many days to convert to cash
    const daysToConvert = allocation.allocated_days - allocation.used_days;
    
    // In a real implementation, we would:
    // 1. Calculate the monetary value of the unused leave days
    // 2. Create a payroll adjustment record
    // 3. Mark the leave days as used
    
    // For now, we'll just log the action and mark days as used
    await pool.execute(
      `UPDATE leave_allocations 
       SET used_days = allocated_days, 
           updated_at = NOW() 
       WHERE id = ?`,
      [allocation.allocation_id]
    );
    
    // Log the conversion in leave history
    await pool.execute(
      `INSERT INTO leave_history 
       (user_id, leave_type_id, start_date, end_date, days_taken, reason, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        allocation.user_id,
        allocation.leave_type_id,
        allocation.cycle_end_date, // Use expiry date as start date
        allocation.cycle_end_date, // Use expiry date as end date
        daysToConvert,
        `Leave converted to cash (policy: ${allocation.expiry_rule_name || 'default'})`,
        'converted'
      ]
    );
    
    console.log(`Converted ${daysToConvert} days of ${allocation.leave_type_name} to cash for user ${user.full_name}`);
  }

  /**
   * Start the worker interval
   */
  static startWorker(intervalMinutes: number = 60): void {
    console.log(`Starting leave expiry worker with ${intervalMinutes}-minute intervals...`);
    
    // Run immediately on startup
    this.processLeaveExpiries().catch(error => {
      console.error('Error running leave expiry worker on startup:', error);
    });
    
    // Then run at specified intervals
    setInterval(() => {
      this.processLeaveExpiries().catch(error => {
        console.error('Error running leave expiry worker:', error);
      });
    }, intervalMinutes * 60 * 1000); // Convert minutes to milliseconds
  }
}

// If this file is run directly, start the worker
if (require.main === module) {
  LeaveExpiryWorker.startWorker(1440); // Run daily (1440 minutes = 24 hours)
}