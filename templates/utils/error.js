import { NODE_ENV } from "@config/env";

export const errorHandler = (err, req, res, next) => {
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
  constructor(statusCode, message) {
    super();
    this.statusCode = statusCode;
    this.message = message;

    Error.captureStackTrace(this, this.constructor);
  }
}
