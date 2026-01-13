import mongoose, { ClientSession } from "mongoose";
import { Request, Response, NextFunction } from 'express';

export const useTransaction = (fn: (req: Request, res: Response, next: NextFunction, session: ClientSession) => Promise<any>) => async (req: Request, res: Response, next: NextFunction) => {
  const session = await mongoose.startSession();
  try {
    await session.startTransaction();
    await fn(req, res, next, session);
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    await session.endSession();
  }
};