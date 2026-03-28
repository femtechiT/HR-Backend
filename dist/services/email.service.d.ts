interface WelcomeEmailProps {
    to: string;
    fullName: string;
}
export declare const sendWelcomeEmail: ({ to, fullName }: WelcomeEmailProps) => Promise<void>;
interface StaffInvitationEmailProps {
    to: string;
    fullName: string;
    workEmail: string;
    temporaryPassword: string;
    invitationToken: string;
    fromAdmin: string;
}
export declare const sendStaffInvitationEmail: ({ to, fullName, workEmail, temporaryPassword, invitationToken, fromAdmin }: StaffInvitationEmailProps) => Promise<void>;
interface PayrollReadyEmailProps {
    to: string;
    month: string;
    year: number;
}
export declare const sendPayrollReady: ({ to, month, year }: PayrollReadyEmailProps) => Promise<{
    success: boolean;
    error?: string;
}>;
export {};
//# sourceMappingURL=email.service.d.ts.map