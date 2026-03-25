"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPayrollReady = exports.sendStaffInvitationEmail = exports.sendWelcomeEmail = exports.sendGenericEmail = void 0;
const resend_1 = require("resend");
const email_service_1 = require("./email.service");
Object.defineProperty(exports, "sendWelcomeEmail", { enumerable: true, get: function () { return email_service_1.sendWelcomeEmail; } });
Object.defineProperty(exports, "sendStaffInvitationEmail", { enumerable: true, get: function () { return email_service_1.sendStaffInvitationEmail; } });
Object.defineProperty(exports, "sendPayrollReady", { enumerable: true, get: function () { return email_service_1.sendPayrollReady; } });
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
const sendGenericEmail = async ({ to, subject, html }) => {
    try {
        const { error } = await resend.emails.send({
            from: process.env.FROM_EMAIL || 'noreply@tripa.com.ng',
            to: to,
            subject: subject,
            html: html
        });
        if (error) {
            console.error('Error sending email:', error);
            throw new Error(`Failed to send email: ${error.message}`);
        }
        console.log(`Email sent successfully to ${to}`);
    }
    catch (error) {
        console.error('Unexpected error sending email:', error);
        throw error;
    }
};
exports.sendGenericEmail = sendGenericEmail;
//# sourceMappingURL=generic-email.service.js.map