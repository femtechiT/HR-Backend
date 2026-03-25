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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BirthdayNotificationWorker = void 0;
const database_1 = require("../config/database");
class BirthdayNotificationWorker {
    static async processBirthdayNotifications() {
        console.log('Starting birthday notification processing...');
        try {
            try {
                await database_1.pool.execute('SELECT 1 FROM staff LIMIT 1');
                await database_1.pool.execute('SELECT 1 FROM users LIMIT 1');
                await database_1.pool.execute('SELECT 1 FROM branches LIMIT 1');
            }
            catch (tableError) {
                if (tableError.errno === 1146) {
                    console.warn('Required tables not found, skipping birthday notifications until database is initialized');
                    return;
                }
                throw tableError;
            }
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
            const day = String(tomorrow.getDate()).padStart(2, '0');
            const query = `
        SELECT
          s.id as staff_id,
          s.employee_id,
          u.full_name,
          u.email,
          s.designation,
          s.department as department_name,
          b.name as branch_name,
          u.date_of_birth
        FROM staff s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN branches b ON s.branch_id = b.id
        WHERE
          DATE_FORMAT(u.date_of_birth, '%m-%d') = ?
          AND s.status = 'active'
      `;
            const [birthdayEmployees] = await database_1.pool.execute(query, [`${month}-${day}`]);
            console.log(`Found ${birthdayEmployees.length} employees with birthdays tomorrow`);
            if (birthdayEmployees.length > 0) {
                const [hrPersonnel] = await database_1.pool.execute(`SELECT u.id, u.full_name, u.email
           FROM users u
           JOIN user_roles ur ON u.id = ur.user_id
           JOIN roles r ON ur.role_id = r.id
           WHERE r.name IN ('HR Manager', 'HR Administrator', 'Administrator', 'Super Admin')
             AND u.status = 'active'`);
                console.log(`Found ${hrPersonnel.length} HR personnel to notify`);
                for (const hr of hrPersonnel) {
                    for (const employee of birthdayEmployees) {
                        try {
                            const { NotificationService } = await Promise.resolve().then(() => __importStar(require('../services/notification.service')));
                            const notificationService = new NotificationService();
                            await notificationService.queueNotification(hr.id, 'birthday_reminder', {
                                employee_name: employee.full_name,
                                employee_id: employee.employee_id,
                                designation: employee.designation,
                                department: employee.department_name || 'N/A',
                                branch: employee.branch_name || 'N/A',
                                date_of_birth: employee.date_of_birth ? new Date(employee.date_of_birth).toLocaleDateString() : 'N/A',
                                company_name: (process.env.COMPANY_NAME && process.env.COMPANY_NAME !== 'undefined') ? process.env.COMPANY_NAME : 'Our Company',
                                tomorrow_date: tomorrow.toLocaleDateString()
                            }, {
                                channel: 'email',
                                priority: 'normal'
                            });
                            console.log(`Birthday notification queued for HR: ${hr.full_name}, Employee: ${employee.full_name}`);
                        }
                        catch (notificationError) {
                            console.error(`Error queuing birthday notification for ${employee.full_name} to ${hr.full_name}:`, notificationError);
                        }
                    }
                }
                if (hrPersonnel.length > 0) {
                    const birthdayList = birthdayEmployees.map((emp) => ({
                        name: emp.full_name,
                        id: emp.employee_id,
                        designation: emp.designation,
                        department: emp.department_name || 'N/A'
                    }));
                    for (const hr of hrPersonnel) {
                        try {
                            const { NotificationService } = await Promise.resolve().then(() => __importStar(require('../services/notification.service')));
                            const notificationService = new NotificationService();
                            await notificationService.queueNotification(hr.id, 'birthday_summary', {
                                birthday_list: birthdayList,
                                date: tomorrow.toLocaleDateString(),
                                company_name: (process.env.COMPANY_NAME && process.env.COMPANY_NAME !== 'undefined') ? process.env.COMPANY_NAME : 'Our Company'
                            }, {
                                channel: 'email',
                                priority: 'normal'
                            });
                            console.log(`Birthday summary notification queued for HR: ${hr.full_name}`);
                        }
                        catch (summaryError) {
                            console.error(`Error queuing birthday summary notification for ${hr.full_name}:`, summaryError);
                        }
                    }
                }
            }
            else {
                console.log('No birthdays found for tomorrow');
            }
            console.log('Birthday notification processing completed successfully');
        }
        catch (error) {
            console.error('Error in birthday notification worker:', error);
            throw error;
        }
    }
    static startWorker() {
        console.log('Starting birthday notification worker...');
        this.processBirthdayNotifications().catch(error => {
            console.error('Error running birthday notification worker on startup:', error);
        });
        setInterval(() => {
            this.processBirthdayNotifications().catch(error => {
                console.error('Error running birthday notification worker:', error);
            });
        }, 24 * 60 * 60 * 1000);
    }
}
exports.BirthdayNotificationWorker = BirthdayNotificationWorker;
if (typeof require !== 'undefined' && require.main === module) {
    BirthdayNotificationWorker.startWorker();
}
//# sourceMappingURL=birthday-notification.worker.js.map