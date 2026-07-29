import { Request, Response, NextFunction } from 'express';
export declare function requestLogger(req: Request, res: Response, next: NextFunction): void;
export declare function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void;
export declare function corsMiddleware(req: Request, res: Response, next: NextFunction): any;
export declare function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<any>;
//# sourceMappingURL=middleware.d.ts.map