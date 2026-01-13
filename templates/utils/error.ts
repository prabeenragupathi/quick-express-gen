import { Request, Response, NextFunction } from 'express';
import { NODE_ENV } from "#config/env.ts";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.message =
    err.message || "Something went wrong. 500 internal server error";

  if (NODE_ENV === "development") console.log(err);

  res.status(err.statusCode).json({
    error: err.message,
    ...(NODE_ENV === "development" && { stack: err.stack }),
  });
};

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;

    Error.captureStackTrace(this, this.constructor);
  }
}