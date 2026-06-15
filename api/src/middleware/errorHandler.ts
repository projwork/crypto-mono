import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError, fail } from "../lib/apiResponse.js";
import { isProduction } from "../config/index.js";

/**
 * Global error handler. Converts thrown errors into the standard error
 * envelope. Must be registered last, after all routes.
 */
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.status).json(fail(err.code, err.message, err.details));
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json(fail("VALIDATION_ERROR", "Invalid request payload", err.flatten()));
    return;
  }

  const message =
    err instanceof Error ? err.message : "An unexpected error occurred";

  // Log the full error server-side for debugging.
  console.error("[error]", err);

  res.status(500).json(
    fail(
      "INTERNAL_SERVER_ERROR",
      isProduction ? "An unexpected error occurred" : message,
    ),
  );
};
