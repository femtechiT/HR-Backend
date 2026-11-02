import { Request, Response } from 'express';
export declare const getAllUsers: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const resetUserPassword: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateUserRole: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getUserById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const terminateUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const softDeleteUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const restoreUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getUserPermissions: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const addUserPermission: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const removeUserPermission: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=user.controller.d.ts.map