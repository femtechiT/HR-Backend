import { Request, Response } from 'express';
export declare const getAllShiftTemplates: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getShiftTemplateById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createShiftTemplate: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateShiftTemplate: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteShiftTemplate: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAllEmployeeShiftAssignments: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getEmployeeShiftAssignmentById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const assignShiftToEmployee: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateEmployeeShiftAssignment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const bulkAssignShifts: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const bulkAssignRecurringShifts: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const bulkAssignRecurringShiftsByBranch: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getRecurringShifts: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateRecurringShift: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteRecurringShift: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMyShiftAssignments: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=shift-management.controller.d.ts.map