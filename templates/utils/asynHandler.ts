import { Request, Response, NextFunction } from 'express';

export const catcher = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any> | any) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);