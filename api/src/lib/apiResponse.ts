import type { Response } from "express";

/**
 * Standard API response envelope shared across every module.
 * Documented in CONTRACTS.md — do not change the shape without updating it.
 *
 * Success: { success: true, data: <payload> }
 * Failure: { success: false, error: { code, message, details? } }
 */
export interface SuccessEnvelope<T> {
  success: true;
  data: T;
}

export interface ErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiEnvelope<T> = SuccessEnvelope<T> | ErrorEnvelope;

/** Build a success envelope. */
export const ok = <T>(data: T): SuccessEnvelope<T> => ({
  success: true,
  data,
});

/** Build an error envelope. */
export const fail = (
  code: string,
  message: string,
  details?: unknown,
): ErrorEnvelope => ({
  success: false,
  error: { code, message, ...(details !== undefined ? { details } : {}) },
});

/** Send a success envelope with an optional HTTP status (defaults to 200). */
export const sendOk = <T>(res: Response, data: T, status = 200): Response =>
  res.status(status).json(ok(data));

/** Send an error envelope with an explicit HTTP status. */
export const sendFail = (
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown,
): Response => res.status(status).json(fail(code, message, details));

/**
 * Application error that the global error handler converts into the standard
 * error envelope. Throw this from anywhere in a request lifecycle.
 */
export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(400, "BAD_REQUEST", message, details);
  }

  static unauthorized(message = "Unauthorized"): AppError {
    return new AppError(401, "UNAUTHORIZED", message);
  }

  static forbidden(message = "Forbidden"): AppError {
    return new AppError(403, "FORBIDDEN", message);
  }

  static notFound(message = "Resource not found"): AppError {
    return new AppError(404, "NOT_FOUND", message);
  }

  static conflict(message: string, details?: unknown): AppError {
    return new AppError(409, "CONFLICT", message, details);
  }
}
