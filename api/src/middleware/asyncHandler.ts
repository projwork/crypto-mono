import type { NextFunction, Request, Response, RequestHandler } from "express";

/**
 * Wraps an async route handler so any rejected promise is forwarded to the
 * global error handler instead of crashing the process.
 */
export const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
