import type { Request, Response } from "express";
import { sendFail } from "../lib/apiResponse.js";

/** Catch-all for unmatched routes — returns the standard error envelope. */
export const notFound = (req: Request, res: Response): void => {
  sendFail(res, 404, "NOT_FOUND", `Route not found: ${req.method} ${req.originalUrl}`);
};
