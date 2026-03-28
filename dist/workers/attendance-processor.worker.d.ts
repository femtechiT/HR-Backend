declare class AttendanceProcessorWorker {
    private static isRunning;
    private static lastCheckTime;
    private static processedDates;
    static processAttendanceForDate(date: Date, branchId?: number): Promise<{
        processed: number;
        absent: number;
        leave: number;
        skipped: number;
    }>;
    static processYesterdayAttendance(): Promise<{
        processed: number;
        absent: number;
        leave: number;
        skipped: number;
    }>;
    static processTodayAttendance(): Promise<{
        processed: number;
        absent: number;
        leave: number;
        skipped: number;
    }>;
    static checkAndRunAutoMark(): Promise<void>;
    static lockAttendanceForDate(branchId: number, date: Date, lockedBy: number, reason?: string): Promise<{
        lockedCount: any;
    }>;
    static start(): Promise<void>;
    static getStatus(): {
        isRunning: boolean;
        lastCheckTime: Date;
        processedDates: string[];
    };
}
export default AttendanceProcessorWorker;
//# sourceMappingURL=attendance-processor.worker.d.ts.map